import { FROM_ADDRESS, REPLY_TO_ADDRESS } from "./constants.ts";
import type { IssueFrontmatter } from "./issue-frontmatter.ts";
import { createBroadcast, createContact, listContacts, sendBroadcast } from "./resend.ts";
import {
  confirmedEmails,
  issueSentAt,
  markUnsubscribedInBulk,
  recordIssueSend,
} from "./subscribers.ts";
import { parseEmail } from "./subscription.ts";
import { issueEmail } from "./templates.ts";
import { SITE_URL } from "../site.ts";

/**
 * Mailing one Issue to the list — the only irreversible act in the newsletter.
 *
 * The counterpart to `test-send.ts`, and deliberately nothing like it: this
 * reads the subscriber list, writes both stores, goes out as a broadcast to
 * everyone on it, and leaves a row in `issue_sends` that refuses a second
 * attempt. A test send does none of those things, which is why it is allowed to
 * be casual and this is not. See docs/adr/0003-issues-are-sent-by-hand.md.
 *
 * Split in two on purpose. `issueSendState` answers "has this gone out, and to
 * how many" from D1 alone — cheap enough for the editor to read every time an
 * Issue is opened, and what the toolbar draws itself from. `sendIssueToList` is
 * the act, and it reads that state again rather than trusting what the dialog
 * was showing: the Issue can have gone out from another tab between the
 * question and the answer.
 */

export interface Issue {
  slug: string;
  frontmatter: IssueFrontmatter;
  markdown: string;
}

/** Where the Issue lives on the web, for the "read in a browser" link. */
export function issueUrl(slug: string): string {
  return `${SITE_URL}/newsletter/${slug}/`;
}

export interface SendState {
  /** When this Issue was sent, or null if it has not been. */
  sentAt: number | null;
  /**
   * Confirmed addresses in D1, which is the count a send is about to mail.
   * Reconciliation can still move it by a few either way — someone who left
   * through Resend, someone whose contact never got created — and the receipt
   * reports what actually went out.
   */
  recipients: number;
}

export async function issueSendState(db: D1Database, slug: string): Promise<SendState> {
  const [sentAt, confirmed] = await Promise.all([issueSentAt(db, slug), confirmedEmails(db)]);
  return { sentAt, recipients: confirmed.length };
}

/**
 * The three reasons a send does not happen. Every one of them is visible
 * before anybody presses anything — the draft flag is in the document, the
 * other two come from `issueSendState` — so the dialog can say why the button
 * is disabled, and the route says the same words back if the state changed
 * underneath.
 */
export type SendRefusal = "draft" | "already-sent" | "no-recipients";

export interface SendCandidate extends SendState {
  draft: boolean;
}

export function decideSend({ draft, sentAt, recipients }: SendCandidate): SendRefusal | "send" {
  if (sentAt !== null) return "already-sent";
  if (draft) return "draft";
  if (recipients === 0) return "no-recipients";
  return "send";
}

export function refusalMessage(refusal: SendRefusal, { sentAt }: SendCandidate): string {
  switch (refusal) {
    case "already-sent":
      return `這一期已經在 ${new Date(sentAt ?? 0).toLocaleString("zh-TW")} 寄出了。要重寄的話，先手動刪掉 issue_sends 那一列。`;
    case "draft":
      return "這一期還是草稿（draft: true），不會寄給訂閱者。要先看看長什麼樣子的話按 Test email。";
    case "no-recipients":
      return "線上名單裡沒有已確認的訂閱者，沒有人可以寄。";
  }
}

export class SendRefused extends Error {
  readonly refusal: SendRefusal;
  /** The state it was refused on, so a caller can report it rather than re-read it. */
  readonly candidate: SendCandidate;

  constructor(refusal: SendRefusal, candidate: SendCandidate) {
    super(refusalMessage(refusal, candidate));
    this.name = "SendRefused";
    this.refusal = refusal;
    this.candidate = candidate;
  }
}

/**
 * Brings the two stores back in line before anything is sent.
 *
 * Both directions, because both can drift. Anyone who unsubscribed through
 * Resend is written back to D1, which is the record that has to be right;
 * anyone confirmed in D1 but missing from the segment — a contact creation that
 * failed at confirmation time — is pushed up so they are not skipped forever.
 */
async function reconcile(db: D1Database, apiKey: string, segmentId: string) {
  const remote = await listContacts(apiKey, segmentId);
  const known = new Set(remote.map((contact) => contact.email.toLowerCase()));

  const goneRemotely = remote
    .filter((contact) => contact.unsubscribed)
    .map((contact) => parseEmail(contact.email))
    .filter((email): email is string => email !== null);
  const gone = new Set(goneRemotely);

  const confirmed = await confirmedEmails(db);
  const staying = confirmed.filter((email) => !gone.has(email));
  const missing = staying.filter((email) => !known.has(email));

  await markUnsubscribedInBulk(db, goneRemotely, Date.now());
  for (const email of missing) {
    await createContact(apiKey, { email, segmentId });
  }

  return {
    recipients: staying.length,
    pulledUnsubscribes: confirmed.length - staying.length,
    pushedToResend: missing.length,
  };
}

export interface SendReceipt {
  broadcastId: string;
  subject: string;
  /** What actually went out, after reconciliation. */
  recipients: number;
  sentAt: number;
  pulledUnsubscribes: number;
  pushedToResend: number;
}

/**
 * Sends it. Throws `SendRefused` when the Issue is not in a state to be mailed,
 * and `ResendError` when Resend turns the broadcast down.
 *
 * `recordIssueSend` runs last and is the reason a second attempt cannot get
 * this far: `issue_slug` is the primary key of `issue_sends`, so even two
 * requests that passed `decideSend` together end with one row and one refusal
 * from SQLite rather than two broadcasts.
 */
export async function sendIssueToList(
  db: D1Database,
  { apiKey, segmentId }: { apiKey: string; segmentId: string },
  issue: Issue,
): Promise<SendReceipt> {
  const candidate: SendCandidate = {
    draft: issue.frontmatter.draft === true,
    ...(await issueSendState(db, issue.slug)),
  };
  const decision = decideSend(candidate);
  if (decision !== "send") throw new SendRefused(decision, candidate);

  const email = issueEmail({
    title: issue.frontmatter.title,
    subtitle: issue.frontmatter.subtitle,
    subject: issue.frontmatter.subject,
    markdown: issue.markdown,
    siteUrl: SITE_URL,
    issueUrl: issueUrl(issue.slug),
    // A broadcast is one template for everyone, so it cannot carry a
    // per-recipient token. Resend swaps this placeholder for a working
    // unsubscribe link per contact, and `reconcile` pulls the result back into
    // D1 before the next send.
    unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
  });

  const { recipients, pulledUnsubscribes, pushedToResend } = await reconcile(db, apiKey, segmentId);
  // Reconciliation can empty a list that D1 said had people on it: everyone
  // left through Resend since the last send.
  if (recipients === 0) throw new SendRefused("no-recipients", { ...candidate, recipients: 0 });

  const broadcast = await createBroadcast(apiKey, {
    segmentId,
    from: FROM_ADDRESS,
    replyTo: REPLY_TO_ADDRESS,
    subject: email.subject,
    html: email.html,
    text: email.text,
    name: `${issue.frontmatter.datetime.slice(0, 10)} ${issue.slug}`,
  });
  await sendBroadcast(apiKey, broadcast.id);

  const sentAt = Date.now();
  await recordIssueSend(db, {
    issueSlug: issue.slug,
    resendBroadcastId: broadcast.id,
    recipientCount: recipients,
    now: sentAt,
  });

  return {
    broadcastId: broadcast.id,
    subject: email.subject,
    recipients,
    sentAt,
    pulledUnsubscribes,
    pushedToResend,
  };
}

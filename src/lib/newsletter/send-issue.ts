import type { IssueFrontmatter } from "./issue-frontmatter.ts";
import type { RemoteBroadcast, RemoteContact } from "./resend.ts";
import { confirmedEmails, issueSentAt } from "./subscribers.ts";
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
 *
 * The act takes its database and its mail provider as a `SendIssueDeps`, the
 * way `handleSubscribe` does, and the route is wiring. Not for the sake of a
 * seam: this is the one path here that cannot be rehearsed against the real
 * thing — every honest run of it mails the list — so the only way to know the
 * order of operations holds, and that a refused send stops before the
 * broadcast rather than after it, is to run it with both stores faked.
 * `send-issue.test.ts` is that run.
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
 * Why a send did not happen.
 *
 * The first three are visible before anybody presses anything — the draft flag
 * is in the document, the other two come from `issueSendState` — so the dialog
 * can say why the button is disabled, and the route says the same words back if
 * the state changed underneath. `half-created` is the exception: only Resend
 * knows it, and only once asked.
 */
export type SendRefusal = "draft" | "already-sent" | "no-recipients" | "half-created";

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
    case "half-created":
      return "Resend 上已經有這一期的 broadcast，但它還沒寄出（status: draft）——上次寄送在建立之後、送出之前斷掉了。到 Resend 上把它送出或刪掉，再回來這裡。";
  }
}

export class SendRefused extends Error {
  readonly refusal: SendRefusal;
  /** When the Issue went out, when that is what the refusal is about. */
  readonly sentAt: number | null;

  constructor(refusal: SendRefusal, candidate: SendCandidate) {
    super(refusalMessage(refusal, candidate));
    this.name = "SendRefused";
    this.refusal = refusal;
    this.sentAt = candidate.sentAt;
  }
}

/** What the broadcast carries. The segment, the from and the reply-to are wiring. */
export interface OutgoingBroadcast {
  subject: string;
  html: string;
  text: string;
  /** How the send is labelled in Resend's own dashboard. */
  name: string;
}

export interface IssueSent {
  issueSlug: string;
  resendBroadcastId: string;
  recipientCount: number;
  now: number;
}

export interface SendIssueDeps {
  now(): number;
  sendState(issueSlug: string): Promise<SendState>;
  /** What Resend already holds under this broadcast name, if anything. */
  findBroadcast(name: string): Promise<RemoteBroadcast | null>;
  confirmedEmails(): Promise<string[]>;
  listContacts(): Promise<RemoteContact[]>;
  createContact(email: string): Promise<void>;
  markUnsubscribed(emails: string[], now: number): Promise<void>;
  createBroadcast(broadcast: OutgoingBroadcast): Promise<{ id: string }>;
  sendBroadcast(broadcastId: string): Promise<void>;
  recordSend(record: IssueSent): Promise<void>;
}

/**
 * Brings the two stores back in line before anything is sent.
 *
 * Both directions, because both can drift. Anyone who unsubscribed through
 * Resend is written back to D1, which is the record that has to be right;
 * anyone confirmed in D1 but missing from the segment — a contact creation that
 * failed at confirmation time — is pushed up so they are not skipped forever.
 */
async function reconcile(deps: SendIssueDeps, now: number) {
  const remote = await deps.listContacts();
  const known = new Set(remote.map((contact) => contact.email.toLowerCase()));

  const goneRemotely = remote
    .filter((contact) => contact.unsubscribed)
    .map((contact) => parseEmail(contact.email))
    .filter((email): email is string => email !== null);
  const gone = new Set(goneRemotely);

  const confirmed = await deps.confirmedEmails();
  const staying = confirmed.filter((email) => !gone.has(email));
  const missing = staying.filter((email) => !known.has(email));

  await deps.markUnsubscribed(goneRemotely, now);
  for (const email of missing) {
    await deps.createContact(email);
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
  /**
   * True when this call mailed nobody: Resend had already sent this Issue, and
   * what happened here was writing that down. See `sendIssueToList`.
   */
  recovered: boolean;
}

/**
 * Sends it. Throws `SendRefused` when the Issue is not in a state to be mailed;
 * whatever `deps` throws — a Resend refusal, above all — comes through as it is.
 *
 * The order is the whole design. `decideSend` runs before anything is built, so
 * a refusal costs no request. Reconciliation runs before the broadcast is
 * created, so the segment Resend fans out to is the list D1 believes in rather
 * than the one it believed in last month. `recordSend` runs last, and is why a
 * second attempt cannot get this far: `issue_slug` is the primary key of
 * `issue_sends`, so even two requests that passed `decideSend` together end
 * with one row and one refusal from SQLite rather than two broadcasts.
 *
 * Which leaves one window, and it is the dangerous one: mail accepted by Resend
 * and then a dropped `recordSend`. `issue_sends` is empty, the toolbar offers
 * the button again, and pressing it would mail everyone twice — the failure
 * this whole file is built to prevent, reached by the one path that looks like
 * nothing happened. So Resend is asked first, by the name we derive rather than
 * one a person types. A broadcast already sent under this Issue's name means
 * the mail is gone, and the only thing left to do is write it down: that is
 * what `recovered` reports, and it turns the second press from a duplicate send
 * into the repair of a missing row. A broadcast sitting at `draft` is the other
 * half of that window and cannot be resolved from here — sending it would mail
 * a template built from a file that has since changed — so it is refused with
 * what to go and look at.
 */
export async function sendIssueToList(issue: Issue, deps: SendIssueDeps): Promise<SendReceipt> {
  const candidate: SendCandidate = {
    draft: issue.frontmatter.draft === true,
    ...(await deps.sendState(issue.slug)),
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

  const now = deps.now();
  const name = `${issue.frontmatter.datetime.slice(0, 10)} ${issue.slug}`;

  // Before anything is written or created: whatever our own database says, a
  // broadcast under this name means this Issue has been through here before.
  const existing = await deps.findBroadcast(name);
  if (existing !== null) {
    if (existing.status === "draft") {
      throw new SendRefused("half-created", candidate);
    }

    // Sent or queued: the mail is gone, and the row is what is missing.
    const sentAt = existing.sentAt ?? now;
    await deps.recordSend({
      issueSlug: issue.slug,
      resendBroadcastId: existing.id,
      // Resend's list does not carry a recipient count, and inventing one would
      // put a wrong number in a record kept for auditing what went out. The
      // broadcast id is how that is looked up.
      recipientCount: 0,
      now: sentAt,
    });

    return {
      broadcastId: existing.id,
      subject: email.subject,
      recipients: 0,
      sentAt,
      pulledUnsubscribes: 0,
      pushedToResend: 0,
      recovered: true,
    };
  }

  const { recipients, pulledUnsubscribes, pushedToResend } = await reconcile(deps, now);
  // Reconciliation can empty a list D1 said had people on it: everyone left
  // through Resend since the last send.
  if (recipients === 0) throw new SendRefused("no-recipients", { ...candidate, recipients: 0 });

  const { id } = await deps.createBroadcast({
    subject: email.subject,
    html: email.html,
    text: email.text,
    name,
  });
  await deps.sendBroadcast(id);

  await deps.recordSend({
    issueSlug: issue.slug,
    resendBroadcastId: id,
    recipientCount: recipients,
    now,
  });

  return {
    broadcastId: id,
    subject: email.subject,
    recipients,
    sentAt: now,
    pulledUnsubscribes,
    pushedToResend,
    recovered: false,
  };
}

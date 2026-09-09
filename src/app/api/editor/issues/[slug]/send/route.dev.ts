import { EditorError, issueStore } from "@/lib/editor/store";
import { FROM_ADDRESS, REPLY_TO_ADDRESS } from "@/lib/newsletter/constants";
import { parseIssueSource } from "@/lib/newsletter/issue-source";
import { remoteEnv } from "@/lib/newsletter/remote-env";
import {
  ResendError,
  createBroadcast,
  createContact,
  findBroadcastByName,
  listContacts,
  sendBroadcast,
} from "@/lib/newsletter/resend";
import {
  SendRefused,
  issueSendState,
  sendIssueToList,
  type Issue,
  type SendIssueDeps,
} from "@/lib/newsletter/send-issue";
import {
  confirmedEmails,
  markUnsubscribedInBulk,
  recordIssueSend,
} from "@/lib/newsletter/subscribers";

/**
 * The real send, from the editor.
 *
 * `.dev.ts` — a route only while `next dev` is running, so the deployed app has
 * nothing here to protect. That is the whole authorisation story, and it has to
 * be: this endpoint mails the list, and an unauthenticated one that did so in
 * production would hand the newsletter to anybody who found it. See
 * src/lib/editor/dev-routes.ts.
 *
 * It reads the file rather than taking a document in the body, so what goes out
 * is what is saved on disk. The dialog flushes the editor's autosave before
 * asking, which is what makes those the bytes you were just looking at.
 *
 * Sending is all there is here. Whether an Issue has already gone out is read
 * with the page, in `editor/issues/[slug]`, so the toolbar can draw itself
 * before anyone reaches for a button — this route is only ever the act.
 *
 * It takes the slug typed back in `confirm`. That typing is the last review
 * step — the `yes` this used to ask for at a terminal prompt — and it is
 * checked here as well as in the dialog, so the endpoint itself is not one
 * stray `curl` away from a send.
 *
 * Everything below the body check is wiring. What a send does, and in which
 * order, lives in `sendIssueToList`, where it is run against faked stores —
 * the only way to exercise a path whose every real run mails the list.
 */

async function loadIssue(slug: string): Promise<Issue> {
  const source = await issueStore.read(slug);
  const parsed = parseIssueSource(slug, source);
  if (!parsed.ok) throw new EditorError(parsed.error, 400);

  return { slug, frontmatter: parsed.frontmatter, markdown: parsed.markdown };
}

/** Every way this can fail, as an answer the dialog can read. */
function answerFor(error: unknown): Response {
  if (error instanceof EditorError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  // Already sent is the one this exists for: a second attempt is an ordinary
  // outcome, and 409 is what tells the dialog to redraw as "sent" rather than
  // as "something went wrong".
  if (error instanceof SendRefused) {
    return Response.json(
      { error: error.message, refusal: error.refusal, sentAt: error.sentAt },
      { status: 409 },
    );
  }
  // A refusal from Resend — an invalid key, a sending domain that is not
  // verified, a segment that no longer exists — is an ordinary outcome too, and
  // the dialog can only say what happened if it arrives as an answer rather
  // than as a 500 with an HTML body.
  if (error instanceof ResendError) {
    return Response.json({ error: `Resend 拒絕了：${error.response.message}` }, { status: 502 });
  }
  // Reaching the deployed database needs a network and a Wrangler login, and
  // either can be missing on a laptop.
  return Response.json(
    { error: error instanceof Error ? error.message : "寄不出去" },
    { status: 500 },
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const body: unknown = await request.json().catch(() => null);
  if ((body as { confirm?: unknown } | null)?.confirm !== slug) {
    return Response.json({ error: `要寄出的話，confirm 要是 ${slug}` }, { status: 400 });
  }

  try {
    const [issue, env] = await Promise.all([loadIssue(slug), remoteEnv()]);
    const { NEWSLETTER_DB: db, RESEND_API_KEY: apiKey, RESEND_SEGMENT_ID: segmentId } = env;
    if (!apiKey || !segmentId) {
      throw new EditorError("`.dev.vars` 需要 RESEND_API_KEY 和 RESEND_SEGMENT_ID", 500);
    }

    const deps: SendIssueDeps = {
      now: () => Date.now(),
      sendState: (issueSlug) => issueSendState(db, issueSlug),
      findBroadcast: (name) => findBroadcastByName(apiKey, name),
      confirmedEmails: () => confirmedEmails(db),
      listContacts: () => listContacts(apiKey, segmentId),
      createContact: async (email) => {
        await createContact(apiKey, { email, segmentId });
      },
      markUnsubscribed: async (emails, now) => {
        await markUnsubscribedInBulk(db, emails, now);
      },
      createBroadcast: (broadcast) =>
        createBroadcast(apiKey, {
          ...broadcast,
          segmentId,
          from: FROM_ADDRESS,
          replyTo: REPLY_TO_ADDRESS,
        }),
      sendBroadcast: async (broadcastId) => {
        await sendBroadcast(apiKey, broadcastId);
      },
      recordSend: (record) => recordIssueSend(db, record),
    };

    return Response.json(await sendIssueToList(issue, deps));
  } catch (error) {
    return answerFor(error);
  }
}

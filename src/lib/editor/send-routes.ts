import { FROM_ADDRESS, REPLY_TO_ADDRESS } from "@/lib/newsletter/constants";
import { parseIssueSource, parsePostSource } from "@/lib/newsletter/issue-source";
import { remoteEnv } from "@/lib/newsletter/remote-env";
import {
  ResendError,
  createBroadcast,
  createContact,
  findBroadcastByName,
  listContacts,
  sendBroadcast,
} from "@/lib/newsletter/resend";
import { SendRefused, sendState, sendToList, type SendDeps } from "@/lib/newsletter/send";
import { issueSendable, postSendable, postUrl, type Sendable } from "@/lib/newsletter/sendable";
import {
  confirmedEmails,
  markUnsubscribedInBulk,
  recordSend,
  type SendKind,
} from "@/lib/newsletter/subscribers";
import { sendTestEmail } from "@/lib/newsletter/test-send";
import { parseEmail } from "@/lib/newsletter/subscription";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { EditorError, issueStore, postStore } from "./store";

/**
 * The two sends the editor offers — a test to one address, and the real one to
 * the list — written once for both kinds of document.
 *
 * Node-only, for `.dev.ts` routes and nothing else. Those routes are the whole
 * authorisation story: they exist only while `next dev` is running, because an
 * unauthenticated endpoint that mailed the list in production would hand the
 * newsletter to anybody who found it. See src/lib/editor/dev-routes.ts and
 * docs/adr/0003-issues-are-sent-by-hand.md.
 *
 * Both read the file rather than taking a document in the body, so what goes
 * out is what is saved on disk. The dialogs flush the editor's autosave before
 * asking, which is what makes those the bytes you were just looking at.
 */

/**
 * Whether this document has already been mailed, from the deployed subscriber
 * list, for the page to hand to the toolbar.
 *
 * A failure is a value, not a throw. Reaching the deployed database needs a
 * network and a Wrangler login, and either can be missing on a laptop — the
 * writing surface has to open regardless, with the reason sitting in the send
 * dialog where it matters.
 */
export async function readSendState(
  kind: SendKind,
  slug: string,
): Promise<{ sentAt: number | null; recipients: number } | { error: string }> {
  try {
    const env = await remoteEnv();
    return await sendState(env.NEWSLETTER_DB, kind, slug);
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : String(cause) };
  }
}

/** Reads and validates the document on disk as something that can be mailed. */
async function load(kind: SendKind, slug: string): Promise<Sendable> {
  if (kind === "issue") {
    const parsed = parseIssueSource(slug, await issueStore.read(slug));
    if (!parsed.ok) throw new EditorError(parsed.error, 400);
    return issueSendable({ slug, frontmatter: parsed.frontmatter, markdown: parsed.markdown });
  }

  const parsed = parsePostSource(slug, await postStore.read(slug));
  if (!parsed.ok) throw new EditorError(parsed.error, 400);
  return postSendable({ slug, frontmatter: parsed.frontmatter, markdown: parsed.markdown });
}

/** Every way a send can fail, as an answer the dialog can read. */
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

export async function handleTestSend(
  kind: SendKind,
  slug: string,
  request: Request,
): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const to = parseEmail((body as { to?: unknown } | null)?.to);
  if (to === null) return Response.json({ error: "這不是一個 email 地址" }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  if (!env.RESEND_API_KEY) {
    return Response.json({ error: "`.dev.vars` 需要 RESEND_API_KEY" }, { status: 500 });
  }

  try {
    const { id, subject } = await sendTestEmail(env.RESEND_API_KEY, await load(kind, slug), to);
    return Response.json({ to, subject, id });
  } catch (error) {
    return answerFor(error);
  }
}

/**
 * The email's "read the full post" link is the point of a Post's email, and it
 * points at the deployed site. A Post that is published in the repo but not yet
 * deployed would go to everyone with a link that 404s — and the send cannot be
 * taken back — so the page is asked for first.
 */
async function assertPostIsLive(slug: string): Promise<void> {
  const url = postUrl(slug);
  const live = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10_000) }).then(
    (response) => response.ok,
    () => false,
  );
  if (!live) {
    throw new EditorError(`${url} 還打不開。先部署上線，不然信裡的「閱讀全文」會是 404。`, 409);
  }
}

export async function handleSend(kind: SendKind, slug: string, request: Request) {
  // The slug typed back is the last review step — the `yes` this used to ask for
  // at a terminal prompt — and it is checked here as well as in the dialog, so
  // the endpoint itself is not one stray `curl` away from a send.
  const body: unknown = await request.json().catch(() => null);
  if ((body as { confirm?: unknown } | null)?.confirm !== slug) {
    return Response.json({ error: `要寄出的話，confirm 要是 ${slug}` }, { status: 400 });
  }

  try {
    const [item, env] = await Promise.all([load(kind, slug), remoteEnv()]);
    const { NEWSLETTER_DB: db, RESEND_API_KEY: apiKey, RESEND_SEGMENT_ID: segmentId } = env;
    if (!apiKey || !segmentId) {
      throw new EditorError("`.dev.vars` 需要 RESEND_API_KEY 和 RESEND_SEGMENT_ID", 500);
    }

    const deps: SendDeps = {
      now: () => Date.now(),
      sendState: (itemSlug) => sendState(db, kind, itemSlug),
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
      preflight: (sendable) =>
        sendable.kind === "post" ? assertPostIsLive(sendable.slug) : Promise.resolve(),
      recordSend: (record) => recordSend(db, kind, record),
    };

    return Response.json(await sendToList(item, deps));
  } catch (error) {
    return answerFor(error);
  }
}

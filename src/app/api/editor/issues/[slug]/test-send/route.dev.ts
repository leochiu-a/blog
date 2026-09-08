import { getCloudflareContext } from "@opennextjs/cloudflare";
import { issueStore } from "@/lib/editor/store";
import { EditorError } from "@/lib/editor/store";
import { parseIssueSource } from "@/lib/newsletter/issue-source";
import { ResendError } from "@/lib/newsletter/resend";
import { parseEmail } from "@/lib/newsletter/subscription";
import { sendTestIssue } from "@/lib/newsletter/test-send";

/**
 * Mails the Issue on disk to one address, from the editor.
 *
 * `.dev.ts` — a route only while `next dev` is running, so the deployed app has
 * nothing here to protect. That is the whole authorisation story, and it has to
 * be: this endpoint sends mail, and an unauthenticated one that did so in
 * production would be a relay for anybody who found it. See
 * src/lib/editor/dev-routes.ts.
 *
 * It reads the file rather than taking a document in the body, so what arrives
 * in the inbox is what is saved on disk — the same bytes the send script would
 * mail. The editor flushes its autosave before asking, which is what makes
 * those the bytes you were just looking at.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const body: unknown = await request.json().catch(() => null);
  const to = parseEmail((body as { to?: unknown } | null)?.to);
  if (to === null) return Response.json({ error: "這不是一個 email 地址" }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  if (!env.RESEND_API_KEY) {
    return Response.json({ error: "`.dev.vars` 需要 RESEND_API_KEY" }, { status: 500 });
  }

  let source: string;
  try {
    source = await issueStore.read(slug);
  } catch (error) {
    if (error instanceof EditorError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const issue = parseIssueSource(slug, source);
  if (!issue.ok) return Response.json({ error: issue.error }, { status: 400 });

  // A refusal from Resend — an invalid key, a sending domain that is not
  // verified yet, an address it will not deliver to — is an ordinary outcome
  // here, and the dialog can only say what happened if it arrives as an answer
  // rather than as a 500 with an HTML body.
  try {
    const { id, subject } = await sendTestIssue(env.RESEND_API_KEY, {
      slug,
      frontmatter: issue.frontmatter,
      markdown: issue.markdown,
      to,
    });
    return Response.json({ to, subject, id });
  } catch (error) {
    if (error instanceof ResendError) {
      return Response.json({ error: `Resend 拒絕了：${error.response.message}` }, { status: 502 });
    }
    throw error;
  }
}

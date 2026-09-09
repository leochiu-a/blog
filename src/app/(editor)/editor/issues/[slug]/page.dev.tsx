import { notFound } from "next/navigation";
import { parseDocument } from "@/lib/editor/document";
import { EditorError, issueStore } from "@/lib/editor/store";
import { remoteEnv } from "@/lib/newsletter/remote-env";
import { issueSendState } from "@/lib/newsletter/send-issue";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import type { SendState } from "@/components/editor/SendIssueButton";

export const dynamic = "force-dynamic";

/**
 * Whether this Issue has already gone out, from the deployed subscriber list.
 *
 * Read with the page rather than from the browser, so the toolbar draws itself
 * right the first time: an Issue that has been sent shows a **Sent** badge and
 * no send button at all, which is the answer to "did I already send this?"
 * without pressing anything.
 *
 * A failure is a value, not a throw. Reaching the deployed database needs a
 * network and a Wrangler login, and either can be missing on a laptop — the
 * writing surface has to open regardless, with the reason sitting in the send
 * dialog where it matters.
 */
async function sendState(slug: string): Promise<SendState> {
  try {
    const env = await remoteEnv();
    return await issueSendState(env.NEWSLETTER_DB, slug);
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : String(cause) };
  }
}

export default async function EditIssue({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const source = await issueStore.read(slug).catch((error: unknown) => {
    if (error instanceof EditorError) notFound();
    throw error;
  });

  return (
    <DocumentEditor
      collection="issues"
      slug={slug}
      initialDocument={parseDocument(source)}
      sendState={await sendState(slug)}
    />
  );
}

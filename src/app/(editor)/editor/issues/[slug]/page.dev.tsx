import { notFound } from "next/navigation";
import { parseDocument } from "@/lib/editor/document";
import { readSendState } from "@/lib/editor/send-routes";
import { EditorError, issueStore } from "@/lib/editor/store";
import { DocumentEditor } from "@/components/editor/DocumentEditor";

export const dynamic = "force-dynamic";

/*
 * Whether this Issue has already gone out is read with the page, not from the
 * browser, so the toolbar draws itself right the first time: an Issue that has
 * been sent shows a **Sent** badge and no send button at all, which is the
 * answer to "did I already send this?" without pressing anything.
 *
 * Started here but not awaited. The query crosses the network to the deployed
 * database — ~0.7s warm, ~9s on the first open after `next dev` starts — and
 * awaiting it held the whole writing surface back for a button in the corner.
 * The promise streams to `SendButton`, which suspends on its own while the rest
 * of the editor is already open.
 */
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
      sendState={readSendState("issue", slug)}
    />
  );
}

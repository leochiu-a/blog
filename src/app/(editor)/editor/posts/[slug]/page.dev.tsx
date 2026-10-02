import { notFound } from "next/navigation";
import { parseDocument } from "@/lib/editor/document";
import { EditorError, postStore } from "@/lib/editor/store";
import { remoteEnv } from "@/lib/newsletter/remote-env";
import { postSendState } from "@/lib/newsletter/send";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import type { SendState } from "@/components/editor/SendButton";

export const dynamic = "force-dynamic";

/**
 * Whether this Post has already been mailed, from the deployed subscriber list.
 *
 * Streamed to the toolbar rather than awaited, and a failure is a value rather
 * than a throw, for the reasons `editor/issues/[slug]` spells out: the query
 * crosses the network, and the writing surface has to open without it.
 */
async function sendState(slug: string): Promise<SendState> {
  try {
    const env = await remoteEnv();
    return await postSendState(env.NEWSLETTER_DB, slug);
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : String(cause) };
  }
}

export default async function EditPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const source = await postStore.read(slug).catch((error: unknown) => {
    if (error instanceof EditorError) notFound();
    throw error;
  });

  return (
    <DocumentEditor
      collection="posts"
      slug={slug}
      initialDocument={parseDocument(source)}
      sendState={sendState(slug)}
    />
  );
}

import { notFound } from "next/navigation";
import { parseDocument } from "@/lib/editor/document";
import { EditorError, postStore } from "@/lib/editor/store";
import { DocumentEditor } from "@/components/editor/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const source = await postStore.read(slug).catch((error: unknown) => {
    if (error instanceof EditorError) notFound();
    throw error;
  });

  return <DocumentEditor collection="posts" slug={slug} initialDocument={parseDocument(source)} />;
}

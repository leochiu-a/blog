import { notFound } from "next/navigation";
import { parsePost } from "@/lib/editor/document";
import { EditorError, postStore } from "@/lib/editor/store";
import { PostEditor } from "@/components/editor/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const source = await postStore.read(slug).catch((error: unknown) => {
    if (error instanceof EditorError) notFound();
    throw error;
  });

  return <PostEditor slug={slug} initialDocument={parsePost(source)} />;
}

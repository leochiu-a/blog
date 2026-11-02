import { Suspense } from "react";
import { notFound } from "next/navigation";
import { reachablePosts } from "@/lib/posts";
import { SendPreview } from "./SendPreview";

// `.dev.tsx` — a route only while `next dev` is running. See
// src/lib/editor/dev-routes.ts.

/**
 * The send dialog and its paper plane, to press without mailing anyone.
 *
 * Laid out as the editor lays out a professional Post — the `dark` wrapper, the
 * header across the top, the same column — so what folds here is what folds
 * there, colours included. The theme lives on that wrapper, not on <html>, and
 * a preview without it would fold a light page the editor never shows.
 *
 * The page folded is a real post, `?slug=` or the newest: how long the paper
 * takes to be ready depends on how much there is to photograph, and a short
 * sample hid a flight cut short on a long post.
 */
export default async function SendPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  const post = slug ? reachablePosts.find((each) => each.slug === slug) : reachablePosts[0];
  if (!post) notFound();
  const Post = post.mdx;

  return (
    <div className="dark min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/90 px-6 py-3 font-sans text-sm backdrop-blur">
        <Suspense fallback={null}>
          <SendPreview />
        </Suspense>
      </header>
      <main className="@container flex w-full flex-col items-center px-6 pb-32 pt-10 font-garamond sm:px-10">
        <div data-letter className="w-full min-w-0 max-w-[45.5rem]">
          <h1 className="font-sans text-3xl font-extrabold leading-[1.3] sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-3 font-sans text-xl leading-snug text-muted-foreground">
              {post.subtitle}
            </p>
          )}
          <div className="prose prose-lg prose-zinc relative mt-6 max-w-none border-t border-border pt-6 sm:mt-8 sm:pt-8">
            <Post />
          </div>
        </div>
      </main>
    </div>
  );
}

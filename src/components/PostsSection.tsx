"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "@/types/content";
import { PostPreviewPanel, anchorNameFor } from "@/components/PostPreviewPanel";
import { SectionRow } from "@/components/SectionRow";
import { DividerOrnament } from "@/components/icons";

function PostItem({ post, onPreview }: { post: Post; onPreview: (href: string | null) => void }) {
  return (
    // Side by side, the title is left with ~59% of a phone's width and breaks
    // across three lines, so below sm the metadata drops to its own line and
    // the title gets the full column. Read time sits with the date rather than
    // trailing the title, so the two never compete for the same row.
    <li className="flex flex-col gap-y-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      {/* Inline flow rather than flex: as a flex item the star would hold a
          column of its own and hang the title's wrapped lines off it, instead
          of letting them run back to the full width underneath it. */}
      {/* The anchor for the preview card is this row, not the link inside it:
          a ✦ on the front of the title would otherwise push its card ~19px
          right of every other one. */}
      <div className="post-title" style={anchorNameFor(post.href)}>
        {post.featured && <span className="mr-1.5 text-blog-accent">✦</span>}
        <Link
          href={post.href}
          onPointerEnter={() => onPreview(post.href)}
          onFocus={() => onPreview(post.href)}
          className="font-cormorant text-lg font-semibold transition-colors hover:text-blog-accent"
        >
          {post.title}
        </Link>
        {post.draft && (
          <span className="ml-2 inline-block rounded-sm border border-blog-accent/40 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide text-blog-accent">
            draft
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-baseline gap-x-1.5 text-muted-foreground">
        <span className="font-sans text-xs">{post.readTime}</span>
        <span aria-hidden="true" className="text-xs">
          ·
        </span>
        <time dateTime={post.datetime} className="text-sm">
          {post.date}
        </time>
      </div>
    </li>
  );
}

function EmptyPosts() {
  return (
    <div className="flex flex-col items-center gap-y-3 rounded-lg border border-dashed border-bronze/30 py-10 text-center">
      <DividerOrnament className="text-gold opacity-60" />
      <p className="font-cormorant text-lg text-muted-foreground">敬請期待</p>
      <p className="font-sans text-xs text-muted-foreground/70">新文章準備中，晚點再回來看看。</p>
    </div>
  );
}

/**
 * Way into the post editor, which only exists while `next dev` is running.
 *
 * The `/editor` route is absent from a production build entirely (see
 * src/lib/editor/dev-routes.ts), so this guard is what keeps the listing from
 * offering a link that would 404 on the live site. `process.env.NODE_ENV` is
 * inlined at build time, which leaves nothing of this component in the bundle
 * — see `DevEditLink` for why the check isn't shared through a wrapper.
 */
function EditorLink() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Link
      href="/editor"
      className="mt-1 self-start font-sans text-xs text-muted-foreground transition-colors hover:text-blog-accent"
    >
      Open editor →
    </Link>
  );
}

export function PostsSection({ posts }: { posts: Post[] }) {
  // Which title the pointer (or keyboard focus) is on. Cleared on the list
  // rather than on each title so that travelling between two rows never blanks
  // the preview mid-move — the next title claims it before the list is left.
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const previewable = posts.filter((post) => post.description);

  return (
    <SectionRow
      label="Posts"
      aside={<PostPreviewPanel posts={previewable} activeHref={activeHref} />}
    >
      {posts.length > 0 ? (
        // Wrapper rather than the <ul> itself: a list has a role, and handlers
        // on a role-bearing element are what the a11y lint objects to.
        <div onPointerLeave={() => setActiveHref(null)} onBlur={() => setActiveHref(null)}>
          <ul className="flex flex-col gap-y-4">
            {posts.map((post) => (
              <PostItem key={post.href + post.title} post={post} onPreview={setActiveHref} />
            ))}
          </ul>
        </div>
      ) : (
        <EmptyPosts />
      )}
      <EditorLink />
    </SectionRow>
  );
}

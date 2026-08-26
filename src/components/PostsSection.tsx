import Link from "next/link";
import type { Post } from "@/types/content";
import { SectionRow } from "@/components/SectionRow";
import { DividerOrnament } from "@/components/icons";

function PostItem({ post }: { post: Post }) {
  return (
    // Side by side, the title is left with ~59% of a phone's width and breaks
    // across three lines, so below sm the metadata drops to its own line and
    // the title gets the full column. Read time sits with the date rather than
    // trailing the title, so the two never compete for the same row.
    <li className="flex flex-col gap-y-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      {/* Inline flow rather than flex: as a flex item the star would hold a
          column of its own and hang the title's wrapped lines off it, instead
          of letting them run back to the full width underneath it. */}
      <div>
        {post.featured && <span className="mr-1.5 text-blog-accent">✦</span>}
        <Link
          href={post.href}
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

export function PostsSection({ posts }: { posts: Post[] }) {
  return (
    <SectionRow label="Posts">
      {posts.length > 0 ? (
        <ul className="flex flex-col gap-y-4">
          {posts.map((post) => (
            <PostItem key={post.href + post.title} post={post} />
          ))}
        </ul>
      ) : (
        <EmptyPosts />
      )}
    </SectionRow>
  );
}

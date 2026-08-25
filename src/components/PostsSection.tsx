import Link from "next/link";
import type { Post } from "@/types/content";
import { SectionRow } from "@/components/SectionRow";
import { DividerOrnament } from "@/components/icons";

function PostItem({ post }: { post: Post }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {post.featured && <span className="text-blog-accent">✦</span>}
          <Link
            href={post.href}
            className="font-cormorant text-lg font-semibold transition-colors hover:text-blog-accent"
          >
            {post.title}
          </Link>
          {post.draft && (
            <span className="rounded-sm border border-blog-accent/40 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide text-blog-accent">
              draft
            </span>
          )}
          <span className="font-sans text-xs text-muted-foreground">· {post.readTime}</span>
        </div>
      </div>
      <time dateTime={post.datetime} className="shrink-0 text-sm text-muted-foreground">
        {post.date}
      </time>
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

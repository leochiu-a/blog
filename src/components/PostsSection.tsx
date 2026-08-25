import Link from "next/link";
import type { Post } from "@/types/content";
import { SectionRow } from "@/components/SectionRow";

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

export function PostsSection({ posts }: { posts: Post[] }) {
  return (
    <SectionRow label="Posts">
      <ul className="flex flex-col gap-y-4">
        {posts.map((post) => (
          <PostItem key={post.href + post.title} post={post} />
        ))}
      </ul>
    </SectionRow>
  );
}

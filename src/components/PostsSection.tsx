import type { Post } from "@/types/content";
import { SectionRow } from "@/components/SectionRow";

function PostItem({ post }: { post: Post }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {post.featured && <span className="text-gold">✦</span>}
          <a href={post.href} className="illuminated-link font-cormorant text-lg font-semibold">
            {post.title}
          </a>
          <span className="text-xs text-muted-foreground">· {post.readTime}</span>
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

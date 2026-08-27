import Image from "next/image";
import Link from "next/link";
import { Pin } from "lucide-react";
import { parsePost } from "@/lib/editor/document";
import { readFlag, readText } from "@/lib/editor/frontmatter-fields";
import { CATEGORIES } from "@/lib/post-frontmatter";
import { postStore } from "@/lib/editor/store";
import { NewPostButton } from "@/components/editor/NewPostButton";
import { PostActions } from "@/components/editor/PostActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type PostSummary = {
  slug: string;
  title: string;
  subtitle: string;
  datetime: string;
  readTime: string;
  category: string;
  ogImage: string;
  featured: boolean;
  draft: boolean;
};

async function loadPosts(): Promise<PostSummary[]> {
  const slugs = await postStore.listSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const { frontmatter } = parsePost(await postStore.read(slug));
      return {
        slug,
        title: readText(frontmatter, "title") || slug,
        subtitle: readText(frontmatter, "subtitle") || readText(frontmatter, "description"),
        datetime: readText(frontmatter, "datetime"),
        readTime: readText(frontmatter, "readTime"),
        category: readText(frontmatter, "category"),
        ogImage: readText(frontmatter, "ogImage"),
        featured: readFlag(frontmatter, "featured"),
        draft: readFlag(frontmatter, "draft"),
      };
    }),
  );
  return posts.sort((a, b) => b.datetime.localeCompare(a.datetime));
}

/**
 * A story card, laid out the way Medium lays one out: the writing on the left
 * — a line of context, the title, the standfirst — the thumbnail parked on the
 * right, and the row's own controls on a footer line under the text. A row
 * reads as a post rather than as a filename, which is what makes a long list
 * worth scanning.
 */
function PostCard({ post }: { post: PostSummary }) {
  return (
    <li className="py-6">
      {post.featured && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pin className="size-3.5" aria-hidden="true" />
          Featured
        </p>
      )}

      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <Link href={`/editor/${post.slug}`} className="group/link block">
            {/* Category is the section heading above, so the byline carries
                what differs row to row: when it was written, how long it is. */}
            <p className="text-xs text-muted-foreground">
              {post.datetime}
              {post.readTime && ` · ${post.readTime}`}
            </p>
            <h3 className="mt-1 text-xl font-bold leading-snug transition-colors group-hover/link:text-blog-accent">
              {post.title}
            </h3>
            {post.subtitle && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.subtitle}</p>
            )}
          </Link>

          {/* The footer carries what you act on rather than what you read: the
              state of the file, and the menu that can delete it. */}
          <div className="mt-4 flex items-center gap-3">
            {post.draft && <Badge variant="secondary">draft</Badge>}
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground/70">
              {post.slug}
            </span>
            {/* Outside the link: a row is one destination, and deleting is not it. */}
            <PostActions slug={post.slug} title={post.title} />
          </div>
        </div>

        {post.ogImage && (
          // A second way into the same post, so it is hidden from assistive
          // tech and skipped by the keyboard — the title above already leads here.
          <Link href={`/editor/${post.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
            <Image
              src={post.ogImage}
              alt=""
              width={160}
              height={107}
              className="h-[6.7rem] w-40 rounded-sm bg-muted object-cover"
            />
          </Link>
        )}
      </div>
    </li>
  );
}

function PostList({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className="divide-y border-t">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </ul>
  );
}

export default async function EditorIndex() {
  const posts = await loadPosts();

  return (
    // The index is chrome, not a post, so it has no category to follow — it
    // reads dark, and `html:has(.dark)` in globals.css carries the tokens up to
    // the document element the same way an article's theme does.
    <div className="dark min-h-screen font-sans">
      {/* Same bar as the editing page, so moving between the two feels like
          one surface rather than two pages that happen to be adjacent. */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/90 px-6 py-3 text-sm backdrop-blur">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" />}>
          ← Home
        </Button>
      </header>

      <main className="mx-auto w-full max-w-[45.5rem] px-6 pb-16 pt-10">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Posts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dev-only editor · {posts.length} posts
            </p>
          </div>
          {/* The action sits with the list it adds to, not in the shared bar —
              the bar is navigation between editor surfaces. */}
          <NewPostButton />
        </div>

        {CATEGORIES.map((category) => {
          const inCategory = posts.filter((post) => post.category === category);
          if (inCategory.length === 0) return null;

          return (
            <section key={category} className="mt-10">
              <h2 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                {category} · {inCategory.length}
              </h2>
              <PostList posts={inCategory} />
            </section>
          );
        })}
      </main>
    </div>
  );
}

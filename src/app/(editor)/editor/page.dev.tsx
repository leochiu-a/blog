import Link from "next/link";
import { parsePost } from "@/lib/editor/document";
import { postStore } from "@/lib/editor/store";
import { NewPostButton } from "@/components/editor/NewPostButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type PostSummary = {
  slug: string;
  title: string;
  datetime: string;
  category: string;
  draft: boolean;
};

/** The same split the homepage makes, in the same order it shows them. */
const CATEGORIES = [
  { key: "professional", label: "Professional" },
  { key: "personal", label: "Personal" },
];

async function loadPosts(): Promise<PostSummary[]> {
  const slugs = await postStore.listSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const { frontmatter } = parsePost(await postStore.read(slug));
      return {
        slug,
        title: String(frontmatter.title ?? slug),
        datetime: String(frontmatter.datetime ?? ""),
        category: String(frontmatter.category ?? "personal"),
        draft: frontmatter.draft === true,
      };
    }),
  );
  return posts.sort((a, b) => b.datetime.localeCompare(a.datetime));
}

function PostList({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className="divide-y border-t">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            href={`/editor/${post.slug}`}
            className="flex items-baseline justify-between gap-4 py-4 transition-colors hover:text-blog-accent"
          >
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold">{post.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{post.slug}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2 text-xs tabular-nums text-muted-foreground">
              {post.draft && <Badge variant="secondary">draft</Badge>}
              {post.datetime}
            </span>
          </Link>
        </li>
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
        <span className="flex-1" />
        <NewPostButton />
      </header>

      <main className="mx-auto w-full max-w-[45.5rem] px-6 pb-16 pt-10">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Posts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dev-only editor · {posts.length} posts
            </p>
          </div>
        </div>

        {CATEGORIES.map(({ key, label }) => {
          const inCategory = posts.filter((post) => post.category === key);
          if (inCategory.length === 0) return null;

          return (
            <section key={key} className="mt-10">
              <h2 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                {label} · {inCategory.length}
              </h2>
              <PostList posts={inCategory} />
            </section>
          );
        })}
      </main>
    </div>
  );
}

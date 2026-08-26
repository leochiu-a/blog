import Image from "next/image";
import Link from "next/link";
import { posts } from "@/lib/posts";

/**
 * "Read more" list at the foot of a post — the newest few posts from the same
 * category, excluding the one being read.
 *
 * Category-scoped on purpose: a post's reading theme follows its category, so
 * linking across categories would hand the reader a link that flips the page
 * from dark to light. A category with nothing else to show renders nothing.
 */
export function RecentPosts({ slug, category }: { slug: string; category: string }) {
  const recent = posts.filter((p) => p.category === category && p.slug !== slug).slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-6">
      <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Read more
      </h2>
      <ul className="mt-4 flex flex-col gap-y-5">
        {recent.map((post) => (
          <li key={post.slug}>
            <Link href={post.href} className="group flex items-start gap-x-4">
              {post.ogImage && (
                // Heroes ship at a few different ratios (3:2 and 1.83:1), so the
                // box fixes the ratio and object-cover absorbs the difference.
                // Below the fold by definition — never eager, never `priority`.
                <div className="relative aspect-3/2 w-24 shrink-0 overflow-hidden rounded-sm sm:w-32">
                  <Image
                    src={post.ogImage}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="(min-width: 640px) 128px, 96px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-sans text-lg font-bold leading-snug transition-colors group-hover:text-blog-accent">
                  {post.title}
                </h3>
                <p className="mt-1 font-sans text-sm text-muted-foreground">
                  <time dateTime={post.datetime}>{post.date}</time>
                  {post.readTime && ` · ${post.readTime}`}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

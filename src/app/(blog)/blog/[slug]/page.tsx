import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { posts } from "@/lib/posts";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { ScrollToTop } from "@/components/blog/ScrollToTop";
import { Footer } from "@/components/Footer";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} • Leo Chiu`,
    description: post.subtitle,
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const Post = post.mdx;

  const date = post.datetime
    ? new Date(post.datetime).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <main className="flex min-h-screen w-full flex-col items-center px-6 pb-10 pt-7 font-garamond text-base leading-relaxed sm:px-10">
      {/* 728px — Substack's column width, matching `.prose`'s own max-width. */}
      <div className="w-full min-w-0 max-w-[45.5rem]">
        <BlogHeader />

        <article className="wrap-break-word">
          <div id="blog-hero">
            <h1 className="mt-2 font-sans text-4xl font-extrabold leading-tight tracking-tight sm:mb-1 md:text-5xl">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mt-3 font-sans text-lg leading-snug text-muted-foreground sm:text-xl">
                {post.subtitle}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="font-sans text-sm text-muted-foreground">
                Leo Chiu
                {date && (
                  <>
                    {" · "}
                    <time dateTime={post.datetime}>{date}</time>
                  </>
                )}
                {post.readTime && ` · ${post.readTime}`}
              </p>
            </div>
          </div>

          <div className="prose prose-lg prose-zinc mt-8 border-t border-border pt-8">
            <Post />
          </div>

          <ScrollToTop />
          <Footer variant="minimal" />
        </article>
      </div>
    </main>
  );
}

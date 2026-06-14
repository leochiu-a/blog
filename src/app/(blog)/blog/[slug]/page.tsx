import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allPosts } from "content-collections";
import { MDXContent } from "@content-collections/mdx/react";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ScrollToTop } from "@/components/blog/ScrollToTop";
import { Divider } from "@/components/Divider";
import { Footer } from "@/components/Footer";
import { PoemCard } from "@/components/mdx/PoemCard";
import { BookQuote } from "@/components/mdx/BookQuote";
import { FancyQuote } from "@/components/mdx/FancyQuote";
import { VideoEmbed } from "@/components/mdx/VideoEmbed";
import { Callout } from "@/components/mdx/Callout";
import { OrnamentSeparator } from "@/components/mdx/OrnamentSeparator";

const components = {
  PoemCard,
  BookQuote,
  FancyQuote,
  VideoEmbed,
  Callout,
  hr: OrnamentSeparator,
};

export function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: `${post.title} • Leo Chiu` };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const date = post.datetime
    ? new Date(post.datetime).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <main className="flex min-h-screen w-full flex-col items-center px-6 pb-10 pt-7 font-garamond text-base leading-relaxed sm:px-10">
      <div className="w-full max-w-2xl xl:max-w-300 xl:grid xl:grid-cols-[1fr_minmax(0,42rem)_1fr]">
        <div className="hidden xl:block" />

        <div className="min-w-0">
          <BlogHeader />

          <article className="wrap-break-word">
            <div id="blog-hero">
              <h1 className="mt-2 font-cormorant text-4xl font-semibold leading-tight sm:mb-1 md:text-5xl">
                {post.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-xs text-muted-foreground">
                  Leo Chiu
                  {date && (
                    <>
                      {" - "}
                      <time dateTime={post.datetime}>{date}</time>
                    </>
                  )}
                  {post.readTime && ` · ${post.readTime}`}
                </p>
              </div>
            </div>

            <div
              className={`prose prose-lg prose-zinc mt-6 ${
                post.font === "newsreader" ? "font-newsreader" : "font-garamond"
              }`}
            >
              <MDXContent code={post.mdx} components={components} />
            </div>

            <ScrollToTop />
            <Divider className="mt-20" />
            <Footer />
          </article>
        </div>

        <div className="hidden xl:block pl-10 pt-20">
          <TableOfContents />
        </div>
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { posts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { ScrollToTop } from "@/components/blog/ScrollToTop";
import { RecentPosts } from "@/components/blog/RecentPosts";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { detectPostLanguage } from "@/lib/language";
import { DevEditLink } from "@/components/blog/DevEditLink";

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

  const title = `${post.title} • Leo Chiu`;
  const description = post.description ?? post.subtitle;
  const image = post.ogImage ?? "/seo/social-card.png";

  return {
    title,
    description,
    keywords: post.tags,
    alternates: {
      canonical: `${SITE_URL}${post.href}`,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}${post.href}`,
      publishedTime: post.datetime,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
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

  const postUrl = `${SITE_URL}${post.href}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description ?? post.subtitle,
    image: `${SITE_URL}${post.ogImage ?? "/seo/social-card.png"}`,
    datePublished: post.datetime,
    dateModified: post.datetime,
    inLanguage: detectPostLanguage(post.title),
    ...(post.tags && { keywords: post.tags.join(", ") }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    author: {
      "@type": "Person",
      name: "Leo Chiu",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Leo Chiu",
      url: SITE_URL,
    },
  };

  // A post's reading theme follows its category, so a professional post reads
  // dark whichever way the reader arrived — homepage listing, RSS, or a direct
  // link — and can never disagree with the listing it came from.
  return (
    <>
      <JsonLd data={jsonLd} />
      <main
        className={cn(
          "flex min-h-screen w-full flex-col items-center px-6 pb-10 pt-7 font-garamond text-base leading-relaxed sm:px-10",
          post.category === "professional" && "dark",
        )}
      >
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
                <DevEditLink slug={post.slug} />
              </div>
            </div>

            <div className="prose prose-lg prose-zinc mt-6 border-t border-border pt-6 sm:mt-8 sm:pt-8">
              <Post />
            </div>

            <RecentPosts slug={post.slug} category={post.category} />

            <ScrollToTop />
            <Footer variant="minimal" />
          </article>
        </div>
      </main>
    </>
  );
}

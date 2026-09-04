import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { posts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { ScrollToTop } from "@/components/blog/ScrollToTop";
import { PostToc } from "@/components/blog/PostToc";
import { SectionArrival } from "@/components/blog/SectionArrival";
import { SectionLanding } from "@/components/blog/SectionLanding";
import { RecentPosts } from "@/components/blog/RecentPosts";
import { SubscribeCta } from "@/components/newsletter/SubscribeCta";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { detectPostLanguage } from "@/lib/language";
import { DevEditLink } from "@/components/blog/DevEditLink";
import { SharePost } from "@/components/blog/SharePost";
import { AuthorBio } from "@/components/blog/AuthorBio";
import { author } from "@/data/content";
import { PERSON_ID, personJsonLd } from "@/lib/person";

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
    authors: [{ name: author.name, url: SITE_URL }],
    alternates: {
      canonical: `${SITE_URL}${post.href}`,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}${post.href}`,
      siteName: `${author.name} • Blog`,
      locale: detectPostLanguage(post.title) === "zh-Hant" ? "zh_TW" : "en_US",
      publishedTime: post.datetime,
      modifiedTime: post.updated ?? post.datetime,
      authors: [SITE_URL],
      tags: post.tags,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@leo_web_dev",
      images: [image],
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const Post = post.mdx;

  const date = new Date(post.datetime).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const postUrl = `${SITE_URL}${post.href}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // Referenced by both `author` and `publisher` below, so the two roles
      // resolve to one entity rather than two look-alike people.
      personJsonLd,
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description ?? post.subtitle,
        image: `${SITE_URL}${post.ogImage ?? "/seo/social-card.png"}`,
        datePublished: post.datetime,
        dateModified: post.updated ?? post.datetime,
        inLanguage: detectPostLanguage(post.title),
        ...(post.tags && { keywords: post.tags.join(", ") }),
        ...(post.tags?.[0] && { articleSection: post.tags[0] }),
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
        url: postUrl,
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: post.title, item: postUrl },
        ],
      },
    ],
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
              <h1 className="mt-2 font-sans text-3xl font-extrabold leading-[1.15] tracking-tight sm:mb-1 sm:text-4xl sm:leading-tight md:text-5xl">
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
                {/* `ms-auto` on the group rather than on either control, so
                    the share trigger stays last whether or not the dev-only
                    edit link is beside it. */}
                <div className="ms-auto flex items-center gap-x-3">
                  <DevEditLink slug={post.slug} />
                  <SharePost
                    title={post.title}
                    url={postUrl}
                    image={post.ogImage ?? "/seo/social-card.png"}
                  />
                </div>
              </div>
            </div>

            {/* Both read the article out of the DOM below, so they render
                after it is there but sit above it in the layout. `PostToc`
                draws the rail; `SectionArrival` is what a URL naming one
                section does to the page, and draws nothing. */}
            <PostToc />
            <SectionArrival />

            <div className="prose prose-lg prose-zinc mt-6 border-t border-border pt-6 sm:mt-8 sm:pt-8">
              <Post />
            </div>

            {/* After the article, because it scrolls to a heading inside it and
                runs the moment the parser arrives — which is only after the
                headings exist. */}
            <SectionLanding />

            <SubscribeCta source={post.href} />

            {/* The bio and the read-more list are both post-script matter, so
                the rhythm lives here rather than in each section: one gap after
                the article, a tighter one between the two. Owning both spacings
                in one place is what keeps the bio's band symmetric — 24px above
                its content and 24px below, instead of 24 above and 48 below. */}

            <div className="mt-12 flex flex-col gap-y-6">
              <AuthorBio />
              <RecentPosts slug={post.slug} category={post.category} />
            </div>

            <ScrollToTop />
            <Footer variant="minimal" />
          </article>
        </div>
      </main>
    </>
  );
}

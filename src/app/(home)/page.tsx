import { posts } from "@/lib/posts";
import { PortfolioApp } from "@/components/PortfolioApp";
import { JsonLd } from "@/components/JsonLd";
import { profile, about, socialLinks } from "@/data/content";
import { SITE_URL } from "@/lib/site";
import type { Mode, Post } from "@/types/content";

export default async function Home({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode: modeParam } = await searchParams;
  const mode: Mode = modeParam === "personal" ? "personal" : "professional";

  const toPost = (entry: (typeof posts)[number]): Post => ({
    title: entry.title,
    href: `/blog/${entry.slug}/`,
    readTime: entry.readTime,
    date: entry.date,
    datetime: entry.datetime,
    description: entry.description,
    ogImage: entry.ogImage,
    featured: entry.featured,
    draft: entry.draft,
  });

  const professionalPosts = posts.filter((p) => p.category === "professional").map(toPost);
  const personalPosts = posts.filter((p) => p.category === "personal").map(toPost);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: SITE_URL,
    image: `${SITE_URL}${profile.professionalPhoto}`,
    jobTitle: "Senior Software Engineer",
    worksFor: {
      "@type": "Organization",
      name: "KKday",
    },
    description: about.professional.join(" "),
    sameAs: socialLinks.map((link) => link.href),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: profile.name,
    url: SITE_URL,
    author: {
      "@type": "Person",
      name: profile.name,
    },
  };

  return (
    <>
      <JsonLd data={personJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <PortfolioApp
        mode={mode}
        professionalPosts={professionalPosts}
        personalPosts={personalPosts}
      />
    </>
  );
}

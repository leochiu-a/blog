import { posts } from "@/lib/posts";
import { PortfolioApp } from "@/components/PortfolioApp";
import { JsonLd } from "@/components/JsonLd";
import { profile } from "@/data/content";
import { PERSON_ID, personJsonLd } from "@/lib/person";
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

  // Shared with every post (see lib/person.ts) so both pages describe the same
  // person with the same `@id`, job title and profile list.
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      personJsonLd,
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: profile.name,
        url: SITE_URL,
        inLanguage: "zh-Hant",
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
      },
    ],
  };

  return (
    <>
      <JsonLd data={siteJsonLd} />
      <PortfolioApp
        mode={mode}
        professionalPosts={professionalPosts}
        personalPosts={personalPosts}
      />
    </>
  );
}

import { posts } from "@/lib/posts";
import { PortfolioApp } from "@/components/PortfolioApp";
import { JsonLd } from "@/components/JsonLd";
import { profile } from "@/data/content";
import { PERSON_ID, personJsonLd } from "@/lib/person";
import { SITE_URL } from "@/lib/site";
import type { Mode, Post } from "@/types/content";

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

/**
 * The homepage body, shared by the two routes that prerender it: `/` in
 * professional mode and `/personal/` in personal mode. Both ship every post,
 * because the toggle swaps sides on the client without a round trip.
 */
export function HomeScreen({ mode }: { mode: Mode }) {
  return (
    <>
      <JsonLd data={siteJsonLd} />
      <PortfolioApp
        initialMode={mode}
        professionalPosts={posts.filter((p) => p.category === "professional").map(toPost)}
        personalPosts={posts.filter((p) => p.category === "personal").map(toPost)}
      />
    </>
  );
}

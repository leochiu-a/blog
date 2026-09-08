import { posts } from "@/lib/posts";
import { issues } from "@/lib/issues";
import { PortfolioApp } from "@/components/PortfolioApp";
import { JsonLd } from "@/components/JsonLd";
import { profile } from "@/data/content";
import { PERSON_ID, personJsonLd } from "@/lib/person";
import { SITE_URL } from "@/lib/site";
import type { IssueSummary, Mode, Post } from "@/types/content";

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

const A_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * An Issue earns the ✦ for its first month.
 *
 * A post is starred by hand in its frontmatter, because "the one worth reading"
 * is a judgement about that post. An Issue is starred by age instead: they go
 * out on a schedule and the only interesting one is the one that just landed,
 * so nothing has to be un-starred by hand when the next one ships.
 *
 * The comparison happens at build time, not in the browser — the home page is
 * prerendered, and a `Date.now()` on the client would disagree with the HTML it
 * hydrates. That does mean a star outlives its month until the next deploy,
 * which is the right trade for a site that redeploys whenever anything is
 * published.
 */
// Module scope, not inside the component: this is read once when the page is
// built, and a `Date.now()` in a render body is an impure call the React
// compiler rejects. It also means every Issue is aged against the same instant.
const BUILT_AT = Date.now();

const isRecent = (datetime: string) => BUILT_AT - Date.parse(datetime) < A_MONTH_MS;

const toIssue = (entry: (typeof issues)[number]): IssueSummary => ({
  title: entry.title,
  href: entry.href,
  subtitle: entry.subtitle,
  date: entry.date,
  datetime: entry.datetime,
  featured: isRecent(entry.datetime),
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
        recentIssues={issues.slice(0, 3).map(toIssue)}
      />
    </>
  );
}

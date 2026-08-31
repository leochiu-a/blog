import type { MetadataRoute } from "next";
import { issues } from "@/lib/issues";
import { posts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

/**
 * Static routes plus every published post — drafts are already filtered out of
 * `posts` (see lib/posts.ts), so an unfinished post never reaches search engines.
 *
 * No request-time API is used here, so this stays a cached, statically
 * generated route like the rest of the site.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(posts[0]?.updated ?? posts[0]?.datetime ?? Date.now()),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      // The personal side of the homepage is its own prerendered route rather
      // than a query string, so it can be crawled and ranked on its own.
      url: `${SITE_URL}/personal/`,
      lastModified: new Date(posts[0]?.updated ?? posts[0]?.datetime ?? Date.now()),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      // The subscribe page is worth indexing; the confirm and unsubscribe pages
      // hold nothing but somebody's signed token, and say so with `noindex`.
      url: `${SITE_URL}/newsletter/`,
      lastModified: new Date(issues[0]?.datetime ?? posts[0]?.datetime ?? Date.now()),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const issueRoutes: MetadataRoute.Sitemap = issues.map((issue) => ({
    url: `${SITE_URL}${issue.href}`,
    lastModified: new Date(issue.datetime),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}${post.href}`,
    // A revision has to move `lastModified`, or a re-crawl of an updated post
    // waits on the next unrelated change to the sitemap.
    lastModified: new Date(post.updated ?? post.datetime),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes, ...issueRoutes];
}

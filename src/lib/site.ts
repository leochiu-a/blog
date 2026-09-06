import { author } from "@/data/content";

// Override with NEXT_PUBLIC_SITE_URL in the deploy environment if the
// domain ever changes — no code change needed.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://leochiu.com").replace(
  /\/$/,
  "",
);

/**
 * The `<title>` a document is served with: its own title plus the site's, the
 * single line that shows up in a search result, a browser tab and an OG card.
 *
 * Derived rather than stored, so there is never a second title to keep in
 * step. Every route builds its title through here — including the editor's
 * settings panel, so the suffix is visible while a title is being chosen
 * rather than only after publishing.
 */
export function seoTitle(title: string): string {
  return `${title} | ${author.name}`;
}

/**
 * The `<title>` of every 404, wherever it is served from: `global-not-found`
 * for a URL that matches no route, `(blog)/not-found` for one that matches a
 * dynamic segment and then turns out to have nothing behind it. Shared so the
 * two cannot drift into looking like two different sites.
 */
export const NOT_FOUND_TITLE = seoTitle("404");

/**
 * The card a page falls back to when it has no image of its own — the site's
 * own social card. Shared so the editor's preview shows the picture a post
 * without an `ogImage` will actually be shared with, rather than a guess.
 */
export const DEFAULT_OG_IMAGE = "/seo/social-card.png";

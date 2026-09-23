// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Leo Chiu",
  description: "Senior Software Engineer at KKday.",
  // No `icons` block on purpose. `src/app/icon.svg` and `src/app/apple-icon.png`
  // are file conventions, so Next emits both links itself with hashed URLs. An
  // `icons` literal here does not add to those — it replaces them, and naming
  // only `apple` is how the favicon went missing while the touch icon stayed.
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  // Without `max-image-preview:large` Google caps post thumbnails in Search and
  // AI Overviews at a small preview, so every hero ships as a postage stamp.
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  // Neither block states a title or a description. Next replaces a metadata
  // block rather than merging into it, so a literal here is not a default — it
  // is what every page that does not spell out its own `openGraph`/`twitter`
  // ships instead of its title. That is how the Issue pages came to unfurl as
  // "Leo Chiu — Senior Software Engineer at KKday.". Left unset, both derive
  // from each page's own `title` and `description`, and fall back to this
  // file's when a page states none.
  openGraph: {
    // No `url` either, and for the same reason: as a shared default it told
    // every page that states no `openGraph` of its own that it was the
    // homepage. The pages that need one already carry the right value in
    // `alternates.canonical`, and they cannot lift it into an `openGraph`
    // block here without that block replacing this one — image included. An
    // absent og:url resolves to the URL the crawler fetched, which is right.
    siteName: "Leo Chiu",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  // One root layout for the homepage and everything it links to. Next turns a
  // navigation across two root layouts into a full page load (see
  // node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md),
  // so the homepage having its own was what made opening a post a reload, with
  // no view transition to play between the two.
  //
  // No theme class here: an article's theme depends on which post is being read
  // (see the `[slug]` page), and the homepage's follows its mode. Both land on
  // <main> instead, and `html:has(.dark)` in globals.css keeps <html> in step.
  //
  // lang is the site's language, not the page's: a root layout is prerendered
  // once as the shared static shell and never learns which route it wraps. A
  // page in another language says so on its own <main>, as the homepage does.
  return (
    <html lang="zh-Hant" className={fontVariables}>
      <body className="flex justify-center bg-background font-garamond antialiased">
        {children}
      </body>
    </html>
  );
}

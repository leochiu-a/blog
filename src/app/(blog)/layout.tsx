// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Leo Chiu",
  description: "Senior Software Engineer at KKday.",
  icons: {
    icon: "/seo/icon.svg",
    apple: "/seo/apple-touch-icon.png",
  },
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

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  // No theme class here: an article's theme depends on which post is being read
  // (see the `[slug]` page), which a root layout can't know. It lands on <main>
  // instead, and `html:has(.dark)` in globals.css keeps <html> in step.
  //
  // lang is hardcoded rather than derived from the post: this layout has no
  // `app/layout.tsx` above it, so it's a root layout for its own subtree (see
  // node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md,
  // "Root Layout"), and a root layout is prerendered once as the shared
  // static shell — it never receives the `[slug]` param. Every published
  // post is Traditional Chinese today; revisit if an English post ships.
  return (
    <html lang="zh-Hant" className={fontVariables}>
      <body className="flex justify-center bg-background font-garamond antialiased">
        {children}
      </body>
    </html>
  );
}

// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Leo Chiu",
  description: "Frontend engineer & developer",
  icons: {
    icon: "/seo/icon.svg",
    apple: "/seo/apple-touch-icon.png",
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    title: "Leo Chiu",
    description: "Frontend engineer & developer",
    url: SITE_URL,
    siteName: "Leo Chiu",
    images: ["/seo/social-card.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leo Chiu",
    description: "Frontend engineer & developer",
    images: ["/seo/social-card.png"],
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
    <html lang="zh-Hant" className={fontVariables} data-scroll-behavior="smooth">
      <body className="flex justify-center bg-background scroll-smooth font-garamond antialiased">
        {children}
      </body>
    </html>
  );
}

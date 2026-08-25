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
  return (
    <html lang="en" className={fontVariables} data-scroll-behavior="smooth">
      <body className="flex justify-center bg-background scroll-smooth font-garamond antialiased">
        {children}
      </body>
    </html>
  );
}

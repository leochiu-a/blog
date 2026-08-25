// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
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

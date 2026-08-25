// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Home • Leo Chiu",
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

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  // Homepage defaults to the dark theme (professional mode); PortfolioApp
  // toggles `.dark` on <html> client-side when switching to personal mode.
  return (
    <html lang="en" className={`dark ${fontVariables}`} data-scroll-behavior="smooth">
      <body className="flex justify-center bg-background scroll-smooth font-garamond antialiased">
        {children}
      </body>
    </html>
  );
}

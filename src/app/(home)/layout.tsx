// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  description: "Senior Software Engineer at KKday.",
  icons: {
    icon: "/seo/icon.svg",
    apple: "/seo/apple-touch-icon.png",
  },
  openGraph: {
    title: "Leo Chiu",
    description: "Senior Software Engineer at KKday.",
    url: SITE_URL,
    siteName: "Leo Chiu",
    images: ["/seo/social-card.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leo Chiu",
    description: "Senior Software Engineer at KKday.",
    images: ["/seo/social-card.png"],
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  // No theme class here: which theme the homepage wears follows the mode, and
  // the mode is client state so the switch can animate (see PortfolioApp). The
  // class lives on <main> instead, and `html:has(.dark)` in globals.css keeps
  // <html> in step — the same arrangement the blog subtree uses.
  //
  // `title` and `alternates` are set per page rather than here, so `/` and
  // `/personal/` each carry their own canonical.
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex justify-center bg-background font-garamond antialiased">
        {children}
      </body>
    </html>
  );
}

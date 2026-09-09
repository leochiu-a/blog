// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  description: "Senior Software Engineer at KKday.",
  icons: {
    icon: "/seo/icon.svg",
    apple: "/seo/apple-touch-icon.png",
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

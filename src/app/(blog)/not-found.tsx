import type { Metadata } from "next";
import { UfoAbduction } from "@/components/UfoAbduction";
import { NOT_FOUND_TITLE } from "@/lib/site";

/* `global-not-found` only answers a URL that matches no route at all. A URL
   that *does* match — `/blog/<unknown-slug>/`, `/newsletter/<unknown-slug>/`,
   dynamic segments that match anything and then call `notFound()` — is a
   segment-level 404, and Next looks for a `not-found` file up that segment's
   own tree instead. Without this one it fell back to its built-in 404, so the
   two ways of missing a page looked like two different sites.

   Metadata lives here rather than in the page that threw: for a segment-level
   404 Next resolves the head from this boundary, so a `notFound()` branch in
   `generateMetadata` never runs.

   The body only, not a whole document — unlike `global-not-found` this renders
   inside the (blog) root layout, which already brings the stylesheet, the
   fonts and <body>. The centring the global file does with body classes has to
   happen here instead: that <body> is laid out for articles and only centres
   horizontally. */
export const metadata: Metadata = {
  title: NOT_FOUND_TITLE,
  description: "This page has been abducted.",
};

export default function BlogNotFound() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center">
      <UfoAbduction />
    </div>
  );
}

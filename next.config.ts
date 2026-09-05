import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";
import createMDX from "@next/mdx";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { pageExtensionsFor } from "./src/lib/editor/dev-routes";

const nextConfig: NextConfig = {
  // Match the previous (Astro) URL scheme: /blog/<slug>/ with a trailing slash.
  trailingSlash: true,
  experimental: {
    // Serve `app/global-not-found.tsx` for unmatched URLs. Needed because every
    // route sits in a group with its own root layout, so a plain `not-found`
    // has no layout to render inside.
    globalNotFound: true,
    // Off to stop an unbounded prefetch loop, not for the inlining itself.
    //
    // `@opennextjs/aws` picks the segment payload only when this is falsy. Next
    // 16.3 turned it on by default and normalizes it to an object, so that
    // check never passes under cache interception: every
    // `Next-Router-Segment-Prefetch` comes back as the whole-page RSC payload
    // with no `x-nextjs-postponed`, the client never counts the prefetch as
    // satisfied, and it asks again — in real visitors' tabs, without a bound.
    // See opennextjs/opennextjs-cloudflare#1334; the fix is #1348.
    //
    // `false` restores what 16.2 did: each segment is prefetched as its own
    // request. More requests than inlining, but a fixed number of them.
    // Preferred over turning off cache interception (which would put the
    // routing work back on every request, against a 10ms CPU limit) and over
    // `prefetch={false}` on 22 links (which no lint rule would keep in place).
    //
    // Drop this once #1348 ships. To check whether it is still needed, send a
    // `Next-Router-Segment-Prefetch` request and see whether the response is
    // byte-identical to the full-page payload.
    //
    // Production only — deliberately not `next dev`. The loop it prevents is in
    // opennext's cache interception, which only exists in the deployed worker,
    // and switching inlining off locally breaks `global-not-found`: the router
    // asks for this URL's segment payload separately, the bypassed 404 page has
    // none to give, the request comes back as 404 HTML, and the router reloads
    // the page — about twelve times a second, for as long as it is open.
    ...(process.env.NODE_ENV === "development" ? {} : { prefetchInlining: false }),
  },
  // Allow .mdx files to be imported as modules, and — in `next dev` only —
  // the `.dev.tsx` / `.dev.ts` routes the post editor is built from.
  pageExtensions: pageExtensionsFor(process.env.NODE_ENV),
  // `wrangler` is `require`d at runtime rather than bundled. The dev-only
  // subscriber dashboard imports `getPlatformProxy` from it to read the
  // deployed D1, and bundling drags in the platform-specific workerd package,
  // whose files Turbopack cannot parse — the dev server 500s on a README.
  //
  // Inert in a production build: nothing outside a `.dev.tsx` file imports
  // wrangler, and those are not routes there.
  serverExternalPackages: ["wrangler"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "opengraph.githubassets.com",
      },
    ],
  },
};

const withMDX = createMDX({
  // Treat .md the same as .mdx so posts can be authored in any markdown editor.
  extension: /\.mdx?$/,
  options: {
    // `.md` would otherwise be parsed as plain markdown, which silently drops
    // JSX — compile every post as MDX so components work regardless of extension.
    format: "mdx",
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
    rehypePlugins: [
      "rehype-slug",
      // Syntax highlighting, resolved at build time — shiki loads the grammars
      // while the MDX compiles, so a post ships as plain coloured HTML with no
      // highlighter in the bundle.
      //
      // Two themes at once: shiki writes `--shiki-light` / `--shiki-dark` onto
      // each token instead of a fixed colour, and globals.css picks the one
      // matching the active theme. `keepBackground: false` drops shiki's own
      // panel background so the `pre` styling in globals.css still owns the
      // block's frame — only the token colours come from here.
      //
      // Plugins are named as strings, and their options have to stay
      // serializable, because Turbopack can't pass JavaScript into Rust.
      [
        "rehype-pretty-code",
        {
          theme: { light: "github-light", dark: "github-dark" },
          keepBackground: false,
        },
      ],
    ],
  },
});

export default withContentCollections(withMDX(nextConfig));

// Expose the Workers bindings (ASSETS, IMAGES, ...) to `next dev`.
initOpenNextCloudflareForDev();

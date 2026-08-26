import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";
import createMDX from "@next/mdx";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { pageExtensionsFor } from "./src/lib/editor/dev-routes";

const nextConfig: NextConfig = {
  // Match the previous (Astro) URL scheme: /blog/<slug>/ with a trailing slash.
  trailingSlash: true,
  // Allow .mdx files to be imported as modules, and — in `next dev` only —
  // the `.dev.tsx` / `.dev.ts` routes the post editor is built from.
  pageExtensions: pageExtensionsFor(process.env.NODE_ENV),
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
    rehypePlugins: ["rehype-slug"],
  },
});

export default withContentCollections(withMDX(nextConfig));

// Expose the Workers bindings (ASSETS, IMAGES, ...) to `next dev`.
initOpenNextCloudflareForDev();

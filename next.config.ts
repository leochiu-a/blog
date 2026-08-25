import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Match the previous (Astro) URL scheme: /blog/<slug>/ with a trailing slash.
  trailingSlash: true,
  // Allow .mdx files to be imported as modules.
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
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

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
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withContentCollections(withMDX(nextConfig));

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());

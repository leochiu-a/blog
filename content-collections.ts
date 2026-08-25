import { createDefaultImport, defineCollection, defineConfig } from "@content-collections/core";
import type { MDXContent } from "mdx/types";
import { z } from "zod";

const posts = defineCollection({
  name: "posts",
  directory: "src/content/blog",
  include: "**/*.md",
  parser: "frontmatter-only",
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    datetime: z.string(),
    readTime: z.string(),
    font: z.enum(["garamond", "newsreader"]),
    category: z.enum(["professional", "personal"]),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
  }),
  transform: async ({ _meta, ...document }) => {
    const slug = _meta.path;
    const date = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(document.datetime));
    const mdx = createDefaultImport<MDXContent>(`@/content/blog/${_meta.filePath}`);
    return {
      ...document,
      mdx,
      slug,
      date,
      href: `/blog/${slug}/`,
    };
  },
});

export default defineConfig({
  content: [posts],
});

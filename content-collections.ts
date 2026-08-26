import { createDefaultImport, defineCollection, defineConfig } from "@content-collections/core";
import type { MDXContent } from "mdx/types";
import { postFrontmatterSchema } from "./src/lib/post-frontmatter";

const posts = defineCollection({
  name: "posts",
  directory: "src/content/blog",
  include: "**/*.md",
  parser: "frontmatter-only",
  schema: postFrontmatterSchema,
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

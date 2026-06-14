import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { z } from "zod";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type TocItem = {
  text: string;
  href: string;
  sub: boolean;
};

function extractToc(content: string): TocItem[] {
  const toc: TocItem[] = [];
  for (const line of content.split("\n")) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2) {
      const text = h2[1].trim();
      toc.push({ text, href: `#${slugify(text)}`, sub: false });
    } else if (h3) {
      const text = h3[1].trim();
      toc.push({ text, href: `#${slugify(text)}`, sub: true });
    }
  }
  return toc;
}

const posts = defineCollection({
  name: "posts",
  directory: "src/content/blog",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    datetime: z.string(),
    readTime: z.string(),
    font: z.enum(["garamond", "newsreader"]),
    category: z.enum(["professional", "personal"]),
    featured: z.boolean().optional(),
    content: z.string(),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    });
    const { _meta, ...rest } = document;
    const slug = _meta.path;
    const date = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(document.datetime));
    return {
      ...rest,
      mdx,
      toc: extractToc(document.content),
      slug,
      date,
      href: `/blog/${slug}/`,
    };
  },
});

export default defineConfig({
  content: [posts],
});

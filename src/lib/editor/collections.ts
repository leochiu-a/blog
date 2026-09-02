import type { z } from "zod";
import { issueFrontmatterSchema } from "@/lib/newsletter/issue-frontmatter";
import { postFrontmatterSchema } from "@/lib/post-frontmatter";

/**
 * The two kinds of document the editor writes: Posts under `src/content/blog`
 * and Issues under `src/content/newsletter`.
 *
 * Everything that differs between them is gathered here — where the files
 * live, which frontmatter keys content-collections requires, what a new draft
 * starts as, where the published document is served — so the rest of the
 * editor is written once and only ever branches on a collection name.
 */

export type CollectionName = "posts" | "issues";

export interface Collection {
  name: CollectionName;
  /** What this collection is called in the editor's own chrome. */
  label: string;
  /** Where the files live, relative to the project root. */
  directory: string;
  /**
   * Keys content-collections requires. Removing one stops the document
   * compiling, so the editor may blank them but never drop them.
   */
  requiredKeys: string[];
  /** Where a published document is served, for the Preview link. */
  previewBase: string;
  /**
   * Whether blocks beyond plain Markdown are worth offering.
   *
   * An Issue is rendered into an inbox by `src/lib/newsletter/email.ts`, which
   * knows Markdown and nothing else: an MDX component there is dropped from
   * the email while still showing on the archive page — written, visible in
   * preview, and silently missing from the thing that was actually sent. So
   * the editor does not offer them, and does not take a dropped image either.
   */
  mdxBlocks: boolean;
  /** The frontmatter a new draft is created with, given today's date. */
  newDraft: (today: string) => Record<string, unknown>;
}

function requiredKeys(shape: Record<string, z.ZodType>): string[] {
  return Object.entries(shape)
    .filter(([, field]) => !field.safeParse(undefined).success)
    .map(([key]) => key);
}

export const COLLECTIONS: Record<CollectionName, Collection> = {
  posts: {
    name: "posts",
    label: "Posts",
    directory: "src/content/blog",
    requiredKeys: requiredKeys(postFrontmatterSchema.shape),
    previewBase: "/blog",
    mdxBlocks: true,
    // Every field content-collections requires, so a new post compiles the
    // moment it lands on disk. `draft` keeps it out of production until ready.
    newDraft: (today) => ({
      title: "",
      datetime: today,
      readTime: "1 min",
      category: "professional",
      draft: true,
    }),
  },
  issues: {
    name: "issues",
    label: "Newsletter",
    directory: "src/content/newsletter",
    requiredKeys: requiredKeys(issueFrontmatterSchema.shape),
    previewBase: "/newsletter",
    mdxBlocks: false,
    // An Issue has no category and no read time: it is written for an inbox,
    // where neither means anything.
    newDraft: (today) => ({ title: "", datetime: today, draft: true }),
  },
};

export function collectionOf(name: CollectionName): Collection {
  return COLLECTIONS[name];
}

/** Where a document is edited. */
export function editorPath(collection: CollectionName, slug: string): string {
  return `/editor/${collection}/${slug}`;
}

/** The API a document is read from and written back to. */
export function apiPath(collection: CollectionName, slug?: string): string {
  return slug === undefined ? `/api/editor/${collection}/` : `/api/editor/${collection}/${slug}/`;
}

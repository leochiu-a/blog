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

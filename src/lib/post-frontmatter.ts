import { z } from "zod";

/**
 * The shape of a post's frontmatter, defined once.
 *
 * `content-collections.ts` validates published posts against this, and the
 * editor reads its key lists from it — so adding a field is one edit, not
 * five scattered ones.
 */
export const postFrontmatterSchema = z.object({
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
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export const FONTS = postFrontmatterSchema.shape.font.options;
export const CATEGORIES = postFrontmatterSchema.shape.category.options;

/**
 * Keys content-collections requires. Removing one stops the post compiling,
 * so the editor may blank them but never drop them.
 */
export const REQUIRED_KEYS = Object.entries(postFrontmatterSchema.shape)
  .filter(([, field]) => !field.safeParse(undefined).success)
  .map(([key]) => key);

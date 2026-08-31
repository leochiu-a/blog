import { z } from "zod";

/**
 * The shape of an Issue's frontmatter.
 *
 * An Issue is written for email and stands on its own — it may link to several
 * Posts or to none — so it carries its own title and date rather than deriving
 * them from a Post. See the Issue entry in CONTEXT.md.
 */
export const issueFrontmatterSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  datetime: z.string(),
  /** Subject line, when it should read differently from the title. */
  subject: z.string().optional(),
  /** Keeps an unfinished Issue out of the archive and out of the send script. */
  draft: z.boolean().optional(),
});

export type IssueFrontmatter = z.infer<typeof issueFrontmatterSchema>;

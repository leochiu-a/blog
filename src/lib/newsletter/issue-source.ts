import { parse as parseYaml } from "yaml";
import { type IssueFrontmatter, issueFrontmatterSchema } from "./issue-frontmatter.ts";

/**
 * Reading an Issue's file as the two things a send needs: validated
 * frontmatter, and the Markdown under it.
 *
 * Separate from the editor's own parser, which turns the same file into a
 * ProseMirror document and keeps the YAML text around for lossless saves. This
 * one answers a narrower question — is this Issue mailable, and what would be
 * in the mail — and it answers it identically for the real send and for the
 * test send, which is the point: two paths that render the same file must not
 * disagree about what is in it.
 *
 * Failure comes back as a message rather than an exception because both callers
 * have a good place to put one: the route answers with it, and the dialog shows
 * it. Neither wants a stack trace.
 */
export type IssueSource =
  | { ok: true; frontmatter: IssueFrontmatter; markdown: string }
  | { ok: false; error: string };

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

export function parseIssueSource(slug: string, source: string): IssueSource {
  const match = FRONTMATTER.exec(source);
  if (!match) return { ok: false, error: `${slug}.md 沒有 frontmatter` };

  const parsed = issueFrontmatterSchema.safeParse(parseYaml(match[1]!));
  if (!parsed.success) {
    return { ok: false, error: `${slug}.md 的 frontmatter 有問題：${parsed.error.message}` };
  }

  return {
    ok: true,
    frontmatter: parsed.data,
    markdown: source.slice(match[0].length).trimStart(),
  };
}

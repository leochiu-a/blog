import { parse as parseYaml } from "yaml";
import type { z } from "zod";
import { type IssueFrontmatter, issueFrontmatterSchema } from "./issue-frontmatter.ts";
import { type PostFrontmatter, postFrontmatterSchema } from "../post-frontmatter.ts";

/**
 * Reading an Issue's or a Post's file as the two things a send needs: validated
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
export type Source<Frontmatter> =
  | { ok: true; frontmatter: Frontmatter; markdown: string }
  | { ok: false; error: string };

export type IssueSource = Source<IssueFrontmatter>;
export type PostSource = Source<PostFrontmatter>;

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

function parseSource<Frontmatter>(
  file: string,
  source: string,
  schema: z.ZodType<Frontmatter>,
): Source<Frontmatter> {
  const match = FRONTMATTER.exec(source);
  if (!match) return { ok: false, error: `${file} 沒有 frontmatter` };

  const parsed = schema.safeParse(parseYaml(match[1]!));
  if (!parsed.success) {
    return { ok: false, error: `${file} 的 frontmatter 有問題：${parsed.error.message}` };
  }

  return {
    ok: true,
    frontmatter: parsed.data,
    markdown: source.slice(match[0].length).trimStart(),
  };
}

export function parseIssueSource(slug: string, source: string): IssueSource {
  return parseSource(`${slug}.md`, source, issueFrontmatterSchema);
}

export function parsePostSource(slug: string, source: string): PostSource {
  return parseSource(`${slug}.md`, source, postFrontmatterSchema);
}

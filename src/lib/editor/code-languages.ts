/**
 * The languages the code block picker offers.
 *
 * Short names, because that's what the posts already use and what both
 * highlighters accept. Every one is verified to resolve on both sides — shiki
 * when the post is built, lowlight while typing — so the picker can't offer a
 * language that quietly renders as plain text in one of the two.
 *
 * Deliberately a curated list rather than all 37 of highlight.js' common set:
 * a dropdown is for choosing, and Arduino and VB.NET aren't choices this blog
 * ever makes. A language typed by hand into the fence is never taken away
 * though — see `languageOptions`.
 */
export const CODE_LANGUAGES = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "html",
  "css",
  "scss",
  "bash",
  "sql",
  "python",
  "go",
  "rust",
  "yaml",
  "md",
  "diff",
  "graphql",
] as const;

/** A fence with no language at all, which is the markdown default. */
export const NO_LANGUAGE = "";

/**
 * The options to show for a block currently set to `language`.
 *
 * A language the list doesn't know — ```` ```kotlin ````, written by hand — is
 * appended rather than dropped, so opening the picker can't silently rewrite a
 * post's fence to something else.
 */
export function languageOptions(language: string | null): string[] {
  const current = language ?? NO_LANGUAGE;
  const known: string[] = [NO_LANGUAGE, ...CODE_LANGUAGES];
  return known.includes(current) ? known : [...known, current];
}

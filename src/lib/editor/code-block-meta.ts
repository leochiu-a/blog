/**
 * A fenced block's info string past the language — ```` ```js showLineNumbers ````.
 *
 * rehype-pretty-code reads its per-block options from here, so the editor's
 * controls edit this string rather than inventing an attribute of their own:
 * whatever a control writes is exactly what the published page reads back.
 * Everything else in the meta (a `title="…"`, a `{1-3}` line range) is left
 * alone, so a block can carry options this editor has no UI for yet.
 */

/** Matches rehype-pretty-code's own regex, so the editor agrees with the renderer. */
const LINE_NUMBERS = /(?:^|\s)showLineNumbers(?:\{\d+\})?(?=\s|$)/;

export function hasLineNumbers(meta: string | null): boolean {
  return meta !== null && LINE_NUMBERS.test(meta);
}

/**
 * Turn line numbers on or off, keeping the rest of the meta intact.
 *
 * Returns `null` for an empty result, because that's the attribute's default —
 * a block with no options must serialize as ```` ```js ````, not ```` ```js ````
 * with a trailing space.
 *
 * Turning them off drops a `showLineNumbers{98}` start offset along with the
 * token; turning them back on starts from 1. Anyone who wants the offset back
 * types it, the same way they'd type any other meta option.
 */
export function toggleLineNumbers(meta: string | null): string | null {
  const current = meta ?? "";
  const next = hasLineNumbers(current)
    ? current.replace(LINE_NUMBERS, "")
    : `${current} showLineNumbers`;
  const collapsed = next.replace(/\s+/g, " ").trim();
  return collapsed === "" ? null : collapsed;
}

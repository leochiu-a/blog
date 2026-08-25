/**
 * Section break within an article — a hairline across the full column, the way
 * Substack renders a divider.
 *
 * Renders a real `<hr>` rather than a styled `<div>`: screen readers announce
 * the break, and scrapers that map HTML onto their own document model (Medium's
 * importer, for one) only recognise a section break from an actual `<hr>`.
 */
export function OrnamentSeparator() {
  return <hr className="my-12 h-px w-full border-0 bg-border not-prose" />;
}

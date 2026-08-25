/**
 * Section break within an article — a plain short rule, Substack-style.
 *
 * Renders a real `<hr>` rather than a styled `<div>`: screen readers announce
 * the break, and scrapers that map HTML onto their own document model (Medium's
 * importer, for one) only recognise a section break from an actual `<hr>`.
 */
export function OrnamentSeparator() {
  return <hr className="mx-auto my-10 h-px w-16 border-0 bg-border not-prose" />;
}

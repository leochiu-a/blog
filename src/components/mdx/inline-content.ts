/**
 * Inline styling for MDX components marked `not-prose`.
 *
 * `not-prose` stops Tailwind Typography — and the hand-written rules in
 * globals.css, which repeat its guard — at the component's subtree. That
 * isolation is the point for block styling, but it takes links and inline code
 * down with it: a link inside one of these renders in the body colour with no
 * underline, indistinguishable from the sentence around it.
 *
 * Restate just those two treatments, sized in `em` so each component scales
 * them off its own font size rather than the page's.
 */
export const inlineContent =
  "[&_a]:font-medium [&_a]:text-blog-accent [&_a:hover]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-[0.35em] [&_code]:py-[0.15em] [&_code]:font-normal [&_code]:text-[0.875em]";

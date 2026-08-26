import Link from "next/link";

/**
 * A way into the editor from the post you're reading. Rendered only when the
 * page is running under `next dev` — the `/editor` route it points at doesn't
 * exist in a production build (see src/lib/editor/dev-routes.ts).
 *
 * The guard is repeated in `PostsSection`'s own dev link rather than shared
 * through a wrapper component on purpose: a wrapper receives its children as
 * a prop, so the link element would be constructed before the check runs and
 * the markup would survive into the production bundle. Returning early from
 * the component that owns the JSX is what lets it be eliminated entirely.
 *
 * `ml-auto` puts it at the end of the byline row without the row itself
 * needing `justify-between`, so the published layout is untouched.
 */
export function DevEditLink({ slug }: { slug: string }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Link
      href={`/editor/${slug}`}
      className="ml-auto rounded-full border border-border px-3 py-1 font-sans text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      Edit
    </Link>
  );
}

import Link from "next/link";

/**
 * A way into the editor from the post you're reading. Rendered only when the
 * page is running under `next dev` — the `/editor` route it points at doesn't
 * exist in a production build (see src/lib/editor/dev-routes.ts).
 */
export function DevEditLink({ slug }: { slug: string }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Link
      href={`/editor/${slug}`}
      className="rounded-full border border-border px-3 py-1 font-sans text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      Edit
    </Link>
  );
}

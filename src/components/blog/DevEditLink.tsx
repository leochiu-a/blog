import Link from "next/link";
import { SquarePenIcon } from "lucide-react";
import { type CollectionName, editorPath } from "@/lib/editor/collections";

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
 * Styled to match `SharePost`'s trigger, deliberately by hand rather than
 * through a shared class: the two are the only controls in a post's byline row
 * and have to read as a pair, but nothing prod-side should have to import from
 * a dev-only file to stay in step with it. On an Issue it stands alone.
 *
 * The collection is passed in rather than inferred: both Posts and Issues are
 * edited through this link, and `editorPath` needs to know which of the two
 * this slug belongs to.
 */
export function DevEditLink({ collection, slug }: { collection: CollectionName; slug: string }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Link
      href={editorPath(collection, slug)}
      className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
    >
      <SquarePenIcon className="size-4" />
      Edit
    </Link>
  );
}

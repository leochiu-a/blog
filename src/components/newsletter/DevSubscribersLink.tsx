import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Way into the subscriber dashboard from the pages that fill it.
 *
 * Rendered only while `next dev` is running: `/editor/subscribers` is absent
 * from a production build (see src/lib/editor/dev-routes.ts), so without the
 * guard the live newsletter pages would offer readers a 404 — and how many
 * people took the offer is nobody's business but mine. The check lives in the
 * component that owns the JSX rather than in a wrapper, so `NODE_ENV` being
 * inlined at build time leaves nothing of the link in the bundle — see
 * `DevEditLink` for the longer version.
 *
 * Styled after `DevEditLink` rather than after the `Home` link beside it: both
 * are dev-only controls sitting in a reader's chrome, and they should read as
 * the same kind of thing rather than as one more item of site navigation. The
 * editor's own header uses it too, so the way to the numbers looks the same
 * wherever it is offered.
 *
 * `className` is for placement only — where in a bar it sits is the bar's
 * business, and how it looks is this component's.
 */
export function DevSubscribersLink({ className }: { className?: string }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Link
      href="/editor/subscribers"
      className={cn(
        "inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground",
        className,
      )}
    >
      <UsersIcon className="size-4" />
      Subscribers
    </Link>
  );
}

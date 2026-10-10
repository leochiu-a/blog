import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Where a demo sits: past the text column on both sides, with room above and
 * below. Exported so the editor's frame around a demo block can take the same
 * box, instead of drawing its outline around the column the demo spills out of.
 *
 * From `xl` the left margin also holds the contents tree, and the bleed takes
 * only what the tree leaves: on a MacBook-width window the tree fills the
 * margin and the demo keeps to the column, and as the window widens past the
 * tree's 352px cap the bleed grows back to 48px (by 1640px). Measured in `cqw`
 * against the page's `<main>` container, in the same terms as `TocTree`: the
 * room left of the column, less the tree and its 16px gap, comes to
 * `50cqw - 45.75rem`.
 */
export const DEMO_PLACEMENT =
  "-mx-3 my-10 sm:-mx-6 lg:-mx-12 xl:-mx-[clamp(0px,calc(50cqw-45.75rem),3rem)]";

/**
 * The frame every interactive demo in a post sits in.
 *
 * It bleeds past the 728px text column, and a labelled header strip sets it
 * apart from a plain bordered box, so a reader can tell at a glance that the
 * block is something to play with rather than another figure. The bleed stays
 * inside the page's own side padding (24px, 40px from `sm`), and widens only
 * from `lg`, where the margins beside the column have room for it.
 *
 * `className` lays out the body, which each demo arranges differently.
 */
export function Demo({
  label = "Demo",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure
      className={cn(
        "not-prose rounded-xl border border-border bg-background font-sans text-sm shadow-sm",
        DEMO_PLACEMENT,
      )}
    >
      <figcaption className="flex items-center gap-2 rounded-t-xl border-b border-border bg-muted px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
        {label}
      </figcaption>
      {/* A dot grid, the canvas look of a playground, is what says "try me"
          once the label has scrolled past. */}
      <div
        className={cn(
          "rounded-b-xl bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-size-[16px_16px] p-6",
          className,
        )}
      >
        {children}
      </div>
    </figure>
  );
}

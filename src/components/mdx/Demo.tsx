import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <figure className="not-prose -mx-3 my-10 rounded-xl border border-border bg-background font-sans text-sm shadow-sm sm:-mx-6 lg:-mx-12">
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

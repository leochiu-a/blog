"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import type { Post } from "@/types/content";
import { cn } from "@/lib/utils";

/**
 * A dashed-ident naming the title's anchor, derived from its slug so the card
 * and the title it belongs to name the same thing without sharing an index.
 * Fed to CSS as a custom property: `anchor-name` takes an ident, not a string,
 * and a custom property is the one way to hand it one from React.
 */
export function anchorNameFor(href: string): CSSProperties {
  return { "--post-anchor": `--post-${href.replace(/[^a-z0-9]+/gi, "-")}` } as CSSProperties;
}

/**
 * The cover and summary of whichever post is being hovered.
 *
 * Every post's card is rendered up front and only its opacity switches:
 * crossfading two mounted nodes is what makes moving down the list read as one
 * preview changing its mind rather than a box blinking out and back.
 *
 * Where CSS anchor positioning is supported each card leaves the flow and pins
 * itself beside its own title (see globals.css); everywhere else they stack in
 * the left column under the "Posts" label. Either way they are out of flow, so
 * nothing shifts as they come and go.
 *
 * Hover-only by nature, so it is `aria-hidden` and hidden below `md` — the
 * summary belongs to the post it links to, not to this card.
 */
export function PostPreviewPanel({
  posts,
  activeHref,
}: {
  posts: Post[];
  activeHref: string | null;
}) {
  return (
    <div className="pointer-events-none relative mt-4 hidden md:block" aria-hidden="true">
      {posts.map((post) => {
        const active = post.href === activeHref;
        return (
          <div
            key={post.href}
            style={anchorNameFor(post.href)}
            className={cn(
              "post-preview absolute inset-x-0 top-0 z-20 mr-6 transition-opacity duration-300 ease-out",
              // Anchored, the card hangs over the divider and the section
              // below, so it carries its own surface rather than floating as
              // loose text on whatever it happens to cover.
              "rounded-lg bg-popover/95 p-2.5 shadow-xl ring-1 ring-foreground/10 backdrop-blur-sm",
              active ? "opacity-100" : "opacity-0",
            )}
          >
            {post.ogImage && (
              <div className="relative aspect-3/2 w-full overflow-hidden rounded-sm">
                <Image
                  src={post.ogImage}
                  alt=""
                  fill
                  sizes="240px"
                  className={cn(
                    // Settling out of a slight zoom gives the fade somewhere to
                    // go; the longer duration keeps it a drift, not a pop.
                    "object-cover transition-transform duration-500 ease-out",
                    active ? "scale-100" : "scale-105",
                  )}
                />
              </div>
            )}
            <p
              className={cn(
                // Trails the image by a beat so the card resolves top-down
                // instead of arriving all at once.
                "mt-2.5 font-sans text-[13px] leading-relaxed text-muted-foreground transition-[transform,opacity] duration-300 ease-out",
                "line-clamp-4",
                active ? "translate-y-0 opacity-100 delay-75" : "translate-y-1 opacity-0",
              )}
            >
              {post.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

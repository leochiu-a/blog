"use client";

import { useState } from "react";
import { Demo } from "./Demo";

/**
 * Why GitHub reaching for `popover` matters, in one box that clips.
 *
 * Both menus sit inside a container with `overflow: hidden`. The absolutely
 * positioned one is cut off at the container's edge; the popover is promoted
 * to the top layer and is drawn over it, with light dismiss and Esc for free.
 */
export function TopLayerDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Demo className="p-4">
      <div className="relative flex h-24 items-start gap-3 overflow-hidden rounded-md border border-dashed border-border p-3">
        <span className="absolute right-2 bottom-1 text-xs text-muted-foreground">
          overflow: hidden
        </span>

        <div className="relative">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            absolute 選單
          </button>
          {open && (
            <ul className="absolute top-full left-0 mt-1 w-40 rounded-md border border-border bg-background p-2 shadow-md">
              <li>Assignees</li>
              <li>Labels</li>
              <li>Projects</li>
              <li>Milestone</li>
            </ul>
          )}
        </div>

        <div>
          <button
            type="button"
            popoverTarget="top-layer-menu"
            style={{ anchorName: "--top-layer-menu" } as React.CSSProperties}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            popover 選單
          </button>
          <ul
            id="top-layer-menu"
            popover="auto"
            style={
              {
                positionAnchor: "--top-layer-menu",
                positionArea: "bottom span-right",
              } as React.CSSProperties
            }
            className="m-0 mt-1 w-40 rounded-md border border-border bg-background p-2 text-foreground shadow-md inset-auto"
          >
            <li>Assignees</li>
            <li>Labels</li>
            <li>Projects</li>
            <li>Milestone</li>
          </ul>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        兩個選單各有四個項目，但容器只有 96px 高。左邊的被切掉，右邊的不會；點空白處或按 Esc
        也只有右邊會自己關。
      </p>
    </Demo>
  );
}

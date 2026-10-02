"use client";

import { useState } from "react";
import { Demo } from "./Demo";

/**
 * One popover, opened by a button, with `@starting-style` switchable on and off.
 *
 * Off, the popover has the same `transition` and the same `:popover-open`
 * styles — but nothing says where to start from, so it appears at full opacity
 * on the frame `display: none` goes away. On, the same box fades in and out.
 * The only difference between the two is the `starting:` variant.
 */
export function StartingStyleDemo() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Demo className="flex flex-col items-center gap-4 p-8">
      <button
        type="button"
        popoverTarget="starting-style-box"
        style={{ anchorName: "--starting-style-anchor" } as React.CSSProperties}
        className="rounded-md border border-border px-4 py-2 hover:bg-muted"
      >
        打開 popover
      </button>

      <div
        id="starting-style-box"
        popover="auto"
        style={
          {
            positionAnchor: "--starting-style-anchor",
            positionArea: "bottom",
          } as React.CSSProperties
        }
        className={
          "m-0 mt-2 rounded-md bg-foreground px-3 py-2 text-background inset-auto " +
          "transition-[opacity,display,overlay] transition-discrete duration-500 motion-reduce:transition-none " +
          (enabled ? "opacity-0 open:opacity-100 starting:open:opacity-0" : "opacity-100")
        }
      >
        {enabled ? "有 @starting-style：淡入、淡出" : "沒有：瞬間出現、瞬間消失"}
      </div>

      <label className="flex items-center gap-2 text-muted-foreground">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-4 accent-foreground"
        />
        套用 @starting-style 與 allow-discrete
      </label>
    </Demo>
  );
}

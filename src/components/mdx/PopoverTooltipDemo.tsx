"use client";

import { useId, useRef } from "react";
import { Demo } from "./Demo";

/**
 * GitHub's tooltip markup: a `popover="auto"` span that JavaScript opens on
 * hover or focus. GitHub then writes the coordinates into an inline
 * `top`/`left`; this one is placed beside its trigger by CSS Anchor
 * Positioning instead.
 *
 * There is no `popovertarget` here on purpose. A tooltip opens on hover, which
 * the declarative attribute cannot express, so `showPopover()` is called by
 * hand — the same reason GitHub's markup has none either.
 *
 * Where anchor positioning is unsupported the popover still opens in the top
 * layer, just centred in the viewport rather than beside the button.
 */
export function PopoverTooltipDemo() {
  const id = useId();
  const anchor = `--tip-${id.replace(/:/g, "")}`;
  const tip = useRef<HTMLSpanElement>(null);

  const show = () => tip.current?.showPopover();
  const hide = () => tip.current?.hidePopover();

  return (
    <Demo className="flex flex-col items-center gap-3 p-8">
      <button
        type="button"
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ anchorName: anchor } as React.CSSProperties}
        className="rounded-md border border-border px-4 py-2 hover:bg-muted"
      >
        把滑鼠移上來，或用 Tab 聚焦
      </button>
      <span
        ref={tip}
        id={id}
        role="tooltip"
        popover="auto"
        style={{ positionAnchor: anchor, positionArea: "top" } as React.CSSProperties}
        className="[position-try-fallbacks:flip-block] m-0 mb-2 rounded-md bg-foreground px-2.5 py-1.5 text-background opacity-0 transition-[opacity,display,overlay] transition-discrete duration-150 inset-auto open:opacity-100 starting:open:opacity-0"
      >
        我是 popover，不是 position: absolute
      </span>
      <p className="text-xs text-muted-foreground">
        靠近畫面上緣時，tooltip 會自己翻到下面（position-try-fallbacks）。
      </p>
    </Demo>
  );
}

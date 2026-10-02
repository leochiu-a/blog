"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { Demo } from "./Demo";

const TILES = [1, 2, 3, 4, 5, 6];

/**
 * The same shuffle, with and without `document.startViewTransition()`.
 *
 * Each tile has its own `view-transition-name`, so the browser can tell that
 * the tile that was third is now first and slide it there. The state update is
 * wrapped in `flushSync` because the transition takes its "after" snapshot as
 * soon as the callback returns — React has to have committed by then.
 */
export function ViewTransitionDemo() {
  const [order, setOrder] = useState(TILES);
  const [animate, setAnimate] = useState(true);

  const shuffle = () => {
    const next = [...order].sort(() => Math.random() - 0.5);
    const update = () => flushSync(() => setOrder(next));
    if (animate && "startViewTransition" in document) {
      document.startViewTransition(update);
    } else {
      update();
    }
  };

  return (
    <Demo className="flex flex-col gap-4 p-6">
      <ul className="grid grid-cols-3 gap-3">
        {order.map((n) => (
          <li
            key={n}
            style={{ viewTransitionName: `vt-tile-${n}` } as React.CSSProperties}
            className="grid h-14 place-items-center rounded-md bg-muted text-foreground"
          >
            {n}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={shuffle}
          className="rounded-md border border-border px-4 py-2 hover:bg-muted"
        >
          洗牌
        </button>
        <label className="flex items-center gap-2 text-muted-foreground">
          <input
            type="checkbox"
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
            className="size-4 accent-foreground"
          />
          用 startViewTransition
        </label>
      </div>
    </Demo>
  );
}

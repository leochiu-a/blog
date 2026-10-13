"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Demo } from "./Demo";

/**
 * `popover="auto"` next to `popover="manual"`, so the two kinds of closing
 * can be seen rather than read about.
 *
 * The two auto popovers are opened with `popovertarget` and nothing else:
 * opening one closes the other, and a click outside or Esc closes either.
 * Each toast is its own manual popover, so they pile up in the corner and stay
 * until their own × is pressed — nothing the reader does elsewhere closes them.
 *
 * Auto popovers sit under their buttons by Anchor Positioning; where that is
 * unsupported they fall back to the centre of the viewport.
 */
export function AutoManualDemo() {
  const id = useId().replace(/:/g, "");
  const [toasts, setToasts] = useState<number[]>([]);
  const [sent, setSent] = useState(0);

  const autoButton = (name: string) => (
    <div>
      <button
        type="button"
        popoverTarget={`${id}-${name}`}
        style={{ anchorName: `--${id}-${name}` } as React.CSSProperties}
        className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
      >
        auto 選單 {name}
      </button>
      <div
        id={`${id}-${name}`}
        popover="auto"
        style={
          {
            positionAnchor: `--${id}-${name}`,
            positionArea: "bottom span-right",
          } as React.CSSProperties
        }
        className="m-0 mt-1 w-40 rounded-md border border-border bg-background p-3 text-foreground shadow-md inset-auto"
      >
        我是選單 {name}
      </div>
    </div>
  );

  return (
    <Demo className="grid gap-6 sm:grid-cols-2">
      <section className="flex flex-col gap-3">
        <p className="font-medium">auto</p>
        <div className="flex flex-wrap gap-3">
          {autoButton("A")}
          {autoButton("B")}
        </div>
        <p className="text-xs text-muted-foreground">
          打開 A 再打開 B，A 會自己關掉。點空白處或按 Esc 也會關。
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <p className="font-medium">manual</p>
        <div>
          <button
            type="button"
            onClick={() => {
              setSent(sent + 1);
              setToasts((list) => [...list, sent + 1]);
            }}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            送出通知
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          多按幾次，通知會疊在畫面右下角。點空白處、按 Esc 都不會關，只有 × 會。
        </p>
      </section>

      {toasts.map((n, i) => (
        <Toast
          key={n}
          index={i}
          label={`通知 #${n}`}
          onClose={() => setToasts((list) => list.filter((t) => t !== n))}
        />
      ))}
    </Demo>
  );
}

function Toast({ index, label, onClose }: { index: number; label: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.showPopover();
  }, []);

  return (
    <div
      ref={ref}
      popover="manual"
      style={{ bottom: `${16 + index * 60}px` }}
      className="fixed inset-auto right-4 m-0 flex w-56 items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground shadow-lg"
    >
      {label}
      <button
        type="button"
        aria-label="關閉通知"
        onClick={onClose}
        className="rounded px-1.5 text-muted-foreground hover:bg-muted"
      >
        ×
      </button>
    </div>
  );
}

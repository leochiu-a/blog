"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Demo } from "./Demo";

type Mode = "plain" | "auto";

const ROWS = Array.from({ length: 4000 }, (_, i) => i);

/**
 * Renders the same 4,000 rows twice and times how long the browser takes to
 * lay them out, with and without `content-visibility: auto`.
 *
 * The number is whatever this browser on this machine does, which is the
 * point: with `auto`, rows outside the scroll box are never laid out, so the
 * cost stops growing with the length of the list.
 */
/**
 * Layout is lazy, so asking for a size inside the timer is what makes the
 * browser do the work being measured. Kept outside the component because a
 * clock read is not something a render may do.
 */
function timeLayout(commit: () => void, el: HTMLElement | null) {
  const start = performance.now();
  commit();
  el?.getBoundingClientRect();
  return Math.round(performance.now() - start);
}

export function ContentVisibilityDemo() {
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [times, setTimes] = useState<Partial<Record<Mode, number>>>({});

  const run = (next: Mode) => {
    flushSync(() => setMode(null));
    const elapsed = timeLayout(() => flushSync(() => setMode(next)), box.current);
    setTimes((t) => ({ ...t, [next]: elapsed }));
  };

  return (
    <Demo className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        {(["plain", "auto"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => run(m)}
            className="rounded-md border border-border px-4 py-2 hover:bg-muted"
          >
            {m === "plain" ? "渲染 4000 列" : "渲染 4000 列 + content-visibility: auto"}
          </button>
        ))}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted-foreground">
        <dt>一般</dt>
        <dd>{times.plain === undefined ? "–" : `${times.plain} ms`}</dd>
        <dt>content-visibility</dt>
        <dd>{times.auto === undefined ? "–" : `${times.auto} ms`}</dd>
      </dl>

      <div ref={box} className="h-32 overflow-auto rounded-md border border-border">
        {mode !== null &&
          ROWS.map((i) => (
            <div
              key={i}
              style={
                mode === "auto"
                  ? ({
                      contentVisibility: "auto",
                      containIntrinsicSize: "auto 36px",
                    } as React.CSSProperties)
                  : undefined
              }
              className="flex gap-3 border-b border-border px-3 py-2"
            >
              <span className="w-12 text-muted-foreground">#{i}</span>
              <span className="flex-1 truncate">src/components/Example{i}.tsx</span>
              <span className="text-muted-foreground">
                +{i % 40} −{i % 7}
              </span>
            </div>
          ))}
      </div>
    </Demo>
  );
}

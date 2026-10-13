"use client";

import { useId, useState } from "react";
import { Demo } from "./Demo";

/**
 * The same panel opened two ways: as a modal `<dialog>` and as a popover.
 *
 * The background button counts its clicks, which is the whole demo. Behind the
 * modal it cannot be reached at all, because `showModal()` makes the rest of
 * the page inert. Behind the popover the first click both lands on it and
 * light-dismisses the popover, because a popover never blocks the page.
 *
 * Both panels are opened with Invoker Commands rather than click handlers, so
 * the markup is the same HTML the post shows. React's types do not know
 * `command`/`commandfor` yet, hence the spread.
 */
export function ModalVsPopoverDemo() {
  const id = useId();
  const modalId = `${id}-modal`;
  const popoverId = `${id}-popover`;
  const [clicks, setClicks] = useState(0);

  const panel = (title: string, target: string, closeCommand: string) => (
    <>
      <p className="mb-2 font-medium">{title}</p>
      <p className="mb-4 text-muted-foreground">試著點背景的按鈕，或按 Tab。</p>
      <button
        type="button"
        {...{ commandfor: target, command: closeCommand }}
        className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
      >
        關閉
      </button>
    </>
  );

  const panelClass =
    "m-auto w-72 rounded-lg border border-border bg-background p-6 text-foreground shadow-lg";

  return (
    <Demo className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          {...{ commandfor: modalId, command: "show-modal" }}
          className="rounded-md border border-border px-4 py-2 hover:bg-muted"
        >
          用 showModal() 打開
        </button>
        <button
          type="button"
          {...{ commandfor: popoverId, command: "toggle-popover" }}
          className="rounded-md border border-border px-4 py-2 hover:bg-muted"
        >
          用 popover 打開
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setClicks((n) => n + 1)}
          className="rounded-md border border-dashed border-border px-4 py-2 hover:bg-muted"
        >
          背景的按鈕
        </button>
        <span className="text-muted-foreground">被點了 {clicks} 次</span>
      </div>

      <dialog id={modalId} className={`${panelClass} backdrop:bg-black/50`}>
        {panel("modal dialog", modalId, "close")}
      </dialog>

      <div id={popoverId} popover="auto" className={panelClass}>
        {panel("popover", popoverId, "hide-popover")}
      </div>
    </Demo>
  );
}

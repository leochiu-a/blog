"use client";

import { useId, useRef, useState } from "react";
import { Demo } from "./Demo";

/**
 * A modal with a draft in it, guarded against being closed by accident.
 *
 * Every way out except the "discard" button is a close request: Esc, a click
 * on the backdrop (`closedby="any"`), and `command="request-close"`. Each one
 * fires `cancel` first, and while the textarea holds text the handler calls
 * `preventDefault()` once to warn, then lets the next request through. The
 * "discard" button uses `command="close"`, which skips `cancel` entirely.
 *
 * The log shows which events fired, which is what the post is about: the
 * difference between `close()` and `requestClose()` is invisible otherwise.
 */
export function CloseRequestDemo() {
  const id = useId();
  const dialogId = `${id}-dialog`;
  const warned = useRef(false);
  const [draft, setDraft] = useState("");
  const [warning, setWarning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const record = (line: string) => setLog((prev) => [...prev, line].slice(-4));

  const buttonClass = "rounded-md border border-border px-3 py-1.5 hover:bg-muted";

  return (
    <Demo className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          {...{ commandfor: dialogId, command: "show-modal" }}
          onClick={() => {
            warned.current = false;
            setWarning(false);
            setLog([]);
          }}
          className="rounded-md border border-border px-4 py-2 hover:bg-muted"
        >
          打開留言框
        </button>
        <span className="text-muted-foreground">打幾個字，再試著用各種方式關掉它。</span>
      </div>

      <ol className="min-h-24 list-inside list-decimal rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        {log.length === 0 ? (
          <li className="list-none text-muted-foreground">事件紀錄會出現在這裡</li>
        ) : (
          log.map((line, i) => <li key={i}>{line}</li>)
        )}
      </ol>

      <dialog
        id={dialogId}
        closedby="any"
        onCancel={(e) => {
          if (draft && !warned.current) {
            e.preventDefault();
            warned.current = true;
            setWarning(true);
            record("cancel → preventDefault()，擋下來了");
          } else {
            record("cancel → 放行");
          }
        }}
        onClose={() => record("close → 已關閉")}
        className="m-auto w-80 rounded-lg border border-border bg-background p-6 text-foreground shadow-lg backdrop:bg-black/50"
      >
        <p className="mb-3 font-medium">留言</p>
        <textarea
          aria-label="留言內容"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            warned.current = false;
            setWarning(false);
          }}
          rows={3}
          className="mb-3 w-full rounded-md border border-border bg-transparent px-3 py-2"
        />
        <p className="mb-3 min-h-5 text-xs text-amber-600 dark:text-amber-400">
          {warning ? "還沒送出，再關一次就會放棄草稿。" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            {...{ commandfor: dialogId, command: "request-close" }}
            className={buttonClass}
          >
            取消（request-close）
          </button>
          <button
            type="button"
            {...{ commandfor: dialogId, command: "close" }}
            onClick={() => setDraft("")}
            className={buttonClass}
          >
            放棄（close）
          </button>
        </div>
      </dialog>
    </Demo>
  );
}

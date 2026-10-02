"use client";

import { useEffect, useRef, useState } from "react";
import { Demo } from "./Demo";

type Kind = "native" | "div";

/**
 * A native `<dialog>` next to a `div role="dialog"`, each reporting from
 * inside itself where keyboard focus is and what Esc did.
 *
 * The readout lives in the dialog because that is where the reader is looking
 * while they press Tab. In the native dialog focus cycles between its own two
 * buttons and Esc closes it, because the rest of the page is inert. The div
 * version gets focus moved into it on open, as GitHub's menus do, and nothing
 * else: Tab walks out to the input behind the overlay, and Esc does nothing.
 *
 * The div dialog is rendered before that input on purpose, so the first Tab
 * out of it lands somewhere the reader can see.
 */
export function DialogDemo() {
  const native = useRef<HTMLDialogElement>(null);
  const fakeFirst = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<Kind | null>(null);
  const [focus, setFocus] = useState("");
  const [esc, setEsc] = useState("還沒按");
  const [result, setResult] = useState("");

  useEffect(() => {
    if (!open) return;
    const report = (el: Element | null) => {
      if (!(el instanceof HTMLElement)) return;
      const name =
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        el.textContent?.trim() ||
        el.tagName.toLowerCase();
      setFocus(
        el.closest("dialog[open], [role=dialog]")
          ? `對話框裡的「${name}」`
          : `跑到背景的「${name}」了`,
      );
    };
    const onKey = (e: KeyboardEvent) => {
      // Recorded, not handled: the div dialog stays open, which is the point.
      if (e.key === "Escape" && open === "div") setEsc("沒反應，要自己寫");
    };
    const onFocus = (e: FocusEvent) => report(e.target as Element);
    // `showModal()` has already moved focus by the time this runs.
    report(document.activeElement);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const start = (kind: Kind) => {
    setOpen(kind);
    setFocus("");
    setEsc("還沒按");
    setResult("");
    if (kind === "native") native.current?.showModal();
  };

  useEffect(() => {
    if (open === "div") fakeFirst.current?.focus();
  }, [open]);

  const body = (kind: Kind) => (
    <>
      <p className="mb-3 font-medium">
        {kind === "native" ? "原生 <dialog>" : '<div role="dialog">'}
      </p>
      <p className="mb-3 text-muted-foreground">連按幾次 Tab，再按 Esc。</p>
      <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">焦點</dt>
        <dd>{focus || "–"}</dd>
        <dt className="text-muted-foreground">Esc</dt>
        <dd>{esc}</dd>
      </dl>
    </>
  );

  const close = (kind: Kind) => {
    if (kind === "native") native.current?.close();
    else setOpen(null);
  };

  const actions = (kind: Kind) => (
    <div className="flex gap-2">
      <button
        ref={kind === "div" ? fakeFirst : undefined}
        type="button"
        className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
      >
        套用
      </button>
      <button
        type="button"
        onClick={() => close(kind)}
        className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
      >
        關閉
      </button>
    </div>
  );

  return (
    <Demo className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => start("native")}
          className="rounded-md border border-border px-4 py-2 hover:bg-muted"
        >
          打開原生 dialog
        </button>
        <button
          type="button"
          onClick={() => start("div")}
          className="rounded-md border border-border px-4 py-2 hover:bg-muted"
        >
          打開 div dialog
        </button>
      </div>

      {open === "div" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          {/* The point of this half of the demo: a div with the role and none of
              what `<dialog>` brings with it. */}
          <div
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="dialog"
            aria-label="div dialog"
            className="w-80 rounded-lg border border-border bg-background p-6 text-foreground"
          >
            {body("div")}
            {actions("div")}
          </div>
        </div>
      )}

      <input
        aria-label="背景頁面的輸入框"
        placeholder="背景頁面的輸入框"
        className="w-64 rounded-md border border-border bg-transparent px-3 py-2"
      />
      {result && <p className="text-muted-foreground">{result}</p>}

      <dialog
        ref={native}
        onClose={() => {
          setOpen(null);
          setResult("原生 dialog 已關閉，按 Esc 也會關。");
        }}
        className="m-auto w-80 rounded-lg border border-border bg-background p-6 text-foreground backdrop:bg-black/50"
      >
        {body("native")}
        {actions("native")}
      </dialog>
    </Demo>
  );
}

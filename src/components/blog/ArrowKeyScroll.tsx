"use client";

import { useEffect } from "react";

/**
 * How far one press of ↑ or ↓ moves the page — claude.dev's article value.
 *
 * The browser's own arrow step is about 40px, a line or two of text, so reading
 * by keyboard means holding the key down. 340px is roughly a third of a screen:
 * one press moves on by a few paragraphs, and enough of what was on screen
 * stays in view to keep the reader's place.
 */
const STEP = 340;

/** Elements whose arrow keys belong to them, not to the page. */
function ownsArrowKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * ↑ / ↓ scroll a post by a larger, smooth step, as on claude.dev's blog.
 *
 * Only the bare keys: with a modifier they keep their usual meaning, and a key
 * something on the page has already handled — a demo's own listbox, a slider —
 * arrives with `defaultPrevented` and is left alone. Page-level rather than part
 * of the contents tree because it works at every width; the tree only advertises
 * it where there is room to.
 *
 * Renders nothing.
 */
export function ArrowKeyScroll() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      if (ownsArrowKeys(event.target)) return;

      event.preventDefault();
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      window.scrollBy({
        top: event.key === "ArrowDown" ? STEP : -STEP,
        behavior: reduced ? "auto" : "smooth",
      });
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}

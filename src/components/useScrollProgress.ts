"use client";

import { useCallback, useEffect, useState } from "react";
import type { TocSection } from "./TocRail";

/**
 * How far below the top of the viewport the reader is taken to be reading.
 *
 * Matches the `scroll-margin-top` a heading is given, so a section counts as
 * begun exactly when clicking its entry would have brought it to rest — the
 * rail agrees with the navigation instead of lagging it by a screen.
 */
const READING_LINE = 96;

/**
 * The sections of whatever is on screen, and where in them the reader is.
 *
 * Both halves are in scrolled document pixels, which is what makes the rail a
 * progress bar rather than a list: the bar's shape is the document's shape, and
 * the filled part is the distance covered. The published page and the editor
 * share it because they share the thing being measured — a long column of prose
 * that the reader moves down by scrolling. What differs is only how each finds
 * its headings, which is what `measure` is for.
 *
 * `measure` is called on mount, whenever the page's layout settles, and
 * whenever the caller says the content changed. It has to be stable — a
 * `useCallback`, or a module-level function — or the measuring never stops.
 */
export function useScrollProgress(measure: () => TocSection[]) {
  const [sections, setSections] = useState<TocSection[]>([]);
  const [position, setPosition] = useState(0);

  const remeasure = useCallback(() => setSections(measure()), [measure]);

  useEffect(() => {
    // The rendered document *is* the external system this effect synchronises
    // with — the sections do not exist during render, on the server or on the
    // client's first pass, so there is nothing to derive them from. This is the
    // case the rule's own guidance carves out; it just cannot see it from here.
    // eslint-disable-next-line react/set-state-in-effect
    remeasure();

    // Everything that moves a heading down the page has to re-measure, and most
    // of it never fires a resize: an image finishing its load, a web font
    // swapping in, a code block hydrating taller than it rendered. Watching the
    // body catches all of them, and the rail's numbers stay the page's.
    const resized = new ResizeObserver(remeasure);
    resized.observe(document.body);

    // One state change per frame at most: the scroll listener fires faster than
    // React can paint, and a render per event would make the page stutter to
    // animate a 2px bar.
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        setPosition(window.scrollY + READING_LINE);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      resized.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [remeasure]);

  return { sections, position, remeasure };
}

/** Where an element sits in the document, rather than in the viewport. */
export function documentTop(element: Element): number {
  return element.getBoundingClientRect().top + window.scrollY;
}

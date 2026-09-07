"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * The window the rail needs to exist at all — Tailwind's `xl`, where the gutter
 * it hangs in appears. Below it the rail is absent rather than restyled, so
 * there is nothing for any of this to drive: no listener, no measuring, and no
 * state change per scrolled frame. It was all being paid for on phones to
 * position a `display: none` nav.
 */
const GUTTER = "(min-width: 80rem)";

/** Nothing measured, as one object, so an idle narrow window renders once. */
const NOTHING: TocSection[] = [];

/** Whether the window is wide enough for the rail, kept live across resizes. */
function useGutter(): boolean {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(GUTTER);
    // eslint-disable-next-line react/set-state-in-effect
    setWide(query.matches);
    // A reader dragging a window past the breakpoint is the case a mount-time
    // check gets wrong, and it stays wrong until they reload.
    const sync = () => setWide(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return wide;
}

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
  const measured = useRef<TocSection[]>(sections);
  const wide = useGutter();

  const measureNow = useCallback(() => {
    const next = measure();
    // Most re-measurements find the document exactly where they left it: an
    // image lands above the fold, a font swaps in, the address bar collapses,
    // and not one heading moves. Handing React a fresh array each time would
    // redraw the whole rail to arrive at the bar already on screen.
    if (same(measured.current, next)) return;
    measured.current = next;
    setSections(next);
  }, [measure]);

  // Measuring reads the geometry of every heading, which forces the browser to
  // lay the page out there and then. The editor asks on every keystroke, so
  // asked-for measurements wait for a frame and the ones that pile up inside it
  // collapse into that one — the rail cannot show more than a frame's worth
  // anyway. With no gutter they are not taken at all: asking walks the whole
  // document to answer a question nothing on screen is putting. The mount
  // measurement below does not go through here — it has no frame to spare,
  // since the rail is drawn from the first render.
  const pending = useRef(0);
  const remeasure = useCallback(() => {
    if (!wide || pending.current) return;
    pending.current = requestAnimationFrame(() => {
      pending.current = 0;
      measureNow();
    });
  }, [wide, measureNow]);

  useEffect(() => {
    if (!wide) return;

    // The rendered document *is* the external system this effect synchronises
    // with — the sections do not exist during render, on the server or on the
    // client's first pass, so there is nothing to derive them from. This is the
    // case the rule's own guidance carves out; it just cannot see it from here.
    // eslint-disable-next-line react/set-state-in-effect
    measureNow();

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
      // Cleared, not just cancelled: an occupied slot with no frame behind it
      // would turn every later re-measurement into a no-op, and the rail would
      // come back from a resize unable to follow the page again.
      cancelAnimationFrame(pending.current);
      pending.current = 0;
    };
  }, [wide, measureNow, remeasure]);

  return { sections: wide ? sections : NOTHING, position, remeasure };
}

/** Whether two measurements describe the same document, section for section. */
function same(a: TocSection[], b: TocSection[]): boolean {
  return (
    a.length === b.length &&
    a.every((section, i) => {
      const other = b[i];
      return (
        section.key === other.key &&
        section.text === other.text &&
        section.start === other.start &&
        section.end === other.end
      );
    })
  );
}

/** Where an element sits in the document, rather than in the viewport. */
export function documentTop(element: Element): number {
  return element.getBoundingClientRect().top + window.scrollY;
}

"use client";

import { useEffect } from "react";

const ARRIVAL_CLASS = "heading-arrival";

/**
 * Mark the heading the reader has just arrived at.
 *
 * Removing the class and re-adding it is what makes a *repeat* arrival visible.
 * Clicking the same entry twice, or clicking it again after scrolling away,
 * leaves the fragment unchanged, and a CSS animation does not restart while its
 * selector already matches — so without this the second click marks nothing,
 * which is exactly the case a reader hits when they lose their place.
 *
 * Reading `offsetWidth` between the two is not superstition: it forces the
 * pending style change to be flushed, so the browser sees the class genuinely
 * leave and return rather than coalescing both into no change at all.
 *
 * Exported because the contents rail needs it too: clicking the entry for the
 * section already in the URL fires no `hashchange`, so the click is the only
 * signal that a reader asked to be shown where they are a second time.
 */
export function markArrival(id: string) {
  const heading = document.getElementById(id);
  if (!heading) return;
  heading.classList.remove(ARRIVAL_CLASS);
  void heading.offsetWidth;
  heading.classList.add(ARRIVAL_CLASS);
}

/**
 * The heading the current URL points at.
 *
 * Ids here are the heading text, so on a Chinese post the fragment arrives
 * percent-encoded and has to be decoded to match. A hand-mangled escape throws
 * rather than returning nothing, so the raw form is the fallback — it will
 * simply fail to match an element, which is the same outcome as an empty hash.
 */
function targetedHeadingId(): string {
  const raw = window.location.hash.slice(1);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * What a URL naming one section of a post does to the page: it marks where the
 * reader landed, and nothing else.
 *
 * Page-level rather than part of the contents rail, because it is not the
 * rail's to decide: the rail is pointer-only and hidden below `lg`, and draws
 * nothing at all for a post without headings, while a link into a section is
 * followed by every reader on every screen. Producing these URLs is the rail's
 * job; what one means on arrival is the page's.
 *
 * Where a reload lands is `SectionLanding`'s, not this component's: it has to
 * happen at parse time to avoid a visible jump, which is earlier than any
 * effect here can run. This is the part that has to wait for React anyway —
 * the mark is an animation, and animating a heading nobody has painted yet
 * would waste the half of it that exists to be seen.
 *
 * Renders nothing.
 */
export function SectionArrival() {
  useEffect(() => {
    // A cold load on a #fragment arrives already scrolled, with no click and no
    // hashchange to hear, so the mark has to be started from the URL as it
    // stands; `hashchange` then covers the back button and every in-page link.
    const mark = () => markArrival(targetedHeadingId());

    mark();
    window.addEventListener("hashchange", mark);
    return () => window.removeEventListener("hashchange", mark);
  }, []);

  return null;
}

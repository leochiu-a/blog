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
 * Put the reader on the section the URL names, if the browser has not.
 *
 * Dropping the remembered offset is only half of the reload fix: with nothing
 * remembered, whether the browser then falls back to the fragment is left to
 * the browser, and the ones that do not open the article at the top instead —
 * the same wrong answer in the other direction.
 *
 * Hence the standing start. This runs after hydration, so the browser has
 * already had its turn: a page still at the very top is one that declined, and
 * nothing but this will move the reader. A page anywhere else is one where the
 * browser landed them, or where they have started reading in the meantime —
 * and a scroll into either is an interruption rather than a fix.
 *
 * `scrollIntoView` rather than a computed offset: it honours the headings' own
 * `scroll-margin-top`, so the landing spot stays defined in the stylesheet
 * instead of being duplicated as a number here.
 */
function showSection(id: string) {
  const heading = document.getElementById(id);
  if (!heading || window.scrollY > 0) return;
  heading.scrollIntoView();
}

/**
 * What a URL naming one section of a post does to the page.
 *
 * Page-level rather than part of the contents rail, because it is not the
 * rail's to decide: the rail is pointer-only and hidden below `lg`, and draws
 * nothing at all for a post without headings, while a link into a section is
 * followed by every reader on every screen. Producing these URLs is the rail's
 * job; what one means on arrival is the page's.
 *
 * Renders nothing.
 */
export function SectionArrival() {
  useEffect(() => {
    const arrive = (id: string) => {
      markArrival(id);
      if (!id) return;
      // A reload never consults the fragment — it restores the offset its
      // history entry remembers and stops there, so a link to one section
      // reopens wherever the reader had last scrolled to. Dropping that
      // remembered offset is what lets the fragment win.
      //
      // Only ever set, never cleared: an entry's URL cannot lose its fragment,
      // and every fresh entry starts out restoring, so there is no case where
      // writing `auto` back would be anything but a no-op.
      history.scrollRestoration = "manual";
    };

    // A cold load has no event to hear, and is also the only arrival the
    // browser may have failed to scroll to — a fragment followed later is one
    // it scrolls to itself.
    const landed = targetedHeadingId();
    arrive(landed);
    showSection(landed);

    // Covers the back button and every in-page link, the rail's own included:
    // each writes a fresh history entry, which starts out restoring like any
    // other, so the handover has to be redone per entry.
    const onHashChange = () => arrive(targetedHeadingId());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}

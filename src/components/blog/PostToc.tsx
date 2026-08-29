"use client";

import { useEffect, useState } from "react";
import { TocRail } from "@/components/TocRail";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Headings as rendered, read from the DOM rather than from the source.
 *
 * `content-collections` parses frontmatter only, so the body never reaches JS —
 * and even if it did, a heading emitted by an MDX component wouldn't be in it.
 * The rendered article is the one place the real list exists.
 *
 * Scoped to `.prose`: `RecentPosts` and `AuthorBio` also carry headings, and
 * those belong to the page, not to the piece being read.
 */
function readHeadings(): Heading[] {
  const nodes = document.querySelectorAll<HTMLHeadingElement>(".prose h2, .prose h3");
  return [...nodes]
    .filter((node) => node.id)
    .map((node) => ({
      id: node.id,
      text: node.textContent?.trim() ?? "",
      level: node.tagName === "H2" ? 2 : 3,
    }));
}

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
 */
function markArrival(id: string) {
  const heading = document.getElementById(id);
  if (!heading) return;
  heading.classList.remove(ARRIVAL_CLASS);
  void heading.offsetWidth;
  heading.classList.add(ARRIVAL_CLASS);
}

/**
 * Let the fragment, not the last scroll position, decide where a reload lands.
 *
 * A reload does not go looking for the fragment at all: it restores the scroll
 * offset its history entry remembers, and stops there. So a reader who reloads
 * a link to one section is put back wherever they happened to have scrolled to
 * — on a URL that names the section they wanted. Turning restoration off for
 * that history entry is what lets the fragment win.
 *
 * Only while there is a fragment. On a plain post URL the remembered offset is
 * the best answer there is — a reader reloading mid-article should keep their
 * place — so restoration stays as the browser left it.
 */
function preferFragmentOverRememberedScroll(hasFragment: boolean) {
  history.scrollRestoration = hasFragment ? "manual" : "auto";
}

/**
 * Put the reader on the section the URL names.
 *
 * Turning restoration off is only half of it: a reload with nothing remembered
 * leaves it to the browser whether to fall back to the fragment, and the ones
 * that do not open the article at the top instead — the same wrong answer in a
 * different direction. Doing the scroll here is what makes the outcome the same
 * everywhere, and it costs nothing where the browser got there first, since it
 * scrolls to a position the page is already at.
 *
 * `scrollIntoView` rather than a computed offset: it honours the headings' own
 * `scroll-margin-top`, so the landing spot stays defined in one place — the
 * stylesheet — instead of being duplicated as a number here.
 */
function showSection(id: string) {
  document.getElementById(id)?.scrollIntoView();
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

export function PostToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const found = readHeadings();
    // The rendered article *is* the external system this effect synchronises
    // with — the headings do not exist during render, on the server or on the
    // client's first pass, so there is nothing to derive them from. This is the
    // case the rule's own guidance carves out; it just cannot see it from here.
    // eslint-disable-next-line react/set-state-in-effect
    setHeadings(found);
    if (found.length === 0) return;

    // A band across the top of the viewport: a heading counts as current once it
    // reaches it and stops counting once the next one arrives. Nothing in the
    // band (a long section mid-scroll) leaves the last one standing, which is
    // the honest answer — the reader is still inside it.
    const observer = new IntersectionObserver(
      (entries) => {
        const arrived = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (arrived) setActiveId(arrived.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );

    for (const { id } of found) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Landing on a section: the URL either named one on arrival or has since
    // come to name one, and both are the same landing rather than a special
    // case and a follow-up. A cold load has no event to hear, and every later
    // fragment — the rail's own links, the back button — writes a fresh history
    // entry that starts out restoring like any other, so each needs all three
    // steps. An empty hash matches no element, which leaves the mark and the
    // scroll as the no-ops a whole-post URL wants them to be.
    const land = () => {
      const id = targetedHeadingId();
      markArrival(id);
      showSection(id);
      preferFragmentOverRememberedScroll(Boolean(id));
    };

    land();
    window.addEventListener("hashchange", land);
    return () => window.removeEventListener("hashchange", land);
  }, []);

  return (
    <TocRail
      label="目錄"
      items={headings.map((h) => ({ key: h.id, text: h.text, level: h.level }))}
      activeKey={activeId}
      renderEntry={(item, props) => (
        <a
          href={`#${item.key}`}
          // A real fragment link, not a scroll handler: it survives no-JS, it
          // is copyable from the context menu, and it puts the section in the
          // URL so a reader can hand someone else the exact passage.
          //
          // The link still navigates; `onClick` only re-fires the mark.
          // Clicking the entry for the section already in the URL fires no
          // hashchange at all, so the click is the only signal that a reader
          // asked to be shown where they are a second time.
          onClick={() => markArrival(item.key)}
          {...props}
        >
          {item.text}
        </a>
      )}
    />
  );
}

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
    // A cold load on a #fragment arrives already scrolled, with no click and no
    // hashchange to hear — the mark has to be started from the URL as it stands.
    const arrived = targetedHeadingId();
    if (arrived) markArrival(arrived);

    // Covers the back button and any in-page link that is not the rail's own.
    const onHashChange = () => markArrival(targetedHeadingId());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
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

"use client";

import { useEffect, useState } from "react";
import { TocRail } from "@/components/TocRail";
import { markArrival } from "./SectionArrival";

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

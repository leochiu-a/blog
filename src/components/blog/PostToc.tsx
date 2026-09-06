"use client";

import type { MouseEvent } from "react";
import { TocRail, type TocSection } from "@/components/TocRail";
import { documentTop, useScrollProgress } from "@/components/useScrollProgress";
import { markArrival } from "./SectionArrival";

/**
 * The article's sections, measured off the page as rendered.
 *
 * `content-collections` parses frontmatter only, so the body never reaches JS —
 * and even if it did, a heading emitted by an MDX component wouldn't be in it,
 * and neither would its position on the page. The rendered article is the one
 * place both the list and the geometry exist.
 *
 * Scoped to `.prose`: `RecentPosts` and `AuthorBio` also carry headings, and
 * those belong to the page, not to the piece being read. The article's own
 * bottom ends the last section for the same reason — a bar that ran to the
 * foot of the document would count the subscribe box as reading left to do.
 */
function measureSections(): TocSection[] {
  const article = document.querySelector(".prose");
  if (!article) return [];

  const headings = [...article.querySelectorAll<HTMLHeadingElement>("h2")].filter(
    (node) => node.id,
  );
  const articleEnd = article.getBoundingClientRect().bottom + window.scrollY;

  return headings.map((node, i) => ({
    key: node.id,
    text: node.textContent?.trim() ?? "",
    start: documentTop(node),
    end: i + 1 < headings.length ? documentTop(headings[i + 1]) : articleEnd,
  }));
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function PostToc() {
  const { sections, position } = useScrollProgress(measureSections);

  return (
    <TocRail
      label="目錄"
      sections={sections}
      position={position}
      renderEntry={(section, props) => (
        <a
          href={`#${section.key}`}
          // A real fragment link, not a bare handler: it survives no-JS, it is
          // copyable from the context menu, and it puts the section in the URL
          // so a reader can hand someone else the exact passage. The click
          // takes over only to glide there instead of jumping — and only for a
          // plain click, so open-in-new-tab and the rest still behave as links.
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            markArrival(section.key);
            const heading = document.getElementById(section.key);
            if (!heading || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
              return;
            event.preventDefault();
            // The URL still changes, so the address bar names the section a
            // reader has been taken to and Back returns them to where they were.
            history.pushState(null, "", `#${encodeURIComponent(section.key)}`);
            heading.scrollIntoView?.({
              behavior: prefersReducedMotion() ? "auto" : "smooth",
              block: "start",
            });
          }}
          {...props}
        >
          {section.text}
        </a>
      )}
    />
  );
}

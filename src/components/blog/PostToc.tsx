"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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

/**
 * Tick widths for a set of sections, as percentages of the rail.
 *
 * Uniform ticks say only how many sections there are — Substack's rail is ten
 * identical 12px lines. Letting length track the title turns the collapsed rail
 * into a shape the reader recognises, so returning to it after scrolling means
 * finding a silhouette rather than counting.
 *
 * Scaled within the post rather than against fixed character counts: an article
 * whose sections are all long English paper titles would otherwise peg every
 * tick at the maximum and lose the very variation this exists for. Spreading
 * the post's own shortest-to-longest across the rail keeps the contrast
 * whatever the writing looks like.
 */
function tickWidths(texts: string[]): string[] {
  // A CJK character occupies about twice the width of a Latin one, so counting
  // codepoints alone would make a 10-character Chinese heading tie with a
  // 10-character English one that reads half as long.
  const weigh = (t: string) => [...t].reduce((sum, ch) => sum + (/[　-鿿＀-￯]/.test(ch) ? 2 : 1), 0);

  const spans = texts.map(weigh);
  const min = Math.min(...spans);
  const max = Math.max(...spans);
  // Every section the same length: no silhouette to draw, so draw them even.
  if (max === min) return texts.map(() => "70%");
  return spans.map((span) => `${40 + ((span - min) / (max - min)) * 60}%`);
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

  if (headings.length === 0) return null;

  const sections = headings.filter((h) => h.level === 2);
  const widths = tickWidths(sections.map((s) => s.text));
  // Which top-level section the reader is in — an h3 counts towards the h2 above
  // it, so the rail stays lit while they work down a section's subheadings.
  const activeIndex = headings.findIndex((h) => h.id === activeId);
  const activeSectionId =
    activeIndex === -1
      ? null
      : (headings.slice(0, activeIndex + 1).findLast((h) => h.level === 2)?.id ?? null);

  return (
    // Pointer-only by nature, so it is absent below `lg` rather than restyled:
    // the rail hangs in the gutter beside the column, which a narrow screen does
    // not have, and its panel opens on hover, which touch does not do. Same call
    // as `PostPreviewPanel`, which is hidden below `md` for the same reason.
    // `group` so hovering anywhere in the strip — ticks or panel — keeps the
    // panel open, which is what lets the pointer travel between them.
    <nav
      aria-label="目錄"
      className="group fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      {/* Ticks: one per h2, never per h3. Nineteen subheadings would make a
            rail of indistinguishable lines, and half of them repeat ("核心問題"
            appears once per paper) — the section is the useful grain here. */}
      <ul className="flex w-7 flex-col gap-y-2 py-2">
        {sections.map((section, i) => (
          // Flush right, ragged left — the same way round as Substack's. The
          // even edge is the one facing the column, so what the reader sees
          // beside the text they are reading is a quiet vertical rule, and the
          // length variation runs off towards the screen edge instead of
          // pointing a row of uneven lines at the article. It also fixes the
          // gap to the panel, which opens on that side: flush right makes it
          // the same 12px for every tick rather than a different one each row.
          <li key={section.id} className="flex h-0.5 items-center justify-end">
            <span
              style={{ width: widths[i] }}
              // 2px and unfaded. A hairline at 40% opacity is Substack's tick
              // on Substack's white page; these posts render on near-black,
              // where the same line all but disappears — and the rail is only
              // worth having if it can be found without being looked for.
              className={cn(
                "block h-0.5 rounded-full transition-[background-color,width] duration-200 motion-reduce:transition-none",
                section.id === activeSectionId ? "bg-blog-accent" : "bg-muted-foreground",
              )}
            />
          </li>
        ))}
      </ul>

      {/* Beside the ticks rather than over them, so the lit tick stays in
            view while the panel is open: the reader keeps the answer to "where
            am I" on screen while reading "what else is there". The cost is that
            the panel reaches over the column — acceptable for something that
            appears on hover and leaves the moment the pointer does.

            The gap to the ticks is this wrapper's padding, not a margin, so the
            hover target runs unbroken from the rail into the panel. As a margin
            it would be dead space belonging to neither, and crossing it would
            start the panel fading out halfway to it. */}
      <div
        className={cn(
          "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 pl-3",
          // 150ms, not 200. Fading in over body text means the article shows
          // through the panel for the whole fade — a heading behind it reads
          // as a flash of bold text inside the contents. The panel is opaque
          // at rest (below) so the ghost is only ever mid-transition; keeping
          // that window short is the rest of the fix.
          "opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none",
          "group-hover:pointer-events-auto group-hover:opacity-100",
          "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
        )}
      >
        <div
          className={cn(
            "max-h-[70vh] w-72 overflow-y-auto",
            // Scrolls, but without drawing the bar: a gutter of scrollbar is a
            // sizeable share of a 288px panel, and it appears only on the posts
            // long enough to overflow, so the panel would change width from one
            // article to the next. Wheel, trackpad and keyboard all still
            // scroll it.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Fully opaque, no backdrop blur: both were free when the panel
            // sat over an empty gutter, and both leak the article through it
            // now that it sits over the column.
            "rounded-lg bg-popover p-4 shadow-xl ring-1 ring-foreground/10",
          )}
        >
          <TocList headings={headings} activeId={activeId} />
        </div>
      </div>
    </nav>
  );
}

function TocList({ headings, activeId }: { headings: Heading[]; activeId: string | null }) {
  // 15px, not the 13px of a caption. The panel is a thing to read a line of and
  // pick from, and at 13px a two-line CJK title in it is a squint — which is
  // what the space beside the rail was freed up to pay for.
  return (
    <ul className="flex flex-col gap-y-2 font-sans text-[15px] leading-snug">
      {headings.map((heading) => (
        <li key={heading.id} className={heading.level === 3 ? "ps-3" : undefined}>
          <a
            href={`#${heading.id}`}
            // The link still navigates; this only re-fires the mark. Clicking
            // the entry for the section already in the URL fires no hashchange
            // at all, so the click is the only signal that a reader asked to be
            // shown where they are a second time.
            onClick={() => markArrival(heading.id)}
            // A real fragment link, not a scroll handler: it survives no-JS, it
            // is copyable from the context menu, and it puts the section in the
            // URL so a reader can hand someone else the exact passage.
            className={cn(
              "block line-clamp-2 transition-colors hover:text-blog-accent",
              heading.id === activeId
                ? "font-semibold text-blog-accent"
                : heading.level === 2
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

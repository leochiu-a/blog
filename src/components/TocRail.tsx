"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One line of a contents rail. `key` is whatever the owner navigates by — a
 * heading id on the published page, a document position in the editor — and the
 * rail only ever compares it, never interprets it.
 */
export interface TocItem {
  key: string;
  text: string;
  level: 2 | 3;
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

/**
 * The contents rail: a strip of ticks in the left gutter that opens into a
 * panel on hover.
 *
 * Presentation only. It is given the list, told which item is current, and
 * handed a way to render each entry — because the two places this appears
 * navigate by different means. The published page uses real fragment links, so
 * a reader can copy one; the editor moves the caret, where a URL would mean
 * nothing. Everything that makes the rail *look* like the rail lives here, so
 * the two cannot drift apart.
 */
export function TocRail({
  label,
  items,
  activeKey,
  renderEntry,
}: {
  label: string;
  items: TocItem[];
  /** The item to light, or `null` before the reader has reached one. */
  activeKey: string | null;
  renderEntry: (item: TocItem, props: { className: string }) => ReactNode;
}) {
  if (items.length === 0) return null;

  const sections = items.filter((item) => item.level === 2);
  const widths = tickWidths(sections.map((s) => s.text));
  // Which top-level section is current — an h3 counts towards the h2 above it,
  // so the rail stays lit while the reader works down a section's subheadings.
  const activeIndex = items.findIndex((item) => item.key === activeKey);
  const activeSectionKey =
    activeIndex === -1
      ? null
      : (items.slice(0, activeIndex + 1).findLast((item) => item.level === 2)?.key ?? null);

  return (
    // Pointer-only by nature, so it is absent below `lg` rather than restyled:
    // the rail hangs in the gutter beside the column, which a narrow screen does
    // not have, and its panel opens on hover, which touch does not do. Same call
    // as `PostPreviewPanel`, which is hidden below `md` for the same reason.
    // `group` so hovering anywhere in the strip — ticks or panel — keeps the
    // panel open, which is what lets the pointer travel between them.
    <nav
      aria-label={label}
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
          <li key={section.key} className="flex h-0.5 items-center justify-end">
            <span
              style={{ width: widths[i] }}
              // 2px and unfaded. A hairline at 40% opacity is Substack's tick
              // on Substack's white page; these posts render on near-black,
              // where the same line all but disappears — and the rail is only
              // worth having if it can be found without being looked for.
              className={cn(
                "block h-0.5 rounded-full transition-[background-color,width] duration-200 motion-reduce:transition-none",
                section.key === activeSectionKey ? "bg-blog-accent" : "bg-muted-foreground",
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
          {/* 15px, not the 13px of a caption. The panel is a thing to read a
              line of and pick from, and at 13px a two-line CJK title in it is a
              squint — which is what the space beside the rail was freed up to
              pay for. */}
          <ul className="flex flex-col gap-y-2 font-sans text-[15px] leading-snug">
            {items.map((item) => (
              <li key={item.key} className={item.level === 3 ? "ps-3" : undefined}>
                {renderEntry(item, {
                  className: cn(
                    "block w-full text-start line-clamp-2 transition-colors hover:text-blog-accent",
                    item.key === activeKey
                      ? "font-semibold text-blog-accent"
                      : item.level === 2
                        ? "text-foreground"
                        : "text-muted-foreground",
                  ),
                })}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

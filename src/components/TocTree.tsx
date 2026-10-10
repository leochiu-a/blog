"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One heading of a document, as the tree draws it.
 *
 * `key` is whatever the owner navigates by — a heading id on the published
 * page, a document position in the editor — and the tree only ever compares it,
 * never interprets it. `start` and `end` are scrolled pixels, and `position` is
 * in the same scale. `end` is where the next heading of any level begins, or the
 * article's end for the last one.
 */
export interface TocSection {
  key: string;
  text: string;
  level: 2 | 3;
  start: number;
  end: number;
}

/** Cells in the progress bar; the most that still fits beside the percentage in the narrowest (220px) tree. */
const BAR_CELLS = 20;

/** One section and the subheadings that follow it, up to the next section. */
interface Branch {
  section: TocSection;
  subs: TocSection[];
}

function branches(entries: TocSection[]): Branch[] {
  const out: Branch[] = [];
  for (const entry of entries) {
    if (entry.level === 3 && out.length > 0) out[out.length - 1].subs.push(entry);
    else out.push({ section: entry, subs: [] });
  }
  return out;
}

/**
 * The contents as a tree in the left gutter, after the one on Claude's blog.
 *
 * Sections are the trunk and stay put; a section's subheadings unfold beneath
 * it only while it is the one being read, so the list is short at rest and
 * still reaches the subheading you are under. A `└` glyph marks every row, and
 * a text progress bar sits under the tree.
 *
 * Presentation only. It is given the headings, told where in them the reader
 * is, and handed a way to render each entry — because the two places this
 * appears navigate by different means. The published page uses real fragment
 * links, so a reader can copy one; the editor moves the caret, where a URL would
 * mean nothing. Everything that makes the tree *look* like the tree lives here,
 * so the two cannot drift apart.
 *
 * Absent below `xl` rather than restyled: it hangs in the gutter beside the
 * 728px column, which a narrower window does not have.
 */
export function TocTree({
  label,
  sections,
  position,
  renderEntry,
}: {
  label: string;
  sections: TocSection[];
  /** Where the reader is, in the sections' own scale. */
  position: number;
  renderEntry: (
    section: TocSection,
    props: {
      className: string;
      style?: CSSProperties;
      title: string;
      "aria-current"?: "location";
      children: ReactNode;
    },
  ) => ReactNode;
}) {
  if (sections.length === 0) return null;

  const articleStart = sections[0].start;
  const articleEnd = sections[sections.length - 1].end;
  const span = articleEnd - articleStart;
  const progress = span > 0 ? Math.min(1, Math.max(0, (position - articleStart) / span)) : 0;
  const filled = Math.round(progress * BAR_CELLS);

  // The last heading begun, whatever its level; none before the first.
  const currentKey = sections.findLast((entry) => position >= entry.start)?.key;
  // Past the end is past the writing: the subscribe box and bio are not part of
  // the contents, so the tree leaves rather than hanging beside them at 100%.
  const finished = position >= articleEnd;

  const entry = (section: TocSection, className?: string) => {
    const active = section.key === currentKey;
    return renderEntry(section, {
      title: section.text,
      "aria-current": active ? "location" : undefined,
      className: cn(
        "block w-fit max-w-full truncate py-1 text-left font-sans transition-colors duration-150 hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      ),
      children: (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "mr-2.5 font-mono",
              active ? "text-muted-foreground" : "text-muted-foreground/50",
            )}
          >
            └
          </span>
          {section.text}
        </>
      ),
    });
  };

  return (
    // Fixed to the window's left edge, in line with the page's own 40px side
    // padding, the way Claude's tree sits in the margin rather than against the
    // column. Capped so it never reaches the 728px column: at `xl` (1280px) the
    // gutter is 276px, which leaves the tree 220px; it grows with the window up to 22rem (352px).
    <nav
      aria-label={label}
      className={cn(
        "fixed top-28 left-10 z-40 hidden max-h-[calc(100vh-10rem)] w-[min(22rem,calc(50vw-22.75rem-3.5rem))] overflow-y-auto overflow-x-clip [scrollbar-width:none] [&::-webkit-scrollbar]:hidden font-mono text-sm leading-relaxed xl:block",
        "transition-opacity duration-300 ease-out motion-reduce:transition-none",
        finished && "pointer-events-none opacity-0",
      )}
    >
      <p className="mb-3 text-xs tracking-wide text-muted-foreground">{label}</p>

      <div>
        {branches(sections).map(({ section, subs }) => {
          // Open while the reader is in this section or any subheading of it,
          // and for keyboard focus, so a tab stop is never inside a hidden row.
          const open = section.key === currentKey || subs.some((sub) => sub.key === currentKey);
          return (
            <div key={section.key}>
              {entry(section)}
              {subs.length > 0 && (
                <div
                  className={cn(
                    "invisible grid grid-rows-[0fr] has-[:focus-visible]:visible has-[:focus-visible]:grid-rows-[1fr]",
                    "motion-safe:transition-[grid-template-rows,visibility] motion-safe:duration-300 motion-safe:ease-out",
                    open && "visible grid-rows-[1fr]",
                  )}
                >
                  <div className="-m-1 min-h-0 overflow-hidden p-1">
                    {subs.map((sub) => entry(sub, "pl-[18px]"))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 whitespace-nowrap text-muted-foreground/50" aria-hidden="true">
        <span className="text-foreground">{"▓".repeat(filled)}</span>
        {"░".repeat(BAR_CELLS - filled)}
        <span className="ml-2 tabular-nums text-muted-foreground">
          {Math.round(progress * 100)}%
        </span>
      </p>
    </nav>
  );
}

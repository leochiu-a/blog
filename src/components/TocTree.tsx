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
  title,
  titleShown = false,
  hint,
  sections,
  position,
  renderEntry,
}: {
  label: string;
  /**
   * The document's title, shown at the top of the tree once `titleShown` —
   * after the real title has scrolled away, so the page always names what is
   * being read without saying it twice.
   */
  title?: string;
  titleShown?: boolean;
  /** A line under the progress bar, for a shortcut the page offers. */
  hint?: string;
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
    // A strip down the left margin that runs exactly as long as the article,
    // with the tree stuck inside it — claude.dev's arrangement. The owner puts
    // this inside a `relative` box whose top is the rule above the article, so
    // on load the tree starts level with that rule instead of sitting beside
    // the title, rides up with the page, and sticks at `top-36` once it gets
    // there. At the article's end the strip ends, and the tree scrolls away
    // with the last paragraph rather than hanging beside the subscribe box.
    //
    // Pulled out of the 728px column into the window's margin: its left edge
    // is the window's 40px side padding, measured back from the column's own
    // left edge, which sits at `50vw - 22.75rem`. Capped so it never reaches
    // the column: at `xl` (1280px) that leaves the tree 220px, and it grows
    // with the window up to 22rem (352px).
    <nav
      aria-label={label}
      className="absolute inset-y-0 left-[calc(25.25rem-50vw)] z-40 hidden w-[min(22rem,calc(50vw-22.75rem-3.5rem))] font-mono text-sm leading-relaxed xl:block"
    >
      <div className="sticky top-36">
        {title && (
          // Above the tree rather than at the top of it, in the space the
          // tree's `top-36` leaves clear — below the editor's sticky 57px
          // toolbar, for two lines of title. Laid out in that space, the
          // title's arrival moves nothing: it fades and lifts, both compositor
          // work, where pushing the tree down by its own height re-laid the
          // column out every frame and shoved the list the reader was looking
          // at out from under them.
          <p
            aria-hidden={!titleShown}
            className={cn(
              "absolute inset-x-0 bottom-full mb-4 line-clamp-2 text-balance font-sans text-lg font-medium leading-normal text-foreground",
              "translate-y-1 opacity-0 motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out",
              titleShown ? "translate-y-0 opacity-100" : "pointer-events-none",
            )}
          >
            {title}
          </p>
        )}

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-clip [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          {hint && <p className="mt-3 text-xs tracking-wide text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </nav>
  );
}

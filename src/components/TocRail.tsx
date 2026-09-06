"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One section of a document, as the rail draws it.
 *
 * `key` is whatever the owner navigates by — a heading id on the published
 * page, a document position in the editor — and the rail only ever compares it,
 * never interprets it. `start` and `end` are in whatever scale the owner
 * measures in: scrolled pixels for a page, ProseMirror positions for a draft.
 * The rail never asks what the unit is; it only takes ratios of them, so any
 * monotonic scale works as long as `position` is in the same one.
 */
export interface TocSection {
  key: string;
  text: string;
  start: number;
  end: number;
}

/** A segment's place on the rail, as percentages of the whole. */
interface Segment {
  top: number;
  height: number;
}

/**
 * Where each section sits on the rail, proportional to its length.
 *
 * The rail is a scale drawing of the document, not a list of equal ticks: a
 * section that is a quarter of the article takes a quarter of the rail. That is
 * what makes the filled part answer "how much is left" rather than only "which
 * heading am I under" — a reader four sections into nine can still have most of
 * the reading ahead of them, and evenly-spaced ticks would say otherwise.
 */
function layOut(sections: TocSection[]): Segment[] {
  const origin = sections[0].start;
  const span = sections[sections.length - 1].end - origin;
  // A document with no measurable extent — measured before layout settled, or
  // an editor whose sections are still empty. Even segments say "here are the
  // sections" without inventing proportions that would jump on the next frame.
  if (span <= 0)
    return sections.map((_, i) => ({
      top: (i * 100) / sections.length,
      height: 100 / sections.length,
    }));

  return sections.map((section) => ({
    top: ((section.start - origin) / span) * 100,
    height: ((section.end - section.start) / span) * 100,
  }));
}

/** How far into a section the reader has got, 0 to 1. */
function fillOf(section: TocSection, position: number): number {
  if (position <= section.start) return 0;
  if (position >= section.end) return 1;
  return (position - section.start) / (section.end - section.start);
}

/**
 * Whether the rail should be showing itself right now.
 *
 * The rail is a progress bar, and a progress bar is only interesting while
 * something is progressing: it appears when `position` moves and fades out once
 * it settles, leaving the page to the writing. Hover and focus override this in
 * CSS, so a reader who goes looking for the contents always finds them.
 *
 * Comparing against the last position rather than firing on every effect run
 * is what keeps the first render out of it: `position` arrives from a
 * measurement the owner takes on mount, and treating that as scrolling would
 * flash the rail on every page load — the one moment nobody has asked for it.
 */
function useAwake(position: number): boolean {
  const [awake, setAwake] = useState(false);
  const previous = useRef(position);

  useEffect(() => {
    if (previous.current === position) return;
    previous.current = position;
    setAwake(true);
    const timer = setTimeout(() => setAwake(false), 1200);
    return () => clearTimeout(timer);
  }, [position]);

  return awake;
}

/**
 * The contents rail: a progress bar in the right gutter that shows how far
 * through the document the reader is, and names the sections on hover.
 *
 * Presentation only. It is given the sections, told where in them the reader
 * or the caret is, and handed a way to render each entry — because the two
 * places this appears navigate by different means. The published page uses real
 * fragment links, so a reader can copy one; the editor moves the caret, where a
 * URL would mean nothing. Everything that makes the rail *look* like the rail
 * lives here, so the two cannot drift apart.
 *
 * Sections only — h2 and never h3. The rail's whole claim is that its shape is
 * the document's shape, and subheadings blur it twice over: they cut the bar
 * into slivers too small to read as progress, and they fill the label column
 * with rows that repeat between sections.
 */
export function TocRail({
  label,
  sections,
  position,
  renderEntry,
}: {
  label: string;
  sections: TocSection[];
  /** Where the reader or the caret is, in the sections' own scale. */
  position: number;
  renderEntry: (
    section: TocSection,
    props: { className: string; style?: CSSProperties },
  ) => ReactNode;
}) {
  const awake = useAwake(position);
  if (sections.length === 0) return null;

  const segments = layOut(sections);
  // The section being read: the last one started. An unstarted document lights
  // nothing, which is the honest answer before the reader has reached anything.
  const activeIndex = sections.findLastIndex((section) => position >= section.start);
  // Past the last section is past the writing: the subscribe box, the bio and
  // the read-more list are not part of the contents, so the rail leaves rather
  // than hanging beside them at a permanent 100%. It goes before the foot of
  // the page, not with it — the reader has finished, and the thing that told
  // them how much was left has nothing to say from here on.
  const finished = position >= sections[sections.length - 1].end;

  return (
    // Pointer-only by nature, so it is absent below `xl` rather than restyled:
    // the rail hangs in the gutter beside the column, which a narrow screen does
    // not have, and its labels open on hover, which touch does not do. `xl` and
    // not `lg` because the labels need 280px of gutter to be worth reading.
    //
    // `group` so hovering anywhere in the strip — the pad, the bar, a label —
    // holds the whole thing open, which is what lets the pointer travel from
    // the bar it noticed to the label it wants.
    //
    // Transparent to the pointer as a whole; only the hover pad below takes
    // input. Otherwise a 280px column of nothing would sit over the article's
    // right margin and swallow text selection there.
    <nav
      aria-label={label}
      className={cn(
        "group pointer-events-none fixed right-0 top-1/2 z-40 hidden h-[72vh] w-[280px] -translate-y-1/2 xl:block",
        "transition-opacity duration-300 ease-out motion-reduce:transition-none",
        finished && "opacity-0",
      )}
    >
      {/* Held open by hover, or by a *keyboard* focus inside it — never by a
          plain `:focus-within`. Clicking an entry leaves that link focused, so
          `:focus-within` kept the whole rail expanded after the pointer had
          gone, and it stayed that way until the reader clicked somewhere else.
          `:focus-visible` is the same guarantee for anyone tabbing through
          without that: a mouse click does not set it on a link, a Tab does. */}
      {/* The labels open over the article's right edge, and small grey text on
          top of body text is unreadable. The scrim is the page's own background
          fading in under them — masked top and bottom so it has no visible
          edge, only a thickening towards the gutter. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-background/0 to-background",
          "opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none",
          "group-hover:opacity-100 group-has-[:focus-visible]:opacity-100",
        )}
        style={{
          maskImage: "linear-gradient(transparent 0%, black 15%, black 85%, transparent 100%)",
        }}
      />

      {/* The hover target, and the only part of the rail that takes the
          pointer. Far wider than the 2px bar it opens: a hairline at the screen
          edge is a thing you can see but not reliably hit, and a reader
          reaching for it should not have to aim. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 right-0 w-36",
          // Gone with the rail: an invisible strip that still opened the labels
          // would be worse than leaving them, since nothing on screen would
          // explain what the reader had just hovered.
          finished ? "pointer-events-none" : "pointer-events-auto",
        )}
      />

      <div className="absolute inset-0 flex items-stretch pl-4 pr-3">
        {/* Labels, each level with the top of the segment it names, so the
            column reads as the bar annotated rather than as a list beside it. */}
        <div className="relative h-full flex-1">
          {sections.map((section, i) => (
            <div
              key={section.key}
              className="absolute right-0 max-w-full -translate-y-1/2"
              // Level with the top of its segment, not its middle: the label
              // names where the section begins, which is the edge the reader is
              // looking for when they trace one across to the other.
              style={{ top: `${segments[i].top}%` }}
            >
              {renderEntry(section, {
                className: cn(
                  // 14px, not the 12px this is set at in Latin. A CJK glyph
                  // carries far more detail in the same em, and at 12px a
                  // heading in it is a shape you recognise rather than text you
                  // read — which is the whole job of the label.
                  "block max-w-full truncate text-right text-sm leading-tight tracking-tight",
                  "translate-x-1 opacity-0 transition-[opacity,transform,color] duration-200 ease-out motion-reduce:transition-none",
                  "pointer-events-none group-hover:pointer-events-auto group-has-[:focus-visible]:pointer-events-auto",
                  "group-hover:translate-x-0 group-hover:opacity-100",
                  "group-has-[:focus-visible]:translate-x-0 group-has-[:focus-visible]:opacity-100",
                  "hover:!text-blog-accent",
                  i === activeIndex ? "text-foreground" : "text-muted-foreground",
                ),
              })}
            </div>
          ))}
        </div>

        {/* The bar. Its column is wider than the bar itself so the bar can
            thicken on hover without the labels shifting to make room. */}
        <div className="relative h-full w-6 shrink-0">
          <div
            className={cn(
              "absolute inset-y-0 right-0 w-0.5 group-hover:w-1 group-has-[:focus-visible]:w-1",
              "transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none",
              awake ? "opacity-100" : "opacity-0",
              "group-hover:opacity-100 group-has-[:focus-visible]:opacity-100",
            )}
          >
            {segments.map((segment, i) => (
              // Track and fill are separate elements rather than one bar with a
              // gradient: the 3px gaps between sections have to stay visible
              // through the filled part, which is what keeps the bar a contents
              // list and not just a scrollbar.
              <div
                key={sections[i].key}
                className="absolute inset-x-0 rounded-full bg-foreground/20"
                style={{
                  top: `${segment.top}%`,
                  // The 3px gap comes out of the segment, so the gaps stay the
                  // same width whatever the section lengths are. `minHeight`
                  // keeps a one-paragraph section from being subtracted out of
                  // existence.
                  height: `calc(${segment.height}% - 3px)`,
                  minHeight: "2px",
                }}
              >
                {/* Scaled, not resized, and with no transition on it.
                    Height is a layout property, so growing the fill by height
                    made the browser re-flow the bar on every scroll frame; and
                    easing it meant each frame restarted a 150ms glide towards a
                    target that had already moved, so the fill was always
                    chasing the page rather than tracking it. A transform is
                    compositor work and lands in the same frame as the scroll,
                    which is what makes it feel attached to the page. */}
                <div
                  className="absolute inset-x-0 top-0 h-full origin-top rounded-full bg-blog-accent"
                  style={{ transform: `scaleY(${fillOf(sections[i], position)})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

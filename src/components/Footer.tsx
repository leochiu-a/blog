import {
  CodePenMark,
  GitHubMark,
  InstagramMark,
  LinkedInMark,
  MediumMark,
  RssMark,
  ThreadsMark,
} from "@/components/icons";
import { socialLinks } from "@/data/content";

/**
 * The mark for each entry in `socialLinks`, keyed by its label. A label with no
 * mark falls back to its own text rather than rendering an empty hit area —
 * adding a link to `socialLinks` should never make one silently disappear.
 */
const MARKS = {
  GitHub: GitHubMark,
  Threads: ThreadsMark,
  Instagram: InstagramMark,
  Medium: MediumMark,
  LinkedIn: LinkedInMark,
  CodePen: CodePenMark,
} as Record<string, typeof GitHubMark | undefined>;

export function Footer({ variant = "brand" }: { variant?: "brand" | "minimal" }) {
  const borderClass = variant === "minimal" ? "border-border" : "border-bronze/20";
  // Garamond's small x-height makes 14px read like 12px, so the brand variant
  // gets a step up; the minimal variant is sans, where 14px is right for fine print.
  const textClass = variant === "minimal" ? "font-sans text-sm" : "font-garamond text-base";
  const linkClass = "text-muted-foreground transition-colors hover:text-gold";

  return (
    <footer className="mx-auto mt-12 w-full">
      <div className={`border-t pt-6 ${borderClass}`}>
        {/* Links come first in the DOM so the stacked mobile layout puts the
            navigation above the copyright fine print; row-reverse pulls the
            copyright back to the left edge on wider screens. */}
        <div className="flex flex-col items-center gap-y-3 sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-y-0">
          <nav className="flex items-center gap-x-5" aria-label="Elsewhere on the web">
            {socialLinks.map(({ label, href }) => {
              const Mark = MARKS[label];
              return (
                <a
                  key={href}
                  href={href}
                  className={`group relative ${linkClass}`}
                  rel="me noopener"
                  target="_blank"
                  aria-label={label}
                >
                  {/* The marks arrive at three different viewBoxes, so the size
                      is set here rather than trusted to each one's own. */}
                  {Mark ? (
                    <>
                      <Mark className="size-[18px]" />
                      <Label>{label}</Label>
                    </>
                  ) : (
                    <span className={textClass}>{label}</span>
                  )}
                </a>
              );
            })}
            {/* RSS is a different kind of offer from the six above — a way to
                follow rather than a place to find me — so a rule separates it
                instead of one more equal gap. */}
            <span aria-hidden className="h-4 w-px bg-current opacity-20" />
            {/* Plain anchor: /feed.xml is a Route Handler that returns XML, not
                a navigable page, so next/link's client-side transition doesn't apply. */}
            {/* eslint-disable-next-line next/no-html-link-for-pages */}
            <a href="/feed.xml" className={`group relative ${linkClass}`} aria-label="RSS feed">
              <RssMark className="size-[18px]" />
              <Label>RSS</Label>
            </a>
          </nav>
          <p className={`text-muted-foreground ${textClass}`}>© 2026 Leo Chiu</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * The name of what a mark links to, shown on hover and on keyboard focus.
 *
 * CSS rather than a tooltip component: the footer is on every page and is a
 * server component, and a positioned span costs nothing to ship, where Base
 * UI's tooltip would turn the whole footer into a client island for a label
 * seven links deep in the fine print. It is `aria-hidden` because the anchor
 * already carries the same name — a screen reader has never needed the hover.
 */
function Label({ children }: { children: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-popover px-2 py-1 font-sans text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-md ring-1 ring-foreground/10 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

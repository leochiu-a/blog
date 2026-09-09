import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import type { IssueSummary } from "@/types/content";
import { SectionRow } from "@/components/SectionRow";

/**
 * The newsletter's place on the home page: the newest few Issues, then the way
 * to the rest of them.
 *
 * Issues rather than a subscribe field. Someone who has never read one has no
 * reason to hand over an address, and the archive argues for the letter better
 * than the pitch does — the same reasoning that puts the back catalogue under
 * the form on /newsletter/. The field itself is one click away, at the top of
 * that page.
 *
 * Three of them: enough to show this is a running thing rather than a one-off,
 * short enough that it stays a section of the home page instead of becoming a
 * second listing competing with Posts.
 *
 * Never rendered with an empty list — the caller drops this section and its
 * divider together, because a rule with nothing under it is the visible half of
 * the bug.
 */
export function NewsletterSection({ issues }: { issues: IssueSummary[] }) {
  return (
    <SectionRow label="Newsletter">
      <ul className="flex flex-col gap-y-4">
        {issues.map((issue) => (
          <li key={issue.href}>
            <Link href={issue.href} className="group block">
              {/* Titles and dates sit the way a post row does — title left,
                  metadata right, stacking below sm — so the two listings read
                  as one page rather than two designs. */}
              <div className="flex flex-col gap-y-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <h3 className="text-lg font-semibold transition-colors group-hover:text-blog-accent">
                  {/* Same ✦ a featured post gets, in the same place — on the
                      home page the two listings are read as one, so a marker
                      that means "start here" cannot mean two things. */}
                  {issue.featured && <span className="mr-1.5 text-blog-accent">✦</span>}
                  {issue.title}
                  {issue.draft && (
                    <span className="ml-2 inline-block rounded-sm border border-blog-accent/40 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide text-blog-accent">
                      draft
                    </span>
                  )}
                </h3>
                <time dateTime={issue.datetime} className="shrink-0 text-sm text-muted-foreground">
                  {issue.date}
                </time>
              </div>
              {issue.subtitle && (
                <p className="mt-1 leading-snug text-muted-foreground">{issue.subtitle}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {/* Both halves of what is at the other end: /newsletter/ opens with the
          subscribe form and lists every past Issue under it. The reading comes
          first in the label as it does on the page, because that is the order
          it happens in — nobody hands over an address before reading one. */}
      <Link
        href="/newsletter/"
        className="group mt-3 inline-flex items-center gap-1.5 self-start text-muted-foreground transition-colors hover:text-blog-accent"
      >
        查看歷期與訂閱
        {/* The arrow leans the way the link goes when the pointer arrives —
            an icon rather than the literal "→" it replaces, because a glyph
            in the text run cannot be moved without moving the label with it.
            Focus counts as arrival too, so the keyboard sees the same nudge.
            `motion-reduce` leaves the arrow where it is instead of removing
            it, so the affordance survives even when the movement doesn't. */}
        <ArrowRightIcon
          aria-hidden
          className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0"
        />
      </Link>
    </SectionRow>
  );
}

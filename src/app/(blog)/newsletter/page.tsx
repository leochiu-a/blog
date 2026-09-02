import Link from "next/link";
import type { Metadata } from "next";
import { SubscribeForm } from "@/components/newsletter/SubscribeForm";
import { newsletter } from "@/data/content";
import { issues } from "@/lib/issues";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "電子報 • Leo Chiu",
  description: newsletter.pitch[0],
  alternates: { canonical: `${SITE_URL}/newsletter/` },
};

/**
 * The subscribe page, with every past Issue listed under the form.
 *
 * The archive is the point: nobody hands an address to a form with nothing
 * behind it, and past Issues argue for the newsletter better than copy about
 * it ever could.
 */
export default function NewsletterPage() {
  // `dark` lands on <main>, not <html>: this subtree is its own root layout, and
  // `html:has(.dark)` in globals.css pulls the document element into the same
  // tokens. Same mechanism a professional post uses.
  return (
    <>
      {/* Centred hero, after Substack: the pitch is two lines of large type,
            a quieter line under it, and the field. Nothing else competes. */}
      <section className="flex flex-col items-center py-14 text-center sm:py-20">
        {/* Short enough to hold one line at every width the column allows.
              That is the point: Chinese wraps per character, so a headline that
              needs to wrap will break mid-word and strand single glyphs. */}
        <h1 className="font-sans text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl md:text-5xl">
          {newsletter.headline}
        </h1>
        {/* Body copy can wrap, but only between phrases: each span is
              inline-block, so a line can break in the gaps and nowhere else. */}
        <p className="mt-5 max-w-[30rem] font-sans text-lg leading-relaxed text-muted-foreground">
          {newsletter.pitch.map((piece) => (
            <span key={piece} className="inline-block">
              {piece}
            </span>
          ))}
        </p>
        <div className="mt-8 flex w-full justify-center">
          <SubscribeForm source="/newsletter/" />
        </div>
      </section>

      {issues.length > 0 && (
        <section className="border-t border-border pt-8">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            過去幾期
          </h2>
          <ul className="mt-5 flex flex-col gap-y-5">
            {issues.map((issue) => (
              <li key={issue.slug}>
                <Link href={issue.href} className="group block">
                  <h3 className="font-sans text-lg font-semibold leading-snug transition-colors group-hover:text-gold">
                    {issue.title}
                  </h3>
                  {issue.subtitle && (
                    <p className="mt-1 font-sans text-base leading-snug text-muted-foreground">
                      {issue.subtitle}
                    </p>
                  )}
                  <time
                    dateTime={issue.datetime}
                    className="mt-1 block font-sans text-sm text-muted-foreground"
                  >
                    {issue.date}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

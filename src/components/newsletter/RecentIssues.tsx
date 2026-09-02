import Link from "next/link";
import { issues } from "@/lib/issues";

/**
 * "Read more" list at the foot of an Issue — the newest few other Issues.
 *
 * Issues rather than Posts: someone reading one edition is being handed the
 * next thing to read, and for a newsletter that is another edition. It also
 * keeps the archive page from being the only way to reach an older one.
 *
 * No thumbnails, unlike the post version: an Issue is written for an inbox and
 * has no hero image to show.
 */
export function RecentIssues({ slug }: { slug: string }) {
  const recent = issues.filter((issue) => issue.slug !== slug).slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Read more
      </h2>
      <ul className="mt-4 flex flex-col gap-y-5">
        {recent.map((issue) => (
          <li key={issue.slug}>
            <Link href={issue.href} className="group block">
              <h3 className="font-sans text-lg font-bold leading-snug transition-colors group-hover:text-gold">
                {issue.title}
              </h3>
              {issue.subtitle && (
                <p className="mt-1 font-sans text-sm leading-snug text-muted-foreground">
                  {issue.subtitle}
                </p>
              )}
              <p className="mt-1 font-sans text-sm text-muted-foreground">
                <time dateTime={issue.datetime}>{issue.date}</time>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

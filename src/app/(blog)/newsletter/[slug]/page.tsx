import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { issues } from "@/lib/issues";
import { SITE_URL } from "@/lib/site";
import { AuthorBio } from "@/components/blog/AuthorBio";
import { RecentIssues } from "@/components/newsletter/RecentIssues";
import { SubscribeForm } from "@/components/newsletter/SubscribeForm";
import { newsletter } from "@/data/content";

export function generateStaticParams() {
  return issues.map((issue) => ({ slug: issue.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const issue = issues.find((candidate) => candidate.slug === slug);
  if (!issue) return {};

  const title = `${issue.title} • Leo Chiu`;
  const description = issue.description ?? issue.subtitle;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${issue.href}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}${issue.href}`,
    },
  };
}

/** One past Issue on the web — also where the email's "read in a browser" link goes. */
export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issue = issues.find((candidate) => candidate.slug === slug);
  if (!issue) notFound();

  const Issue = issue.mdx;

  return (
    <>
      <article className="wrap-break-word">
        <p className="font-sans text-sm text-muted-foreground">
          <Link href="/newsletter/" className="hover:text-gold">
            電子報
          </Link>
        </p>
        <h1 className="mt-2 font-sans text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          {issue.title}
        </h1>
        {issue.subtitle && (
          <p className="mt-3 font-sans text-lg leading-snug text-muted-foreground sm:text-xl">
            {issue.subtitle}
          </p>
        )}
        <time
          dateTime={issue.datetime}
          className="mt-4 block font-sans text-sm text-muted-foreground"
        >
          {issue.date}
        </time>

        <div className="prose prose-lg prose-zinc mt-6 border-t border-border pt-6 sm:mt-8 sm:pt-8">
          <Issue />
        </div>
      </article>

      {/* The field itself, not a link to the page that has one: someone who
          just read a whole edition is as close to subscribing as they will get,
          and sending them elsewhere to type an address loses most of them.
          Straight after the writing, before the bio and the read-more list —
          it answers "I want the next one", which is what the last line of an
          Issue leaves a reader with. */}
      <section className="mt-12 flex flex-col items-center border-t border-border pt-8 text-center">
        <p className="max-w-[30rem] font-sans text-lg leading-relaxed">
          {newsletter.pitch.map((piece) => (
            <span key={piece} className="inline-block">
              {piece}
            </span>
          ))}
        </p>
        <div className="mt-6 flex w-full justify-center">
          <SubscribeForm source={issue.href} />
        </div>
      </section>

      {/* The same post-script matter a post carries, and the same rhythm: one
          gap after the writing, a tighter one between the two bands. An Issue
          is read on the web by people who arrived from a link rather than from
          a subscription, and "who wrote this" is their question too. None of it
          reaches the inbox — the email is rendered from the Markdown alone. */}
      <div className="mt-12 flex flex-col gap-y-6">
        <AuthorBio />
        <RecentIssues slug={issue.slug} />
      </div>
    </>
  );
}

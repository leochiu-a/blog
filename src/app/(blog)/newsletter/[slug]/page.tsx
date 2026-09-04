import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { issues } from "@/lib/issues";
import { SITE_URL } from "@/lib/site";
import { AuthorBio } from "@/components/blog/AuthorBio";
import { RecentIssues } from "@/components/newsletter/RecentIssues";
import { SubscribeCta } from "@/components/newsletter/SubscribeCta";

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

      <SubscribeCta source={issue.href} />

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

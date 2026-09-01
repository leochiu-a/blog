import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { issues } from "@/lib/issues";
import { SITE_URL } from "@/lib/site";

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

      <section className="mt-12 border-t border-border pt-8">
        <p className="font-sans text-base text-muted-foreground">
          這是電子報的其中一期。想收到下一期，到{" "}
          <Link href="/newsletter/" className="underline">
            訂閱頁
          </Link>
          留個信箱就好。
        </p>
      </section>
    </>
  );
}

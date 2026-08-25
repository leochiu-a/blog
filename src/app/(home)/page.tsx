import { posts } from "@/lib/posts";
import { PortfolioApp } from "@/components/PortfolioApp";
import type { Mode, Post } from "@/types/content";

export default async function Home({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode: modeParam } = await searchParams;
  const mode: Mode = modeParam === "personal" ? "personal" : "professional";

  const toPost = (entry: (typeof posts)[number]): Post => ({
    title: entry.title,
    href: `/blog/${entry.slug}/`,
    readTime: entry.readTime,
    date: entry.date,
    datetime: entry.datetime,
    featured: entry.featured,
    draft: entry.draft,
  });

  const professionalPosts = posts.filter((p) => p.category === "professional").map(toPost);
  const personalPosts = posts.filter((p) => p.category === "personal").map(toPost);

  return (
    <PortfolioApp mode={mode} professionalPosts={professionalPosts} personalPosts={personalPosts} />
  );
}

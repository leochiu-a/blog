import { allPosts } from "content-collections";
import { PortfolioApp } from "@/components/PortfolioApp";
import type { Post } from "@/types/content";

export default function Home() {
  const sorted = [...allPosts].sort((a, b) => b.datetime.localeCompare(a.datetime));

  const toPost = (entry: (typeof allPosts)[number]): Post => ({
    title: entry.title,
    href: `/blog/${entry.slug}/`,
    readTime: entry.readTime,
    date: entry.date,
    datetime: entry.datetime,
    featured: entry.featured,
  });

  const professionalPosts = sorted.filter((p) => p.category === "professional").map(toPost);
  const personalPosts = sorted.filter((p) => p.category === "personal").map(toPost);

  return <PortfolioApp professionalPosts={professionalPosts} personalPosts={personalPosts} />;
}

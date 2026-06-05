export type Mode = "professional" | "personal";

export interface Post {
  title: string;
  href: string;
  readTime: string; // e.g. "7 min read"
  date: string; // display string, e.g. "11 Feb 2025"
  datetime: string; // ISO
  featured?: boolean; // gold ✦ marker
}

export type ProjectTag = "Prototype" | "Acquisition";

export interface Project {
  title: string;
  description: string;
  href: string;
  image: string; // public path
  tags?: ProjectTag[];
  hn?: { href: string; points: number; comments: number };
}

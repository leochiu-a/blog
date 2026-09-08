export type Mode = "professional" | "personal";

export interface Post {
  title: string;
  href: string;
  readTime: string; // e.g. "7 min read"
  date: string; // display string, e.g. "11 Feb 2025"
  datetime: string; // ISO
  /** Frontmatter summary and hero, shown in the listing's hover preview. */
  description?: string;
  ogImage?: string;
  featured?: boolean; // gold ✦ marker
  draft?: boolean; // unpublished — only ever reaches the listing in `next dev`
}

export type ProjectTag = "Prototype" | "Acquisition";

interface ProjectBase {
  title: string;
  description: string;
  /** Poster frame, and the whole of the media when there is no `video`. */
  image: string;
  /** Muted loop played on hover. Only worth it when the motion *is* the product. */
  video?: string;
  tags?: ProjectTag[];
  hn?: { href: string; points: number; comments: number };
}

/**
 * A project proves itself either by being readable (`github`) or by being
 * usable (`live`) — the card badges whichever it has, so requiring at least
 * one keeps a card from shipping with nothing to click.
 */
export type Project = ProjectBase &
  ({ github: string; live?: string } | { github?: string; live: string });

export interface SocialLink {
  label: string;
  href: string;
}

/**
 * One newsletter Issue as the home page lists it.
 *
 * A subset of the `issues` collection entry: the listing shows a title, the
 * one-line subtitle and a date, and nothing else crosses into the client
 * bundle — the Issue's compiled MDX least of all.
 */
export interface IssueSummary {
  title: string;
  href: string;
  subtitle?: string;
  date: string; // display string, e.g. "8 Sep 2026"
  datetime: string; // ISO
  /** Gold ✦ marker. Derived from the date, unlike a post's hand-set flag. */
  featured?: boolean;
  draft?: boolean;
}

import { allPosts } from "content-collections";

/** Every post in the repo, newest first. */
const byNewest = [...allPosts].sort((a, b) => b.datetime.localeCompare(a.datetime));

/**
 * Every post that should be publicly visible, newest first.
 *
 * Drafts (`draft: true` in frontmatter) are kept out of everything that
 * announces a post — the homepage listing, the RSS feed, the sitemap, the
 * read-more list — so an unfinished post can be committed to the repo without
 * being published. `next dev` keeps them visible so you can preview a draft
 * alongside the published ones while writing.
 */
export const posts = byNewest.filter(
  (post) => !post.draft || process.env.NODE_ENV === "development",
);

/**
 * Every post that answers at its own URL, drafts included — this is the Draft
 * Link: a draft is unlisted rather than private, so pasting its URL into a
 * message is all it takes to have someone read it before it is published, and
 * the link stays the same once it is.
 *
 * Nothing links to a draft and the post page tells search engines not to index
 * one, which is the whole of the protection. That is deliberate: this is a
 * blog in a public repo, where the draft's text is already readable by anyone
 * who looks, so a token would guard the door of a house with no walls.
 */
export const reachablePosts = byNewest;

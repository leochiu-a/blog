import { allPosts } from "content-collections";

/**
 * Every post that should be publicly visible, newest first.
 *
 * Drafts (`draft: true` in frontmatter) are hidden everywhere in production —
 * listings, the RSS feed, and the post routes themselves — so an unfinished
 * post can be committed to the repo without being published. `next dev` keeps
 * them visible so you can preview a draft at its real URL while writing.
 */
export const posts = [...allPosts]
  .filter((post) => !post.draft || process.env.NODE_ENV === "development")
  .sort((a, b) => b.datetime.localeCompare(a.datetime));

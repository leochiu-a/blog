import { allIssues } from "content-collections";

/** Every Issue in the repo, newest first. */
const byNewest = [...allIssues].sort((a, b) => b.datetime.localeCompare(a.datetime));

/**
 * Every Issue that has been published, newest first.
 *
 * Drafts are hidden in production exactly as posts are, so an Issue can be
 * committed while it is still being written. `next dev` keeps them visible so
 * it can be previewed at its real URL.
 */
export const issues = byNewest.filter(
  (issue) => !issue.draft || process.env.NODE_ENV === "development",
);

/**
 * Every Issue that answers at its own URL, drafts included — the Draft Link for
 * Issues, and the same bargain posts make (see lib/posts.ts): a draft is
 * unlisted rather than private, so the URL is all it takes to have someone read
 * an edition before it goes out, and the link stays the same afterwards.
 *
 * A test send shows one reviewer the email; this shows any number of them the
 * writing, without a subscription and without spending a send. The two answer
 * different questions — how it renders in an inbox, and whether it is any good
 * — so an Issue in review wants both.
 */
export const reachableIssues = byNewest;

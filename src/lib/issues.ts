import { allIssues } from "content-collections";

/**
 * Every Issue that has been published, newest first.
 *
 * Drafts are hidden in production exactly as posts are, so an Issue can be
 * committed while it is still being written. `next dev` keeps them visible so
 * it can be previewed at its real URL.
 */
export const issues = [...allIssues]
  .filter((issue) => !issue.draft || process.env.NODE_ENV === "development")
  .sort((a, b) => b.datetime.localeCompare(a.datetime));

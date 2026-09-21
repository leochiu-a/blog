const A_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Module scope, not a call inside a render body: this is read once when the
 * page is built, and a `Date.now()` in a component is an impure call the React
 * compiler rejects. It also ages every entry against the same instant.
 */
const BUILT_AT = Date.now();

/**
 * Anything published in the last month wears the gold ✦.
 *
 * The star used to be a per-post frontmatter flag — a judgement about which
 * post was worth reading — and it had to be un-starred by hand when the next
 * one shipped, which is a chore nobody remembers. Age answers the same
 * question well enough: the interesting thing on a blog that publishes
 * regularly is the thing that just landed.
 *
 * The comparison happens at build time, not in the browser — the home page is
 * prerendered, and a `Date.now()` on the client would disagree with the HTML it
 * hydrates. That does mean a star outlives its month until the next deploy,
 * which is the right trade for a site that redeploys whenever anything is
 * published.
 */
export const isRecent = (datetime: string) => BUILT_AT - Date.parse(datetime) < A_MONTH_MS;

import { allPosts, type Post } from "content-collections";

/**
 * The post a site-relative link points at, or `undefined` when it points at
 * something else on the site — or at a post that has since been renamed.
 *
 * Drafts are included: a card linking one is how a draft gets read before it
 * is published, and the URL does not change when it is.
 *
 * Trailing slashes are normalised because both spellings are written by hand
 * and `trailingSlash: true` makes them the same page.
 *
 * Its own module, apart from `posts.ts`, because of who calls it. `LinkCard`
 * is an MDX component, so it is reachable from every compiled post — and every
 * compiled post is reachable from `content-collections`, which is where this
 * reads from. That circle cannot be broken from here, so nothing in it may run
 * at module scope: `posts.ts` sorts `allPosts` the moment it is evaluated, and
 * being dragged into the circle by this one function crashed the production
 * build on `Cannot access 'allPosts' before initialization` while `next dev`,
 * which evaluates modules one at a time, stayed green. Reading `allPosts`
 * inside the call leaves the circle in place and harmless.
 */
export function postAt(href: string): Post | undefined {
  if (!href.startsWith("/")) return undefined;
  const path = href.split(/[?#]/)[0]!;
  const normalised = path.endsWith("/") ? path : `${path}/`;
  return allPosts.find((post) => post.href === normalised);
}

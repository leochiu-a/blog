import { postAt, postDefaults } from "@/lib/post-at";
import { LinkCardView, withPostDefaults, type LinkCardProps } from "./LinkCardView";

/**
 * A link to something worth stopping for, as a published post renders it.
 *
 * A post on this site is read from the collection every time the page is
 * built, so retitling it updates every card pointing at it.
 */
export function LinkCard({ href, ...attributes }: LinkCardProps) {
  const post = postAt(href);
  return (
    <LinkCardView href={href} {...withPostDefaults(attributes, post && postDefaults(post))} />
  );
}

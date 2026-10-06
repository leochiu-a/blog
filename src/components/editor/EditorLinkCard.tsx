"use client";

import { useEffect, useState } from "react";
import {
  LinkCardView,
  withPostDefaults,
  type LinkCardProps,
  type PostDefaults,
} from "@/components/mdx/LinkCardView";

/**
 * The published card, drawn in the editor. A post on this site lends it its
 * title and picture, and the editor asks the server for those instead of
 * reading the collection itself — see `LinkCardView` for why.
 */
export function EditorLinkCard({ href, ...attributes }: LinkCardProps) {
  const [post, setPost] = useState<{ href: string; defaults: PostDefaults } | null>(null);
  const internal = href.startsWith("/");

  useEffect(() => {
    if (!internal) return;
    const controller = new AbortController();
    fetch(`/api/editor/links/?href=${encodeURIComponent(href)}`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<PostDefaults>) : null))
      .then((defaults) => setPost(defaults && { href, defaults }))
      .catch(() => {});
    return () => controller.abort();
  }, [href, internal]);

  // A result for the previous href is not this card's.
  const defaults = post?.href === href ? post.defaults : undefined;
  return <LinkCardView href={href} {...withPostDefaults(attributes, defaults)} />;
}

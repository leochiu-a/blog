"use client";

import { createContext, useContext } from "react";

/**
 * How a block asks the document to point the share card at it.
 *
 * The hero toggle sits in a node view; `ogImage` is frontmatter. Those are two
 * states the editor keeps in different places on purpose, so rather than teach
 * a block about frontmatter, the document hands down the one sentence a block
 * needs to say: this picture is the one the post is shared with.
 *
 * Context rather than an extension option. `createExtensions` is memoised once
 * per editor — that is what keeps the editor from being rebuilt on every
 * keystroke — so anything handed through it captures the first render's
 * setter and goes stale the moment frontmatter changes. A React node view
 * re-reads context each render instead, which is exactly the lifetime this
 * needs.
 *
 * The default does nothing, so a node view rendered outside a document still
 * works: the block is complete on its own, and only gains this when a document
 * is around to answer.
 */
export const SetOgImageContext = createContext<(src: string) => void>(() => {});

export function useSetOgImage() {
  return useContext(SetOgImageContext);
}

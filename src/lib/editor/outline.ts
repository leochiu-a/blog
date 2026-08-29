import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export type OutlineEntry = {
  /** Where the heading starts in the document, for putting the caret in it. */
  pos: number;
  level: 2 | 3;
  text: string;
};

/**
 * The document's sections, read from the model rather than the rendered DOM.
 *
 * The published rail reads the article out of the DOM because the body never
 * reaches JS there. Here the opposite holds: the model is the live thing, it
 * updates on every keystroke, and it carries positions — which is what the
 * editor navigates by, having no anchors to link to. Heading ids only exist on
 * the published page, added at build time by `rehype-slug`.
 *
 * h2 and h3 only, matching what `PostToc` will show once the post is out. An
 * author working down the rail is looking at the contents their reader gets,
 * not at a different outline of the same draft. The post's title is its own
 * field above the editor, so a body h1 is not the document's title and would
 * only distort the tick scale.
 *
 * Headings with no text yet are left out. One is created the moment an author
 * starts a new section, and a tick for a heading that says nothing is a tick
 * they cannot identify.
 */
export function readOutline(doc: ProseMirrorNode): OutlineEntry[] {
  const entries: OutlineEntry[] = [];

  doc.descendants((node, pos) => {
    // Inline content can hold no headings, so there is nothing below it to walk.
    if (!node.isBlock) return false;
    if (node.type.name !== "heading") return true;

    const level = node.attrs.level;
    const text = node.textContent.trim();
    if ((level === 2 || level === 3) && text) entries.push({ pos, level, text });
    // A heading holds only inline content.
    return false;
  });

  return entries;
}

/**
 * The entry the caret sits in, or `null` when it is above the first heading.
 *
 * The last heading at or before the caret, which is the section the author is
 * writing in — the editor's answer to the reading view's "what is on screen".
 * The caret is the better signal of the two here: an author scrolling to check
 * something has not stopped working where they were working.
 */
export function activeEntry(entries: OutlineEntry[], caret: number): OutlineEntry | null {
  return entries.findLast((entry) => entry.pos <= caret) ?? null;
}

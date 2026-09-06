"use client";

import { useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { TocRail, type TocSection } from "@/components/TocRail";
import { documentTop, useScrollProgress } from "@/components/useScrollProgress";
import { readOutline } from "@/lib/editor/outline";

/**
 * The draft's contents, in the same rail the published post gets.
 *
 * Measured the same way too — off the rendered column, in scrolled pixels. The
 * caret is the wrong signal for a progress bar even though it is the right one
 * for "which section am I working on": an author scrolls through a draft far
 * more than they move the caret, and a bar keyed on the caret sat empty while
 * the page went past, which reads as broken rather than as informative.
 *
 * Two things do differ from the reading view, and both follow from this being a
 * document under the author's hands rather than a page:
 *
 * The sections are re-read on every change. On the published page they are
 * fixed by the time JS runs; here one is renamed, split or deleted while the
 * rail is on screen, and a contents list that lagged the document would be
 * worse than none.
 *
 * An entry moves the caret rather than following a link. Headings carry no ids
 * in the editor — those are added at build time — so there is nothing to link
 * to, and putting the caret in the heading is what an author wanted anyway:
 * they went to that section to work on it.
 */
export function EditorToc({ editor }: { editor: Editor }) {
  const measure = useCallback((): TocSection[] => {
    // The rail draws sections, never subheadings, so an h3 is part of the
    // section above it here exactly as it is on the published page.
    const headings = readOutline(editor.state.doc)
      .filter((entry) => entry.level === 2)
      // The model says where a heading is in the document; only the DOM says
      // where it is on the page, and the bar is drawn in the second of those.
      // A heading whose element is missing has just been typed and not yet
      // rendered — it arrives on the next update.
      .map((entry) => ({ entry, node: editor.view.nodeDOM(entry.pos) }))
      .filter(
        (found): found is { entry: (typeof found)["entry"]; node: Element } =>
          (found.node as Node | null) instanceof Element,
      );

    const columnEnd = editor.view.dom.getBoundingClientRect().bottom + window.scrollY;

    return headings.map(({ entry, node }, i) => ({
      // Position doubles as identity: it is unique within a document, and it
      // changes exactly when the thing it points at moves, which is when a
      // stale row should stop matching.
      key: String(entry.pos),
      text: entry.text,
      start: documentTop(node),
      end: i + 1 < headings.length ? documentTop(headings[i + 1].node) : columnEnd,
    }));
  }, [editor]);

  const { sections, position, remeasure } = useScrollProgress(measure);

  useEffect(() => {
    // Typing moves every heading below the caret, and the rail is drawn in
    // page pixels, so the geometry is stale the moment a line wraps.
    editor.on("update", remeasure);
    return () => void editor.off("update", remeasure);
  }, [editor, remeasure]);

  return (
    <TocRail
      label="目錄"
      sections={sections}
      position={position}
      renderEntry={(section, props) => (
        <button
          type="button"
          // `+ 1` steps inside the heading, so the caret lands in its text
          // rather than before the node — selecting the node itself would put
          // the author's next keystroke in place of the whole heading.
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextSelection(Number(section.key) + 1)
              .scrollIntoView()
              .run()
          }
          {...props}
        >
          {section.text}
        </button>
      )}
    />
  );
}

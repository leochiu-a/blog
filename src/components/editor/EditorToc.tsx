"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { TocRail } from "@/components/TocRail";
import { activeEntry, readOutline, type OutlineEntry } from "@/lib/editor/outline";

/**
 * The draft's contents, in the same rail the published post gets.
 *
 * Two things differ from the reading view, and both follow from this being a
 * document under the author's hands rather than a page:
 *
 * The list is re-read on every change. On the published page the headings are
 * fixed by the time JS runs; here a section is renamed, split or deleted while
 * the rail is on screen, and a contents list that lagged the document would be
 * worse than none.
 *
 * An entry moves the caret rather than following a link. Headings carry no ids
 * in the editor — those are added at build time — so there is nothing to link
 * to, and putting the caret in the heading is what an author wanted anyway:
 * they went to that section to work on it.
 */
export function EditorToc({ editor }: { editor: Editor }) {
  const [outline, setOutline] = useState<{ entries: OutlineEntry[]; caret: number }>({
    entries: [],
    caret: 0,
  });

  useEffect(() => {
    // Both halves come from one read of the state, so the list and the position
    // lit within it can never be from different versions of the document.
    const sync = () =>
      setOutline({ entries: readOutline(editor.state.doc), caret: editor.state.selection.from });

    sync();
    editor.on("update", sync);
    editor.on("selectionUpdate", sync);
    return () => {
      editor.off("update", sync);
      editor.off("selectionUpdate", sync);
    };
  }, [editor]);

  const active = activeEntry(outline.entries, outline.caret);

  return (
    <TocRail
      label="目錄"
      // Position doubles as identity: it is unique within a document, and it
      // changes exactly when the thing it points at moves, which is when a
      // stale row should stop matching.
      items={outline.entries.map((entry) => ({
        key: String(entry.pos),
        text: entry.text,
        level: entry.level,
      }))}
      activeKey={active ? String(active.pos) : null}
      renderEntry={(item, props) => (
        <button
          type="button"
          // `+ 1` steps inside the heading, so the caret lands in its text
          // rather than before the node — selecting the node itself would put
          // the author's next keystroke in place of the whole heading.
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextSelection(Number(item.key) + 1)
              .scrollIntoView()
              .run()
          }
          {...props}
        >
          {item.text}
        </button>
      )}
    />
  );
}

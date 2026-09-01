import { Extension, type Editor } from "@tiptap/core";
import {
  Plugin,
  PluginKey,
  TextSelection,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Where an upload in flight is going to land.
 *
 * A widget decoration rather than a node, which is what makes it safe: it never
 * enters the document, so it cannot be serialized into the post, cannot trigger
 * an autosave, and cannot leave a half-written block behind when an upload
 * fails. What it does get from ProseMirror is position mapping — keep typing
 * while a clip transcodes and the clip still arrives where you dropped it,
 * rather than wherever the caret has wandered off to since.
 *
 * The element is supplied by the caller and belongs to it (the editor renders
 * React into it), so nothing here has an opinion about how a placeholder looks.
 */
export type Placeholder = { id: string; pos: number; element: HTMLElement };

const key = new PluginKey<DecorationSet>("uploadPlaceholder");

/** The mechanism; `UploadPlaceholder` below is the TipTap wrapper around it. */
export const uploadPlaceholderPlugin = new Plugin({
  key,
  state: {
    init: () => DecorationSet.empty,
    apply(transaction, set) {
      const mapped = set.map(transaction.mapping, transaction.doc);
      const action = transaction.getMeta(key) as { add?: Placeholder; remove?: string } | undefined;

      if (action?.add) {
        const { id, pos, element } = action.add;
        return mapped.add(transaction.doc, [Decoration.widget(pos, element, { id })]);
      }
      if (action?.remove) {
        return mapped.remove(
          mapped.find(undefined, undefined, (spec) => spec.id === action.remove),
        );
      }
      return mapped;
    },
  },
  props: { decorations: (state) => key.getState(state) },
});

export const UploadPlaceholder = Extension.create({
  name: "uploadPlaceholder",
  addProseMirrorPlugins: () => [uploadPlaceholderPlugin],
});

export function addPlaceholder(tr: Transaction, placeholder: Placeholder): Transaction {
  return tr.setMeta(key, { add: placeholder });
}

export function removePlaceholder(tr: Transaction, id: string): Transaction {
  return tr.setMeta(key, { remove: id });
}

/** Where the placeholder has ended up, after everything typed since. */
export function placeholderPos(state: EditorState, id: string): number | null {
  const found = key.getState(state)?.find(undefined, undefined, (spec) => spec.id === id);
  return found?.length ? found[0].from : null;
}

/**
 * The first position after everything the last step inserted.
 *
 * Not `at` mapped forward: when the insert splits a paragraph, that position
 * maps into the half *before* the new block. The step map knows where the
 * inserted range actually ends, which is the only anchor that holds either way.
 */
function endOfInsertion(tr: Transaction): number | null {
  let end: number | null = null;
  tr.mapping.maps.at(-1)?.forEach((_from, _to, _newFrom, newTo) => {
    end ??= newTo;
  });
  return end;
}

/**
 * Puts a finished upload where its placeholder is — not at the caret, which by
 * then may be several paragraphs away. Falls back to the caret if the
 * placeholder is gone, which only happens if its block was deleted mid-upload.
 *
 * Then it leaves the caret on the line *below* the block, which is where
 * writing carries on after inserting media. Left to itself, TipTap moves the
 * selection to the end of what it inserted but searches backwards from there —
 * and a `Clip` holds no text position, so that search walks straight past it
 * and lands the caret on the line above the clip that just appeared.
 */
export function insertAtPlaceholder(
  editor: Editor,
  id: string,
  content: Record<string, unknown>,
): void {
  const at = placeholderPos(editor.state, id) ?? editor.state.selection.from;

  editor
    .chain()
    .insertContentAt(at, content, { updateSelection: false })
    .command(({ tr, dispatch }) => {
      if (!dispatch) return true;

      const end = endOfInsertion(tr);
      if (end === null) return true;

      // A block needs a line under it to keep writing on. Every other block in
      // the document has one; a clip inserted at the very end does not.
      if (!tr.doc.resolve(end).nodeAfter?.isTextblock) {
        tr.insert(end, editor.schema.nodes.paragraph.create());
      }
      tr.setSelection(TextSelection.near(tr.doc.resolve(end), 1));
      return true;
    })
    .focus()
    .run();
}

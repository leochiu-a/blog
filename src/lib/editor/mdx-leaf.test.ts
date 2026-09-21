import { getSchema } from "@tiptap/core";
import { EditorState, NodeSelection, TextSelection } from "@tiptap/pm/state";
import {
  chainCommands,
  deleteSelection,
  joinBackward,
  selectNodeBackward,
} from "@tiptap/pm/commands";
import { describe, expect, it } from "vitest";
import { parseDocument } from "./document";
import { backspaceOutOfQuote, extensions, selectLeafBackward } from "./extensions";

const schema = getSchema(extensions);

/** Tiptap's Backspace: the quote boundary first, then ProseMirror's default chain. */
const backspace = chainCommands(
  (state, dispatch) => backspaceOutOfQuote(state, dispatch),
  (state, dispatch) => selectLeafBackward(state, dispatch),
  deleteSelection,
  joinBackward,
  selectNodeBackward,
);

const post = (body: string) => `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`;

const stateOf = (body: string) =>
  EditorState.create({ schema, doc: schema.nodeFromJSON(parseDocument(post(body)).doc) });

const press = (state: EditorState): EditorState => {
  let next = state;
  backspace(state, (tr) => {
    next = state.apply(tr);
  });
  return next;
};

const shape = (state: EditorState) =>
  state.doc.content.content.map(
    (node) => `${node.type.name}${node.attrs.name ? `(${node.attrs.name})` : ""}`,
  );

const FIGURE = `<Figure src="/a.png" alt="a" width={1200} height={800} />`;

/**
 * A self-closing MDX component used to be an `mdxBlock` with no children: a
 * node with nothing inside it, and so with no position inside it either. Both
 * failures below come from that one hole.
 */
describe("a self-closing MDX component is an atom", () => {
  it("parses to a leaf, not to an empty container", () => {
    const state = stateOf(FIGURE);
    const figure = state.doc.child(0);

    expect(figure.type.name).toBe("mdxLeaf");
    expect(figure.isAtom).toBe(true);
    // A leaf is one position wide. The container it replaced was two, with
    // nothing selectable in between.
    expect(figure.nodeSize).toBe(1);
  });

  it("still parses a component that holds children as a container", () => {
    const state = stateOf(`<FancyQuote>\n  big words\n</FancyQuote>`);
    const quote = state.doc.child(0);

    expect(quote.type.name).toBe("mdxBlock");
    expect(quote.textContent).toBe("big words");
  });

  /**
   * Deleting the quote above a figure took the figure with it: the selection
   * had nowhere to stop between the two, so it ran to the figure's far side.
   */
  it("keeps the figure when the quote above it is deleted", () => {
    const start = stateOf(`> quote text\n\n${FIGURE}\n\nafter`);
    const quoteText = start.doc.resolve(2);
    const pastFigure = start.doc.resolve(start.doc.child(0).nodeSize + start.doc.child(1).nodeSize);

    const selected = start.apply(
      start.tr.setSelection(TextSelection.between(quoteText, pastFigure)),
    );

    expect(shape(press(selected))).toEqual(["blockquote", "mdxLeaf(Figure)", "paragraph"]);
  });

  /**
   * `content: "block*"` also let `joinBackward` pull the next paragraph *into*
   * the figure, where the node view hid it and saving wrote it between the
   * tags of a component that renders no children — gone from the page without
   * ever looking deleted.
   */
  it("does not swallow the paragraph after it", () => {
    const start = stateOf(`${FIGURE}\n\nafter`);
    const paragraph = start.doc.child(0).nodeSize + 1;
    const cursorAtStart = start.apply(
      start.tr.setSelection(TextSelection.create(start.doc, paragraph)),
    );

    // The paragraph stays a paragraph — the figure has no room to put it in.
    const once = press(cursorAtStart);

    expect(shape(once)).toEqual(["mdxLeaf(Figure)", "paragraph"]);
    expect(once.doc.child(1).textContent).toBe("after");
  });

  /** And the figure above it is named before it is removed, not instead. */
  it("selects the figure before the press that deletes it", () => {
    const start = stateOf(`${FIGURE}\n\nafter`);
    const paragraph = start.doc.child(0).nodeSize + 1;

    const selected = press(
      start.apply(start.tr.setSelection(TextSelection.create(start.doc, paragraph))),
    );

    expect(selected.selection).toBeInstanceOf(NodeSelection);
    expect(selected.selection.$from.nodeAfter?.attrs.name).toBe("Figure");

    expect(shape(press(selected))).toEqual(["paragraph"]);
  });
});

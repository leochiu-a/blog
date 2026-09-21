import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import {
  chainCommands,
  deleteSelection,
  joinBackward,
  selectNodeBackward,
} from "@tiptap/pm/commands";
import { describe, expect, it } from "vitest";
import { parseDocument, serializeDocument } from "./document";
import { backspaceOutOfQuote, extensions, selectLeafBackward } from "./extensions";
import { forgetSource } from "./testing";

const schema = getSchema(extensions);

const post = (body: string) => `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`;
const docOf = (body: string) => schema.nodeFromJSON(parseDocument(post(body)).doc);

const backspace = chainCommands(
  (state, dispatch) => backspaceOutOfQuote(state, dispatch),
  (state, dispatch) => selectLeafBackward(state, dispatch),
  deleteSelection,
  joinBackward,
  selectNodeBackward,
);

/**
 * Markdown can write a container with nothing in it — `>`, `>>` and a bare `-`
 * are all one — where the schema cannot hold one: `blockquote` is `block+` and
 * `listItem` is `paragraph block*`. Handing those through as empty built a
 * document that broke ProseMirror's own schema, and a node that violates the
 * schema has no position inside it: an empty pull quote could be neither typed
 * into nor deleted.
 */
describe("a container markdown left empty", () => {
  it.each([">", ">>", "-"])("parses %o into a document the schema accepts", (body) => {
    expect(() => docOf(body).check()).not.toThrow();
  });

  it("gives an empty pull quote a paragraph to put the cursor in", () => {
    const doc = docOf(">>");
    const pullQuote = doc.child(0);

    expect(pullQuote.child(0).type.name).toBe("blockquote");
    expect(pullQuote.child(0).child(0).type.name).toBe("paragraph");
  });

  it.each([">", ">>", "-"])("still writes %o back as it was", (body) => {
    expect(serializeDocument(forgetSource(parseDocument(post(body))))).toBe(post(body));
  });

  it("unwraps an empty pull quote one backspace at a time", () => {
    const doc = docOf("before\n\n>>");
    let state = EditorState.create({ schema, doc });
    // Inside the pull quote's paragraph, two levels down.
    state = state.apply(
      state.tr.setSelection(TextSelection.near(state.doc.resolve(state.doc.child(0).nodeSize + 3))),
    );

    expect(state.selection.$from.depth).toBe(3);

    const press = () => {
      const handled = backspace(state, (tr) => {
        state = state.apply(tr);
      });
      return handled;
    };
    const shape = () => state.doc.content.content.map((node) => node.type.name);

    expect(press()).toBe(true);
    expect(shape()).toEqual(["paragraph", "blockquote"]);
    expect(press()).toBe(true);
    expect(shape()).toEqual(["paragraph", "paragraph"]);
    expect(press()).toBe(true);
    expect(shape()).toEqual(["paragraph"]);
  });
});

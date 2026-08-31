// @vitest-environment happy-dom
import { Editor, getSchema } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { describe, expect, it } from "vitest";
import { extensions } from "./extensions";
import {
  addPlaceholder,
  insertAtPlaceholder,
  placeholderPos,
  removePlaceholder,
  uploadPlaceholderPlugin,
} from "./upload-placeholder";

const schema = getSchema(extensions);

/** A one-paragraph document with the placeholder plugin running. */
function stateWith(text: string) {
  return EditorState.create({
    schema,
    doc: schema.nodeFromJSON({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    }),
    plugins: [uploadPlaceholderPlugin],
  });
}

const placeholder = (pos: number) => ({
  id: "1",
  pos,
  element: document.createElement("div"),
});

describe("upload placeholders", () => {
  it("remembers where an upload was started", () => {
    const start = stateWith("hello");
    const state = start.apply(addPlaceholder(start.tr, placeholder(6)));

    expect(placeholderPos(state, "1")).toBe(6);
  });

  it("has nothing to say about an id it was never given", () => {
    expect(placeholderPos(stateWith("hello"), "nope")).toBeNull();
  });

  /**
   * The point of a decoration rather than a node: an upload takes seconds, and
   * whatever gets typed in the meantime must not move where the clip lands.
   */
  it("follows the text typed before it while the upload runs", () => {
    let state = stateWith("hello");
    state = state.apply(addPlaceholder(state.tr, placeholder(6)));

    state = state.apply(state.tr.insertText("XXX", 1));

    expect(placeholderPos(state, "1")).toBe(9);
  });

  it("survives an unrelated transaction", () => {
    let state = stateWith("hello");
    state = state.apply(addPlaceholder(state.tr, placeholder(6)));

    state = state.apply(state.tr.setMeta("something-else", true));

    expect(placeholderPos(state, "1")).toBe(6);
  });

  it("is gone once the upload ends", () => {
    let state = stateWith("hello");
    state = state.apply(addPlaceholder(state.tr, placeholder(6)));

    state = state.apply(removePlaceholder(state.tr, "1"));

    expect(placeholderPos(state, "1")).toBeNull();
  });
});

/** A live editor, which `insertAtPlaceholder` needs for its command chain. */
function editorWith(content: string) {
  return new Editor({ element: document.createElement("div"), extensions, content });
}

const CLIP = {
  type: "mdxBlock",
  attrs: {
    name: "Clip",
    attributes: [{ name: "src", value: "/clip.mp4", expression: null }],
  },
};

/** The block index the caret is in, and the index of the clip that landed. */
function landed(editor: Editor) {
  const blocks = editor.state.doc.content.content;
  return {
    caret: editor.state.selection.$from.index(0),
    clip: blocks.findIndex((node) => node.attrs.name === "Clip"),
    blocks: blocks.map((node) => (node.attrs.name as string | null) ?? node.type.name),
  };
}

describe("landing a finished upload", () => {
  /**
   * A `Clip` holds no text position, so left to itself TipTap's own
   * "select the end of what was inserted" search walks backwards past it and
   * leaves the caret on the line above the clip that just appeared.
   */
  it("leaves the caret on the line below the clip", () => {
    const editor = editorWith("<p>one</p><p>two</p>");
    editor.commands.setTextSelection(2);
    editor.view.dispatch(
      addPlaceholder(editor.state.tr, {
        id: "1",
        pos: editor.state.selection.$from.after(),
        element: document.createElement("div"),
      }),
    );

    insertAtPlaceholder(editor, "1", CLIP);

    expect(landed(editor)).toEqual({
      caret: 2,
      clip: 1,
      blocks: ["paragraph", "Clip", "paragraph"],
    });
    editor.destroy();
  });

  /** At the end of the document there is no line below yet, so it gets one. */
  it("adds a line to keep writing on when the clip lands last", () => {
    const editor = editorWith("<p>one</p>");
    editor.view.dispatch(
      addPlaceholder(editor.state.tr, {
        id: "1",
        pos: editor.state.doc.content.size,
        element: document.createElement("div"),
      }),
    );

    insertAtPlaceholder(editor, "1", CLIP);

    expect(landed(editor)).toEqual({
      caret: 2,
      clip: 1,
      blocks: ["paragraph", "Clip", "paragraph"],
    });
    expect(editor.state.selection.$from.parent.content.size).toBe(0);
    editor.destroy();
  });

  it("lands where the placeholder ended up, not at the caret", () => {
    const editor = editorWith("<p>one</p><p>two</p>");
    editor.view.dispatch(
      addPlaceholder(editor.state.tr, {
        id: "1",
        pos: editor.state.doc.content.size,
        element: document.createElement("div"),
      }),
    );
    // Carry on writing at the top while the clip transcodes.
    editor.commands.setTextSelection(1);
    editor.commands.insertContent("XXX");

    insertAtPlaceholder(editor, "1", CLIP);

    expect(landed(editor).clip).toBe(2);
    expect(editor.state.doc.child(0).textContent).toBe("XXXone");
    editor.destroy();
  });
});

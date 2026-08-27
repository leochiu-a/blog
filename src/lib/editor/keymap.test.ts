import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { describe, expect, it } from "vitest";
import { backspaceOutOfQuote, enterOutOfPullQuote, extensions } from "./extensions";
import { parsePost } from "./document";
import type { PmNode } from "./types";

const schema = getSchema(extensions);

/** The document a post loads as, with the cursor at the very end of the body. */
function stateAtEnd(body: string) {
  const source = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`;
  const doc = parsePost(source).doc as PmNode;
  const node = schema.nodeFromJSON({
    ...doc,
    content: [...(doc.content ?? []), { type: "paragraph" }],
  });
  const state = EditorState.create({ schema, doc: node });
  return state.apply(
    state.tr.setSelection(TextSelection.near(state.doc.resolve(state.doc.content.size), -1)),
  );
}

describe("backspace after a blockquote", () => {
  it("leaves a pull quote whole instead of adopting the empty paragraph", () => {
    let next: EditorState | undefined;
    const state = stateAtEnd(">> a pull quote");

    const handled = backspaceOutOfQuote(state, (tr) => {
      next = state.apply(tr);
    });

    expect(handled).toBe(true);
    const quote = next!.doc.child(0);
    expect(quote.type.name).toBe("blockquote");
    expect(quote.childCount).toBe(1);
    expect(quote.child(0).type.name).toBe("blockquote");
    // The cursor sits at the end of the quote's text, ready to keep typing.
    expect(next!.selection.$from.parent.textContent).toBe("a pull quote");
  });

  it("does the same for a plain quote", () => {
    let next: EditorState | undefined;
    const state = stateAtEnd("> a quote");

    expect(backspaceOutOfQuote(state, (tr) => (next = state.apply(tr)))).toBe(true);
    expect(next!.doc.childCount).toBe(1);
    expect(next!.doc.child(0).childCount).toBe(1);
  });

  it("stands aside when the paragraph has text", () => {
    const state = stateAtEnd("> a quote");
    const typed = state.apply(state.tr.insertText("x"));

    expect(backspaceOutOfQuote(typed, () => {})).toBe(false);
  });

  it("stands aside when what precedes it isn't a quote", () => {
    expect(backspaceOutOfQuote(stateAtEnd("a paragraph"), () => {})).toBe(false);
  });
});

describe("enter at the end of a pull quote", () => {
  /** The cursor at the end of the quote's own text, not in a block after it. */
  function stateInQuote(body: string) {
    const state = stateAtEnd(body);
    const quote = state.doc.child(0);
    return state.apply(
      state.tr.setSelection(TextSelection.near(state.doc.resolve(quote.nodeSize - 1), -1)),
    );
  }

  it("starts a paragraph after the quote rather than inside it", () => {
    let next: EditorState | undefined;
    const state = stateInQuote(">> a pull quote");

    expect(enterOutOfPullQuote(state, (tr) => (next = state.apply(tr)))).toBe(true);
    const quote = next!.doc.child(0);
    expect(quote.child(0).childCount).toBe(1);
    expect(next!.doc.child(1).type.name).toBe("paragraph");
    // The cursor is in that new paragraph, outside the quote.
    expect(next!.selection.$from.node(1).type.name).toBe("paragraph");
  });

  it("leaves a plain quote alone, where several paragraphs are fair game", () => {
    expect(enterOutOfPullQuote(stateInQuote("> a quote"), () => {})).toBe(false);
  });

  it("stands aside mid-sentence, so Enter can still split", () => {
    const state = stateInQuote(">> a pull quote");
    const middle = state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(4), 1)));

    expect(enterOutOfPullQuote(middle, () => {})).toBe(false);
  });
});

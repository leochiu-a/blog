import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { describe, expect, it } from "vitest";
import { backspaceOutOfQuote, cycleQuote, enterOutOfPullQuote, extensions } from "./extensions";
import { parseDocument } from "./document";
import type { PmNode } from "./types";

const schema = getSchema(extensions);

/** The document a post loads as, with the cursor at the very end of the body. */
function stateAtEnd(body: string) {
  const source = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`;
  const doc = parseDocument(source).doc as PmNode;
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

  /**
   * An empty heading is as empty as an empty paragraph, and ProseMirror joins
   * it into the quote just the same. Once it was in there the quote had two
   * children, so it was no longer a pull quote, and no press deleted the
   * heading — backspace only shuffled the two around.
   */
  it("deletes an empty heading under a pull quote instead of adopting it", () => {
    let next: EditorState | undefined;
    const loaded = stateAtEnd(">> a pull quote\n\n##");
    // Into the empty heading itself, which is what the writer is backspacing
    // out of — `stateAtEnd` parks the cursor a block further down.
    const heading = loaded.doc.child(0).nodeSize + 1;
    const state = loaded.apply(
      loaded.tr.setSelection(TextSelection.near(loaded.doc.resolve(heading))),
    );

    expect(state.selection.$from.parent.type.name).toBe("heading");
    expect(backspaceOutOfQuote(state, (tr) => (next = state.apply(tr)))).toBe(true);

    const quote = next!.doc.child(0);
    expect(quote.childCount).toBe(1);
    expect(quote.child(0).type.name).toBe("blockquote");
    expect(next!.selection.$from.parent.textContent).toBe("a pull quote");
  });

  /** And gets a quote that already adopted one back out of that state. */
  it("removes an empty heading a quote has already adopted", () => {
    const withHeading = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [{ type: "paragraph", content: [{ type: "text", text: "a pull quote" }] }],
            },
            { type: "heading", attrs: { level: 2 } },
          ],
        },
      ],
    });
    const start = EditorState.create({ schema, doc: withHeading });
    const state = start.apply(
      start.tr.setSelection(TextSelection.near(start.doc.resolve(start.doc.content.size - 1), -1)),
    );

    let next: EditorState | undefined;

    expect(backspaceOutOfQuote(state, (tr) => (next = state.apply(tr)))).toBe(true);
    expect(next!.doc.child(0).childCount).toBe(1);
    expect(next!.doc.child(0).child(0).type.name).toBe("blockquote");
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

describe("cycling a block through the quote styles", () => {
  /** The cursor inside the first block of the document. */
  function stateInFirstBlock(body: string) {
    const source = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`;
    const doc = parseDocument(source).doc as PmNode;
    const state = EditorState.create({ schema, doc: schema.nodeFromJSON(doc) });
    return state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(2))));
  }

  /** How many blockquotes wrap the cursor, and the text it still sits in. */
  function shape(state: EditorState) {
    const { $from } = state.selection;
    let quotes = 0;
    for (let depth = $from.depth; depth > 0; depth -= 1) {
      if ($from.node(depth).type.name === "blockquote") quotes += 1;
    }
    return { quotes, text: $from.parent.textContent };
  }

  function press(state: EditorState) {
    let next = state;
    expect(cycleQuote(state, (tr) => (next = state.apply(tr)))).toBe(true);
    return next;
  }

  it("goes paragraph → quote → pull quote → paragraph", () => {
    const paragraph = stateInFirstBlock("一段文字");
    expect(shape(paragraph)).toEqual({ quotes: 0, text: "一段文字" });

    const quote = press(paragraph);
    expect(shape(quote)).toEqual({ quotes: 1, text: "一段文字" });

    const pullQuote = press(quote);
    expect(shape(pullQuote)).toEqual({ quotes: 2, text: "一段文字" });
    expect(pullQuote.doc.child(0).childCount).toBe(1);

    const backToParagraph = press(pullQuote);
    expect(shape(backToParagraph)).toEqual({ quotes: 0, text: "一段文字" });
    expect(backToParagraph.doc.child(0).type.name).toBe("paragraph");
  });

  it("picks up a quote that was already written as one", () => {
    expect(shape(press(stateInFirstBlock("> 引用")))).toEqual({ quotes: 2, text: "引用" });
  });

  it("unwraps a pull quote that was already written as one", () => {
    expect(shape(press(stateInFirstBlock(">> 引用")))).toEqual({ quotes: 0, text: "引用" });
  });
});

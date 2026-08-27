import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PmSchemaNode } from "@tiptap/pm/model";
import { hasLineNumbers } from "./code-block-meta";

/**
 * Line numbers down the left edge of a code block that has `showLineNumbers`
 * in its fence meta — the editor's counterpart to the CSS counter the
 * published page uses.
 *
 * The published page can do it in CSS because rehype-pretty-code wraps every
 * line in an element. Here there is nothing to hang a counter off: a code
 * block's content is one text node with newlines in it, and lowlight's
 * highlighting adds spans per token, not per line. So the numbers are widget
 * decorations instead — they live in the view only, never in the document, so
 * they can't be typed over, copied, or saved, and positions still map the way
 * ProseMirror expects.
 */

/**
 * Document positions where each of `text`'s lines begins, `base` being the
 * position of its first character.
 */
export function lineStarts(text: string, base: number): number[] {
  const starts = [base];
  for (let i = 0; i < text.length; i++) {
    // A trailing newline opens no line — there is no content after it to number.
    if (text[i] === "\n" && i < text.length - 1) starts.push(base + i + 1);
  }
  return starts;
}

function numberAt(pos: number, line: number, width: number): Decoration {
  return Decoration.widget(
    pos,
    () => {
      const span = document.createElement("span");
      span.className = "code-line-number";
      span.textContent = String(line);
      span.style.width = `${width}ch`;
      // Not part of the code: it must not be editable, and a screen reader
      // reading the block should hear the code, not a column of numbers.
      span.contentEditable = "false";
      span.ariaHidden = "true";
      return span;
    },
    // `side: -1` keeps the number left of the line's first character;
    // `ignoreSelection` stops a click on it from moving the caret oddly.
    { side: -1, ignoreSelection: true },
  );
}

function decorationsFor(doc: PmSchemaNode): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    // Code blocks are top level and hold no blocks of their own, so there is
    // never a reason to descend into one.
    if (node.type.name !== "codeBlock") return true;
    if (!hasLineNumbers((node.attrs.meta as string | null) ?? null)) return false;

    const starts = lineStarts(node.textContent, pos + 1);
    // One gutter width for the whole block, so the code stays left-aligned
    // whether it runs to 9 lines or 90.
    const width = String(starts.length).length;
    starts.forEach((start, index) => {
      decorations.push(numberAt(start, index + 1, width));
    });
    return false;
  });

  return DecorationSet.create(doc, decorations);
}

export const LineNumbers = Extension.create({
  name: "lineNumbers",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        // Derived straight from the document rather than cached in plugin
        // state: code blocks are small, and there is nothing to fall out of
        // step with the `meta` attribute the toggle writes.
        props: { decorations: (state) => decorationsFor(state.doc) },
      }),
    ];
  },
});

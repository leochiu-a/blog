import { getSchema } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { describe, expect, it } from "vitest";
import { parseDocument } from "./document";
import { extensions } from "./extensions";

const schema = getSchema(extensions);

const stateOf = (body: string) =>
  EditorState.create({
    schema,
    doc: schema.nodeFromJSON(
      parseDocument(`---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`).doc,
    ),
  });
/**
 * Tiptap derives the link mark's inclusivity from `autolink`
 * (`inclusive() { return this.options.autolink }`), so leaving autolink on
 * meant the space typed after a link — and everything after that space —
 * joined the link.
 */
describe("a link stops where it was written", () => {
  it("does not carry the mark to what is typed after it", () => {
    const state = stateOf(`see [a link](https://example.com) here`);
    const link = schema.marks.link!;
    const paragraph = state.doc.child(0);

    // Sanity: the link is there in the first place.
    expect(paragraph.textContent).toBe("see a link here");
    expect(state.doc.rangeHasMark(5, 11, link)).toBe(true);

    // The position right after the link's last character is where typing
    // continues from. Nothing there is marked, so nothing typed inherits it.
    const afterLink = state.doc.resolve(11);

    expect(afterLink.marks().some((mark) => mark.type === link)).toBe(false);
    expect(link.spec.inclusive).toBe(false);
  });
});

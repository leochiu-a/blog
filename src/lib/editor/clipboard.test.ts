// @vitest-environment happy-dom
import { getSchema } from "@tiptap/core";
import { DOMParser as PmDOMParser, DOMSerializer } from "@tiptap/pm/model";
import { describe, expect, it } from "vitest";
import { parseDocument, serializeDocument } from "./document";
import { extensions } from "./extensions";
import type { PmNode } from "./types";

const schema = getSchema(extensions);

/**
 * What the clipboard does to a document.
 *
 * Copying is a round trip through HTML: ProseMirror serializes the slice with
 * the schema and parses it back on paste, so anything the schema does not write
 * into the DOM is left behind in the cut. Running a whole document through both
 * halves is the same journey, and reaches every node at once.
 */
function throughClipboard(doc: PmNode): PmNode {
  const node = schema.nodeFromJSON(doc);
  const html = document.createElement("div");
  html.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(node.content));

  return PmDOMParser.fromSchema(schema).parse(html).toJSON() as PmNode;
}

describe("copying and pasting", () => {
  it.each([
    `<Figure src="/a.webp" alt="a picture" width={1280} height={1224} caption="說明" hero />`,
    `<Clip src="/a.mp4" poster="/a.webp" caption="說明" />`,
    `<LinkCard href="/blog/other/" />`,
    `<FancyQuote>\n  big words\n</FancyQuote>`,
  ])("keeps %o whole", (body) => {
    const source = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`;
    const document = parseDocument(source);

    const pasted = { ...document, doc: throughClipboard(document.doc) };

    expect(serializeDocument(pasted)).toBe(source);
  });
});

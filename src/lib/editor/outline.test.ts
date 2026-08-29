import { getSchema } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { extensions } from "./extensions";
import { parsePost } from "./document";
import { activeEntry, readOutline } from "./outline";
import type { PmNode } from "./types";

const schema = getSchema(extensions);

/** A post body as the editor holds it, ready to be read for its sections. */
function docOf(body: string) {
  const source = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`;
  return schema.nodeFromJSON(parsePost(source).doc as PmNode);
}

describe("readOutline", () => {
  it("lists h2 and h3 in document order", () => {
    const outline = readOutline(
      docOf("## First\n\nsome prose\n\n### A detail\n\n## Second\n\nmore prose"),
    );

    expect(outline.map((entry) => [entry.level, entry.text])).toEqual([
      [2, "First"],
      [3, "A detail"],
      [2, "Second"],
    ]);
  });

  it("ignores h1 and h4, matching what the published rail shows", () => {
    // The post's title is its own field above the editor, so a body h1 is not
    // the document's title — and neither depth reaches the reader's contents.
    const outline = readOutline(docOf("# Not the title\n\n## Section\n\n#### Aside"));

    expect(outline.map((entry) => entry.text)).toEqual(["Section"]);
  });

  it("leaves out a heading with no text yet", () => {
    // What an author has the instant they start a new section: a tick for it
    // would be one they cannot tell from any other.
    const doc = schema.nodeFromJSON({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Written" }] },
        { type: "heading", attrs: { level: 2 } },
      ],
    });

    expect(readOutline(doc).map((entry) => entry.text)).toEqual(["Written"]);
  });

  it("reads the text through marks, so a styled heading is not truncated", () => {
    const outline = readOutline(docOf("## A **bold** word and `code`"));

    expect(outline[0].text).toBe("A bold word and code");
  });

  it("returns positions that land inside their own heading", () => {
    const doc = docOf("## First\n\nprose\n\n## Second");
    const outline = readOutline(doc);

    for (const entry of outline) {
      expect(doc.nodeAt(entry.pos)?.textContent).toBe(entry.text);
    }
  });

  it("finds nothing in a document with no sections", () => {
    expect(readOutline(docOf("just a paragraph"))).toEqual([]);
  });
});

describe("activeEntry", () => {
  const doc = docOf("## First\n\nprose in the first\n\n## Second\n\nprose in the second");
  const outline = readOutline(doc);

  it("is the section the caret sits in", () => {
    const insideSecond = outline[1].pos + 3;
    expect(activeEntry(outline, insideSecond)?.text).toBe("Second");
  });

  it("stays on a section while the caret is in the prose below it", () => {
    const inFirstsProse = outline[1].pos - 1;
    expect(activeEntry(outline, inFirstsProse)?.text).toBe("First");
  });

  it("is the heading itself when the caret is in it", () => {
    expect(activeEntry(outline, outline[0].pos)?.text).toBe("First");
  });

  it("is nothing when the caret is above the first heading", () => {
    // A post that opens with prose before its first section — the caret has no
    // section to be in yet, and the rail should light nothing rather than
    // guess at the one below.
    const opening = docOf("an intro paragraph\n\n## First");
    expect(activeEntry(readOutline(opening), 0)).toBeNull();
  });
});

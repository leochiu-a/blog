import { describe, expect, it } from "vitest";
import { parsePost, serializePost } from "./document";
import type { PmNode, PostDocument } from "./types";

const FRONTMATTER = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n`;
const post = (body: string) => `${FRONTMATTER}${body}\n`;

/** Force the canonical serializer, as if every block had just been edited. */
function forgetSource(document: PostDocument): PostDocument {
  const content = (document.doc.content ?? []).map((block) => {
    const { source: _source, ...attrs } = block.attrs ?? {};
    return { ...block, attrs: Object.keys(attrs).length > 0 ? attrs : undefined } as PmNode;
  });
  return { ...document, doc: { ...document.doc, content } };
}

const BODIES = {
  "pull quote": `>> Agent = Model + Harness`,
  "plain quote": `> an ordinary quote`,
  "thematic break": `before\n\n---\n\nafter`,
  // Padded to the column widths remark writes, so an edited table and an
  // untouched one produce the same bytes.
  table: `| a |  b  |\n| - | :-: |\n| 1 |  2  |`,
  strikethrough: `~~gone~~ but not forgotten`,
  "task list": `- [ ] todo\n- [x] done`,
  "code block": "```ts\nconst a = 1;\n```",
  "nested list": `- one\n  - one point one\n- two`,
  link: `a [link](https://example.com) inline`,
  "bold and italic": `**bold** and *italic* and \`code\``,
};

describe.each(Object.entries(BODIES))("%s", (_name, body) => {
  it("round-trips byte-identically", () => {
    const source = post(body);
    expect(serializePost(parsePost(source))).toBe(source);
  });

  it("serializes back to the same markdown after an edit", () => {
    const source = post(body);
    expect(serializePost(forgetSource(parsePost(source)))).toBe(source);
  });
});

describe("a table the writer didn't align", () => {
  const ragged = post(`| a | b |\n| - | :-: |\n| 1 | 2 |`);

  it("keeps the writer's own spacing while it is untouched", () => {
    expect(serializePost(parsePost(ragged))).toBe(ragged);
  });

  it("writes it out aligned once it has been edited", () => {
    expect(serializePost(forgetSource(parsePost(ragged)))).toBe(
      post(`| a |  b  |\n| - | :-: |\n| 1 |  2  |`),
    );
  });
});

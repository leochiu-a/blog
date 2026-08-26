import { describe, expect, it } from "vitest";
import { parsePost, serializePost } from "./document";
import { forgetSource } from "./testing";

const FRONTMATTER = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n`;
const post = (body: string) => `${FRONTMATTER}${body}\n`;

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

/**
 * The block-by-block test in document.test.ts compares real posts with escapes
 * normalised away on both sides, so nothing there asserts what the serializer
 * escapes. These do, on the two cases the posts actually contain.
 */
describe("punctuation the serializer escapes once a block is edited", () => {
  it.each([
    // `@` is escaped because MDX would otherwise read it as the start of an
    // expression; `\@` renders as a plain @.
    ["BLEU 或 Pass@k 這類指標", "BLEU 或 Pass\\@k 這類指標"],
    // CommonMark won't read `**` as emphasis when it opens against a full-width
    // bracket, so this is literal text — and literal asterisks get escaped.
    ["最值得留的是**「冷門規則」**。", "最值得留的是\\*\\*「冷門規則」\\*\\*。"],
  ])("writes %o as %o", (written, expected) => {
    expect(serializePost(forgetSource(parsePost(post(written))))).toBe(post(expected));
  });

  it("leaves emphasis alone when CommonMark does read it as emphasis", () => {
    const emphasised = post("最值得留的是「**冷門規則**」。");

    expect(serializePost(forgetSource(parsePost(emphasised)))).toBe(emphasised);
  });
});

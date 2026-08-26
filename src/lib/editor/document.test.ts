import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePost, serializePost, stringifyBlock } from "./document";
import type { PmNode, PostDocument } from "./types";

const POSTS_DIR = join(process.cwd(), "src/content/blog");
const postFiles = readdirSync(POSTS_DIR).filter((name) => name.endsWith(".md"));
const read = (name: string) => readFileSync(join(POSTS_DIR, name), "utf8");

/**
 * Drop the original-source attrs, so serialization has to go through the
 * mdast bridge rather than replaying the bytes it was handed.
 */
function forgetSource(document: PostDocument): PostDocument {
  const content = (document.doc.content ?? []).map((block) => {
    const { source: _source, ...attrs } = block.attrs ?? {};
    return { ...block, attrs: Object.keys(attrs).length > 0 ? attrs : undefined } as PmNode;
  });
  return { ...document, doc: { ...document.doc, content } };
}

describe("post round-trip", () => {
  it("finds the posts to test against", () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  it.each(postFiles)("%s survives parse -> serialize byte-identically", (name) => {
    const source = read(name);
    expect(serializePost(parsePost(source))).toBe(source);
  });

  /**
   * Whitespace and backslash escapes are where the serializer legitimately
   * differs from hand-written markdown: it indents JSX children, and it
   * escapes punctuation the writer left bare (`Pass@k`, or a `**` pair that
   * CommonMark doesn't read as emphasis). Everything else — bullet and
   * emphasis characters, fences, table padding, quote markers — has to come
   * back exactly as written.
   */
  const ignoringEscapesAndIndent = (markdown: string) =>
    markdown
      .split("\n")
      .map((line) => line.replace(/^\s+/, "").replace(/\\([!-/:-@[-`{-~])/g, "$1"))
      .join("\n");

  /**
   * The byte-identity test above is satisfied by replaying each block's stored
   * source, so on its own it says nothing about the serializer. This one takes
   * the replay away: every block is written from scratch and has to come back
   * as the markdown it was parsed from.
   */
  // Hand-wrapped JSX attributes are the one thing the serializer can't
  // reproduce — it writes every element on one line. That gap is exactly why
  // untouched blocks are replayed verbatim rather than rewritten.
  const isHandWrappedJsx = (block: PmNode) =>
    block.type === "mdxBlock" && String(block.attrs?.source).includes("\n  ");

  it.each(postFiles)("%s re-serializes to the same markdown, block by block", (name) => {
    const source = read(name);
    const blocks = parsePost(source).doc.content ?? [];
    let compared = 0;

    for (const block of blocks) {
      if (isHandWrappedJsx(block)) continue;

      expect(ignoringEscapesAndIndent(stringifyBlock(block))).toBe(
        ignoringEscapesAndIndent(block.attrs?.source as string),
      );
      compared += 1;
    }

    // Every block that wasn't skipped was actually compared, so the loop can't
    // pass by quietly doing nothing. A brand new post has none, and that's fine.
    expect(compared).toBe(blocks.filter((block) => !isHandWrappedJsx(block)).length);
  });

  it("drops the empty paragraphs the editor keeps around for clicking into", () => {
    const source = read(postFiles[0]!);
    const document = parsePost(source);

    // Tiptap's trailing-node behaviour always leaves one of these at the end.
    document.doc.content = [
      ...(document.doc.content ?? []),
      { type: "paragraph" },
      { type: "paragraph", content: [] },
    ];

    expect(serializePost(document)).toBe(source);
  });

  it.each(postFiles)("%s survives a re-serialization from scratch", (name) => {
    const original = parsePost(read(name));
    const reparsed = parsePost(serializePost(forgetSource(original)));

    expect(forgetSource(reparsed).doc).toEqual(forgetSource(original).doc);
    expect(reparsed.frontmatter).toEqual(original.frontmatter);
  });
});

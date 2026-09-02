import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDocument, serializeDocument, stringifyBlock } from "./document";
import { forgetSource } from "./testing";
import type { PmNode } from "./types";

const POSTS_DIR = join(process.cwd(), "src/content/blog");
const postFiles = readdirSync(POSTS_DIR).filter((name) => name.endsWith(".md"));
const read = (name: string) => readFileSync(join(POSTS_DIR, name), "utf8");

describe("post round-trip", () => {
  it("finds the posts to test against", () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  it.each(postFiles)("%s survives parse -> serialize byte-identically", (name) => {
    const source = read(name);
    expect(serializeDocument(parseDocument(source))).toBe(source);
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
    const blocks = parseDocument(source).doc.content ?? [];
    let compared = 0;

    for (const block of blocks) {
      if (isHandWrappedJsx(block)) continue;

      expect(ignoringEscapesAndIndent(stringifyBlock(block))).toBe(
        ignoringEscapesAndIndent(block.attrs?.source as string),
      );
      compared += 1;
    }

    // Counted from the file text rather than from the same predicate the loop
    // uses, so this can't agree with a loop that skipped everything.
    const handWrapped = (source.match(/^<[A-Z][A-Za-z]*\n/gm) ?? []).length;

    expect(compared).toBe(blocks.length - handWrapped);
  });

  it("drops the empty paragraphs the editor keeps around for clicking into", () => {
    const source = read(postFiles[0]!);
    const document = parseDocument(source);

    // Tiptap's trailing-node behaviour always leaves one of these at the end.
    document.doc.content = [
      ...(document.doc.content ?? []),
      { type: "paragraph" },
      { type: "paragraph", content: [] },
    ];

    expect(serializeDocument(document)).toBe(source);
  });

  it.each(postFiles)("%s survives a re-serialization from scratch", (name) => {
    const original = parseDocument(read(name));
    const reparsed = parseDocument(serializeDocument(forgetSource(original)));

    expect(forgetSource(reparsed).doc).toEqual(forgetSource(original).doc);
    expect(reparsed.frontmatter).toEqual(original.frontmatter);
  });
});

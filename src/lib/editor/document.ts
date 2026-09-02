import type { Root } from "mdast";
import { blockToMdast, mdastToPm } from "./bridge";
import { applyFrontmatter, parseFrontmatter } from "./frontmatter";
import { parseMarkdown, stringifyMarkdown } from "./markdown";
import type { PmNode, EditorDocument } from "./types";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n\n/;

/** Where a top-level block's original source is stashed, for lossless saves. */
const SOURCE_ATTR = "source";

export function parseDocument(source: string): EditorDocument {
  const match = FRONTMATTER.exec(source);
  if (!match) throw new Error("Post is missing a `---` frontmatter block");

  const frontmatterSource = match[1]!;
  const body = source.slice(match[0].length);
  const tree = parseMarkdown(body);
  const doc = mdastToPm(tree);

  doc.content = (doc.content ?? []).map((block, index) => {
    const position = tree.children[index]?.position;
    if (!position) return block;
    return {
      ...block,
      attrs: {
        ...block.attrs,
        [SOURCE_ATTR]: body.slice(position.start.offset, position.end.offset),
      },
    };
  });

  return {
    frontmatter: parseFrontmatter(frontmatterSource),
    frontmatterSource,
    doc,
  };
}

export function serializeDocument(document: EditorDocument): string {
  const frontmatter = applyFrontmatter(document.frontmatterSource, document.frontmatter);
  return `---\n${frontmatter}\n---\n\n${serializeBody(document.doc)}`;
}

/**
 * Markdown has no way to write an empty paragraph, and the editor always keeps
 * one at the end so you can click below the last block. They aren't content.
 */
function isEmptyParagraph(block: PmNode): boolean {
  return block.type === "paragraph" && (block.content?.length ?? 0) === 0;
}

function serializeBody(doc: PmNode): string {
  const blocks = (doc.content ?? [])
    .filter((block) => !isEmptyParagraph(block))
    .map((block) => {
      const source = block.attrs?.[SOURCE_ATTR];
      if (typeof source === "string" && isUnchanged(block, source)) return source;
      return stringifyBlock(block);
    });
  return blocks.length === 0 ? "" : `${blocks.join("\n\n")}\n`;
}

/** Serialize one top-level block on its own, without the trailing newline. */
export function stringifyBlock(block: PmNode): string {
  const tree: Root = { type: "root", children: [blockToMdast(stripSource(block))] };
  return stringifyMarkdown(tree).replace(/\n$/, "");
}

/**
 * A block is unchanged when it serializes to the same markdown as the source
 * it was parsed from. That is what lets an untouched paragraph keep its
 * original bytes — including hand-wrapped JSX attributes, which the serializer
 * would otherwise collapse onto one line — while an edited one is rewritten.
 *
 * Comparing serialized markdown rather than node JSON also keeps this immune
 * to the extra attributes ProseMirror fills in from schema defaults.
 */
function isUnchanged(block: PmNode, source: string): boolean {
  const reparsed = mdastToPm(parseMarkdown(source)).content;
  if (reparsed?.length !== 1) return false;
  return stringifyBlock(block) === stringifyBlock(reparsed[0]!);
}

function stripSource(block: PmNode): PmNode {
  if (!block.attrs || !(SOURCE_ATTR in block.attrs)) return block;
  const { [SOURCE_ATTR]: _source, ...attrs } = block.attrs;
  return Object.keys(attrs).length === 0 ? { ...block, attrs: undefined } : { ...block, attrs };
}

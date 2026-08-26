import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getSchema } from "@tiptap/core";
import { Node as PmSchemaNode } from "@tiptap/pm/model";
import { describe, expect, it } from "vitest";
import { parsePost, serializePost } from "./document";
import { extensions } from "./extensions";
import type { PmNode } from "./types";

const schema = getSchema(extensions);
const POSTS_DIR = join(process.cwd(), "src/content/blog");
const postFiles = readdirSync(POSTS_DIR).filter((name) => name.endsWith(".md"));

/** What the editor would hand back after loading a document and doing nothing. */
function throughEditorSchema(doc: PmNode): PmNode {
  return PmSchemaNode.fromJSON(schema, doc).toJSON() as PmNode;
}

describe("editor schema", () => {
  it.each(postFiles)("%s survives a trip through the editor schema", (name) => {
    const source = readFileSync(join(POSTS_DIR, name), "utf8");
    const document = parsePost(source);

    const reloaded = { ...document, doc: throughEditorSchema(document.doc) };

    expect(serializePost(reloaded)).toBe(source);
  });

  it.each([
    `| a |  b  |\n| - | :-: |\n| 1 |  2  |`,
    `- [ ] todo\n- [x] done`,
    `~~gone~~ and **bold** and *italic*`,
    "```ts meta\nconst a = 1;\n```",
    `>> a pull quote`,
    `<Figure src="/a.png" alt="a" width={1200} height={800} />`,
    `<Callout type="warning">\n  heads up\n</Callout>`,
    `text with an <Abbr title="t">inline</Abbr> component`,
    `a [link](https://example.com "titled") inline`,
  ])("keeps %o intact through the editor schema", (body) => {
    const source = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n${body}\n`;
    const document = parsePost(source);

    const reloaded = { ...document, doc: throughEditorSchema(document.doc) };

    expect(serializePost(reloaded)).toBe(source);
  });
});

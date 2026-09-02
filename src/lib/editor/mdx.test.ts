import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MDX_BLOCKS, specFor } from "@/components/editor/mdx-blocks";
import { parseDocument, serializeDocument } from "./document";
import type { MdxAttribute, PmNode } from "./types";

const FRONTMATTER = `---\ntitle: "t"\ndatetime: "2026-01-01"\n---\n\n`;
const post = (body: string) => `${FRONTMATTER}${body}\n`;

const COMPONENTS = [
  `<Figure src="/a.png" alt="a" width={1200} height={800} caption="c" />`,
  `<Figure\n  src="/a.png"\n  alt="a"\n  width={1200}\n  height={800}\n/>`,
  `<Callout type="warning">\n  heads up\n</Callout>`,
  `<FancyQuote>\n  big words\n</FancyQuote>`,
  `<VideoEmbed src="https://example.com/v" title="V" />`,
];

const attributesOf = (block: PmNode) => (block.attrs as { attributes: MdxAttribute[] }).attributes;

describe("MDX components", () => {
  it.each(COMPONENTS)("keeps %s intact through a round-trip", (component) => {
    const source = post(component);
    expect(serializeDocument(parseDocument(source))).toBe(source);
  });

  it("exposes string and expression attributes separately", () => {
    const document = parseDocument(post(COMPONENTS[0]!));
    const [block] = document.doc.content!;

    expect(block!.type).toBe("mdxBlock");
    expect(block!.attrs!.name).toBe("Figure");
    expect(attributesOf(block!)).toEqual([
      { name: "src", value: "/a.png", expression: null },
      { name: "alt", value: "a", expression: null },
      { name: "width", value: null, expression: "1200" },
      { name: "height", value: null, expression: "800" },
      { name: "caption", value: "c", expression: null },
    ]);
  });

  it("serializes an edited attribute back as JSX", () => {
    const document = parseDocument(post(COMPONENTS[1]!));
    const [block] = document.doc.content!;
    const attributes = attributesOf(block!).map((attribute) =>
      attribute.name === "alt"
        ? { ...attribute, value: "changed" }
        : attribute.name === "width"
          ? { ...attribute, expression: "640" }
          : attribute,
    );

    const edited = {
      ...document,
      doc: { ...document.doc, content: [{ ...block!, attrs: { ...block!.attrs, attributes } }] },
    };

    expect(serializeDocument(edited)).toBe(
      post(`<Figure src="/a.png" alt="changed" width={640} height={800} />`),
    );
  });

  it("keeps a component's children editable as rich text", () => {
    const document = parseDocument(post(COMPONENTS[2]!));
    const [block] = document.doc.content!;

    expect(block!.content).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "heads up" }] },
    ]);
  });
});

describe("the insertable component list", () => {
  it.each(["Figure", "Clip", "Callout", "VideoEmbed", "FancyQuote"])(
    "has a typed spec for %s",
    (name) => {
      expect(specFor(name)).toBeDefined();
    },
  );

  it("names only components the blog actually renders", () => {
    const rendered = readFileSync(join(process.cwd(), "src/mdx-components.tsx"), "utf8");
    for (const block of MDX_BLOCKS) expect(rendered).toContain(block.name);
  });
});

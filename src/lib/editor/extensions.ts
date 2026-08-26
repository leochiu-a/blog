import { Extension, Node, type NodeViewRenderer } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";

/**
 * The editor's ProseMirror schema, shaped to match the mdast bridge one for
 * one. Anything markdown can express has a node here, so loading a post into
 * the editor and reading it back can't quietly drop structure.
 */

/** Tables mirror mdast exactly: cells hold inline content, not blocks. */
const Table = Node.create({
  name: "table",
  group: "block",
  content: "tableRow+",
  isolating: true,
  addAttributes: () => ({ align: { default: null } }),
  parseHTML: () => [{ tag: "table" }],
  renderHTML: () => ["table", ["tbody", 0]],
});

const TableRow = Node.create({
  name: "tableRow",
  content: "tableCell*",
  parseHTML: () => [{ tag: "tr" }],
  renderHTML: () => ["tr", 0],
});

const TableCell = Node.create({
  name: "tableCell",
  content: "inline*",
  isolating: true,
  parseHTML: () => [{ tag: "td" }],
  renderHTML: () => ["td", 0],
});

/** An MDX component used as a block: `<Figure … />`, `<BookQuote>…</BookQuote>`. */
const MdxBlock = Node.create({
  name: "mdxBlock",
  group: "block",
  content: "block*",
  defining: true,
  addAttributes: () => ({ name: { default: null }, attributes: { default: [] } }),
  parseHTML: () => [{ tag: "div[data-mdx-block]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    { "data-mdx-block": String(HTMLAttributes.name ?? "") },
    0,
  ],
});

const MdxInline = Node.create({
  name: "mdxInline",
  group: "inline",
  inline: true,
  content: "inline*",
  addAttributes: () => ({ name: { default: null }, attributes: { default: [] } }),
  parseHTML: () => [{ tag: "span[data-mdx-inline]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "span",
    { "data-mdx-inline": String(HTMLAttributes.name ?? "") },
    0,
  ],
});

/**
 * Anything the bridge doesn't map — raw HTML, footnotes, MDX expressions. It
 * carries its mdast node verbatim so it survives an editing session untouched.
 */
const UnknownBlock = Node.create({
  name: "unknownBlock",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes: () => ({ mdast: { default: null } }),
  parseHTML: () => [{ tag: "div[data-unknown-block]" }],
  renderHTML: () => ["div", { "data-unknown-block": "" }],
});

const UnknownInline = Node.create({
  name: "unknownInline",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes: () => ({ mdast: { default: null } }),
  parseHTML: () => [{ tag: "span[data-unknown-inline]" }],
  renderHTML: () => ["span", { "data-unknown-inline": "" }],
});

const BLOCK_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "codeBlock",
  "horizontalRule",
  "table",
  "mdxBlock",
  "unknownBlock",
];

/**
 * Each top-level block remembers the markdown it was parsed from, so saving a
 * post rewrites only the blocks that actually changed.
 */
const SourceAttribute = Extension.create({
  name: "sourceAttribute",
  addGlobalAttributes: () => [
    { types: BLOCK_TYPES, attributes: { source: { default: null, rendered: false } } },
  ],
});

/** Markdown details ProseMirror has no opinion about, but the serializer needs. */
const MarkdownAttributes = Extension.create({
  name: "markdownAttributes",
  addGlobalAttributes: () => [
    {
      types: ["bulletList", "orderedList"],
      attributes: { spread: { default: false, rendered: false } },
    },
    {
      types: ["listItem"],
      attributes: {
        checked: { default: null, rendered: false },
        spread: { default: false, rendered: false },
      },
    },
    { types: ["codeBlock"], attributes: { meta: { default: null, rendered: false } } },
  ],
});

type NodeViewRenderers = {
  mdxBlock?: () => NodeViewRenderer;
  unknownBlock?: () => NodeViewRenderer;
};

/**
 * Node views are passed in rather than imported, so this module stays free of
 * React and the DOM and the schema can be built anywhere.
 */
export function createExtensions(nodeViews: NodeViewRenderers = {}) {
  return [
    StarterKit.configure({ link: false, codeBlock: { languageClassPrefix: "language-" } }),
    Link.configure({ openOnClick: false }).extend({
      addAttributes() {
        return { ...this.parent?.(), title: { default: null } };
      },
    }),
    Image,
    Table,
    TableRow,
    TableCell,
    nodeViews.mdxBlock ? MdxBlock.extend({ addNodeView: nodeViews.mdxBlock }) : MdxBlock,
    MdxInline,
    nodeViews.unknownBlock
      ? UnknownBlock.extend({ addNodeView: nodeViews.unknownBlock })
      : UnknownBlock,
    UnknownInline,
    SourceAttribute,
    MarkdownAttributes,
  ];
}

export const extensions = createExtensions();

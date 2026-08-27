import { Extension, Node, type NodeViewRenderer } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { TextSelection, type Command } from "@tiptap/pm/state";
import { common, createLowlight } from "lowlight";
import { LineNumbers } from "./line-numbers";

/**
 * Highlighting while typing.
 *
 * The published page is coloured by shiki at build time; the editor can't use
 * that — shiki resolves grammars asynchronously, and a ProseMirror decoration
 * has to be produced synchronously on every keystroke. lowlight (highlight.js)
 * is synchronous, so the editor gets its own highlighter, and `editor.css`
 * maps its `hljs-*` classes onto the same GitHub hues shiki emits so the two
 * agree on colour.
 *
 * `common` is highlight.js' ~37-language set rather than `all`; the editor
 * only exists under `next dev` (see dev-routes.ts), so its weight never
 * reaches the deployed app.
 */
const lowlight = createLowlight(common);

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

/**
 * Backspace in an empty paragraph that sits right after a blockquote.
 *
 * ProseMirror's default pulls the paragraph into the quote as one more child.
 * For a pull quote — `>>`, a blockquote whose only child is a blockquote —
 * that extra child breaks the `:only-child` shape the editor styles it by, so
 * it snaps back to two nested rules mid-typing. Delete the empty paragraph and
 * put the cursor at the end of the quote instead, which is what backspace
 * means everywhere else.
 */
export const backspaceOutOfQuote: Command = (state, dispatch) => {
  const { empty, $from } = state.selection;
  if (!empty || $from.depth === 0) return false;

  const paragraph = $from.parent;
  if (paragraph.type.name !== "paragraph" || paragraph.content.size > 0) return false;

  const index = $from.index($from.depth - 1);
  if (index === 0) return false;
  if ($from.node($from.depth - 1).child(index - 1).type.name !== "blockquote") return false;

  if (dispatch) {
    const start = $from.before();
    const tr = state.tr.delete(start, start + paragraph.nodeSize);
    // `start - 1` is just inside the blockquote's close; searching backwards
    // from there lands at the end of its last text, however deeply nested.
    tr.setSelection(TextSelection.near(tr.doc.resolve(start - 1), -1));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/**
 * Enter at the end of a pull quote.
 *
 * A pull quote is one sentence — `<FancyQuote>` on the published page — so
 * carrying on inside it is never what Enter means there. Start a fresh
 * paragraph after the quote instead. A plain blockquote keeps the default,
 * since a quote of several paragraphs is a real thing to write.
 */
export const enterOutOfPullQuote: Command = (state, dispatch) => {
  const { empty, $from } = state.selection;
  if (!empty || $from.depth < 3) return false;

  const paragraph = $from.parent;
  if (paragraph.type.name !== "paragraph") return false;
  if ($from.parentOffset !== paragraph.content.size) return false;

  const inner = $from.node($from.depth - 1);
  const outer = $from.node($from.depth - 2);
  const isPullQuote =
    inner.type.name === "blockquote" && outer.type.name === "blockquote" && outer.childCount === 1;
  if (!isPullQuote) return false;
  if ($from.index($from.depth - 1) !== inner.childCount - 1) return false;

  if (dispatch) {
    const after = $from.after($from.depth - 2);
    const tr = state.tr.insert(after, state.schema.nodes.paragraph!.createAndFill()!);
    tr.setSelection(TextSelection.near(tr.doc.resolve(after)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

const QuoteBoundary = Extension.create({
  name: "quoteBoundary",
  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ state, dispatch }) => backspaceOutOfQuote(state, dispatch)),
      Enter: () =>
        this.editor.commands.command(({ state, dispatch }) => enterOutOfPullQuote(state, dispatch)),
    };
  },
});

type NodeViewRenderers = {
  mdxBlock?: () => NodeViewRenderer;
  unknownBlock?: () => NodeViewRenderer;
  codeBlock?: () => NodeViewRenderer;
};

/**
 * Node views are passed in rather than imported, so this module stays free of
 * React and the DOM and the schema can be built anywhere.
 */
export function createExtensions(nodeViews: NodeViewRenderers = {}) {
  return [
    // CodeBlockLowlight replaces StarterKit's plain code block. It keeps the
    // same node name and `language` attribute, so the mdast bridge and the
    // `meta` global attribute carry over untouched.
    StarterKit.configure({ link: false, codeBlock: false }),
    nodeViews.codeBlock
      ? CodeBlockLowlight.configure({ lowlight, languageClassPrefix: "language-" }).extend({
          addNodeView: nodeViews.codeBlock,
        })
      : CodeBlockLowlight.configure({ lowlight, languageClassPrefix: "language-" }),
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
    QuoteBoundary,
    LineNumbers,
    SourceAttribute,
    MarkdownAttributes,
  ];
}

export const extensions = createExtensions();

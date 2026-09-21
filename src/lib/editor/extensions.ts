import { Extension, Node, type NodeViewRenderer } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { NodeSelection, TextSelection, type Command } from "@tiptap/pm/state";
import { wrapIn } from "@tiptap/pm/commands";
import { common, createLowlight } from "lowlight";
import { SoleHero } from "./hero";
import { LineNumbers } from "./line-numbers";
import { UploadPlaceholder } from "./upload-placeholder";

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

/**
 * The attributes of an MDX node, written somewhere the DOM can hold them.
 *
 * A node's attributes only survive a round trip through HTML if they are *in*
 * the HTML, and copying is exactly that round trip: ProseMirror serializes the
 * slice with the schema, and parses it back on paste. Rendering just the
 * component's name meant cutting a `<Figure>` and pasting it produced an empty
 * block — src, caption, alt and hero all left behind in the cut.
 *
 * JSON in one attribute rather than an attribute each: the values are a list of
 * `{ name, value, expression }`, and an MDX attribute may be an expression
 * rather than a string. Flattening that into DOM attributes would lose the
 * distinction the serializer needs to write `hero` and `width={1280}` back the
 * way they came.
 */
const attributesToDOM = (attributes: unknown) => JSON.stringify(attributes ?? []);

const attributesFromDOM = (element: HTMLElement) => {
  const raw = element.getAttribute("data-mdx-attributes");
  if (raw === null) return [];
  // Anything may be on the clipboard, including HTML hand-written by someone
  // else that happens to carry the attribute. A block with no attributes is a
  // recoverable loss; a parse error takes the whole paste down.
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** An MDX component used as a block: `<Figure … />`, `<FancyQuote>…</FancyQuote>`. */
const MdxBlock = Node.create({
  name: "mdxBlock",
  group: "block",
  content: "block*",
  defining: true,
  addAttributes: () => ({ name: { default: null }, attributes: { default: [] } }),
  parseHTML: () => [
    {
      tag: "div[data-mdx-block]",
      getAttrs: (element) => ({
        name: element.getAttribute("data-mdx-block") || null,
        attributes: attributesFromDOM(element),
      }),
    },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    {
      "data-mdx-block": String(HTMLAttributes.name ?? ""),
      "data-mdx-attributes": attributesToDOM(HTMLAttributes.attributes),
    },
    0,
  ],
});

/**
 * A self-closing MDX component: `<Figure … />`, `<Clip … />`, `<LinkCard … />`.
 *
 * An atom, not an empty container. As a container it was a node with no
 * children, which is a node with no position inside it: `<Figure>` occupied
 * positions 14 and 16 and nothing in between, so a selection that reached past
 * the block before it had nowhere to stop and landed on the far side — select
 * the quote above a figure, press delete, and the figure went with it. The
 * same hole let `joinBackward` pull the following paragraph *into* the figure,
 * where `content: "block*"` accepted it, the node view hid it, and saving
 * wrote it between the tags of a component that renders no children — the
 * paragraph left the published page without ever looking deleted.
 *
 * Being an atom gives it what both of those were missing: one indivisible
 * position, selected whole or not at all.
 */
const MdxLeaf = Node.create({
  name: "mdxLeaf",
  group: "block",
  atom: true,
  defining: true,
  addAttributes: () => ({ name: { default: null }, attributes: { default: [] } }),
  parseHTML: () => [
    {
      tag: "div[data-mdx-leaf]",
      getAttrs: (element) => ({
        name: element.getAttribute("data-mdx-leaf") || null,
        attributes: attributesFromDOM(element),
      }),
    },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    {
      "data-mdx-leaf": String(HTMLAttributes.name ?? ""),
      "data-mdx-attributes": attributesToDOM(HTMLAttributes.attributes),
    },
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
  "mdxLeaf",
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

/**
 * Option+Cmd+5 — the same shortcut Medium uses, walking a block through the two
 * kinds of quote this blog has and back out: paragraph → quote → pull quote
 * (`>>`, a blockquote whose only child is a blockquote) → paragraph. One key
 * for what would otherwise be three controls, and pressing it once too often
 * costs nothing because the next press undoes it.
 */
export const cycleQuote: Command = (state, dispatch) => {
  const blockquote = state.schema.nodes.blockquote!;
  const { $from, from } = state.selection;

  const depths: number[] = [];
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type === blockquote) depths.push(depth);
  }
  const [inner, outer] = depths;

  if (inner === undefined) return wrapIn(blockquote)(state, dispatch);

  if (outer === undefined) {
    if (dispatch) {
      const quote = $from.node(inner);
      const tr = state.tr.replaceWith(
        $from.before(inner),
        $from.after(inner),
        blockquote.create(null, quote),
      );
      // The text now sits one level deeper, so the cursor moves along with it.
      tr.setSelection(TextSelection.near(tr.doc.resolve(from + 1)));
      dispatch(tr.scrollIntoView());
    }
    return true;
  }

  if (dispatch) {
    const tr = state.tr.replaceWith(
      $from.before(outer),
      $from.after(outer),
      $from.node(inner).content,
    );
    // Two levels shed, so the cursor comes back the same two positions.
    tr.setSelection(TextSelection.near(tr.doc.resolve(from - 2)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/**
 * Backspace at the start of a block whose previous sibling is a self-closing
 * MDX component selects that component instead of deleting it.
 *
 * ProseMirror's `joinBackward` ends with "if the node before is an atom,
 * delete it", so one press at the top of the paragraph under a figure took the
 * figure away, with nothing having named it as the target first. Selecting it
 * shows what the next press will remove, which is what Backspace does over
 * every other block — and it costs the writer one keystroke, not a dialog.
 */
export const selectLeafBackward: Command = (state, dispatch) => {
  const { empty, $from } = state.selection;
  if (!empty || $from.depth === 0 || $from.parentOffset > 0) return false;
  if (!$from.parent.isTextblock) return false;

  const index = $from.index($from.depth - 1);
  if (index === 0) return false;

  const before = $from.node($from.depth - 1).child(index - 1);
  if (!before.isAtom || !before.type.isBlock) return false;

  if (dispatch) {
    const position = $from.before($from.depth) - before.nodeSize;
    dispatch(state.tr.setSelection(NodeSelection.create(state.doc, position)));
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
      "Mod-Alt-5": () =>
        this.editor.commands.command(({ state, dispatch }) => cycleQuote(state, dispatch)),
    };
  },
});

/**
 * Cmd-Alt-1 and Cmd-Alt-2 for h2 and h3 — the only two levels a post is
 * written in. Every other heading key is swallowed.
 *
 * Tiptap binds Mod-Alt-<n> to heading level n, which spends the first and
 * easiest key on an h1 that no post has: the title is a frontmatter field
 * above the editor, so a body h1 would be a second title. Shifting the run by
 * one puts the two levels the writer reaches for on the two keys the hand
 * finds first.
 *
 * Returning `true` for 3, 4 and 6 claims the key and does nothing, which is
 * what takes h1, h4, h5 and h6 off the keyboard — an unbound key would fall
 * through to StarterKit's default and make the heading anyway. 5 is left
 * alone: QuoteBoundary spends it on the quote cycle.
 *
 * The schema still carries every level. `readOutline` deliberately covers a
 * body h1, and one published post is written with h4s; narrowing the schema
 * would leave that post unable to round-trip through the editor for the sake
 * of a keymap. This only changes what the keyboard can produce.
 */
const LeafBoundary = Extension.create({
  name: "leafBoundary",
  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ state, dispatch }) => selectLeafBackward(state, dispatch)),
    };
  },
});

const HeadingShortcuts = Extension.create({
  name: "headingShortcuts",
  addKeyboardShortcuts() {
    return {
      "Mod-Alt-1": () => this.editor.commands.toggleHeading({ level: 2 }),
      "Mod-Alt-2": () => this.editor.commands.toggleHeading({ level: 3 }),
      "Mod-Alt-3": () => true,
      "Mod-Alt-4": () => true,
      "Mod-Alt-6": () => true,
    };
  },
});

type NodeViewRenderers = {
  mdxBlock?: () => NodeViewRenderer;
  mdxLeaf?: () => NodeViewRenderer;
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
      // Tiptap ties the mark's inclusivity to `autolink`
      // (`inclusive() { return this.options.autolink }`), so leaving autolink
      // on means every character typed at the end of a link — the space after
      // it included — is swallowed into the link. Autolink applies its marks
      // over explicit ranges from an `appendTransaction`, so it keeps working
      // with the mark closed; the two options only look related.
      inclusive: () => false,
      addAttributes() {
        return { ...this.parent?.(), title: { default: null } };
      },
    }),
    Image,
    Table,
    TableRow,
    TableCell,
    nodeViews.mdxBlock ? MdxBlock.extend({ addNodeView: nodeViews.mdxBlock }) : MdxBlock,
    nodeViews.mdxLeaf ? MdxLeaf.extend({ addNodeView: nodeViews.mdxLeaf }) : MdxLeaf,
    MdxInline,
    nodeViews.unknownBlock
      ? UnknownBlock.extend({ addNodeView: nodeViews.unknownBlock })
      : UnknownBlock,
    UnknownInline,
    QuoteBoundary,
    LeafBoundary,
    HeadingShortcuts,
    LineNumbers,
    UploadPlaceholder,
    SoleHero,
    SourceAttribute,
    MarkdownAttributes,
  ];
}

export const extensions = createExtensions();

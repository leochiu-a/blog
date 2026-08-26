import type {
  BlockContent,
  DefinitionContent,
  PhrasingContent,
  Root,
  RootContent,
  TableCell,
  TableRow,
} from "mdast";
import type { MdxJsxAttribute, MdxJsxExpressionAttribute } from "mdast-util-mdx-jsx";
import type { MdxAttribute, PmMark, PmNode } from "./types";

/**
 * The mdast <-> ProseMirror bridge.
 *
 * mdast is the source of truth: the editor never invents structure the
 * markdown can't express, and anything this file doesn't map explicitly is
 * carried through verbatim as an opaque node rather than silently dropped.
 * Both directions live here so a gap in one is visible next to the other.
 */

type MdxElement = {
  type: "mdxJsxFlowElement" | "mdxJsxTextElement";
  name: string | null;
  attributes: Array<MdxJsxAttribute | MdxJsxExpressionAttribute>;
  children: unknown[];
};

const MARK_BY_TYPE = {
  strong: "bold",
  emphasis: "italic",
  delete: "strike",
} as const;

function toMdxAttributes(attributes: MdxElement["attributes"]): MdxAttribute[] {
  return attributes.map((attribute) => {
    if (attribute.type === "mdxJsxExpressionAttribute") {
      return { name: null, value: null, expression: attribute.value };
    }
    if (attribute.value === null || attribute.value === undefined) {
      return { name: attribute.name, value: null, expression: null };
    }
    if (typeof attribute.value === "string") {
      return { name: attribute.name, value: attribute.value, expression: null };
    }
    return { name: attribute.name, value: null, expression: attribute.value.value };
  });
}

function fromMdxAttributes(attributes: MdxAttribute[]): MdxElement["attributes"] {
  return attributes.map((attribute) => {
    if (attribute.name === null) {
      return { type: "mdxJsxExpressionAttribute", value: attribute.expression ?? "" };
    }
    if (attribute.expression !== null) {
      return {
        type: "mdxJsxAttribute",
        name: attribute.name,
        value: { type: "mdxJsxAttributeValueExpression", value: attribute.expression },
      };
    }
    return { type: "mdxJsxAttribute", name: attribute.name, value: attribute.value };
  });
}

/** Strip `position` so an opaque node compares and serializes stably. */
function withoutPosition<T>(node: T): T {
  return JSON.parse(
    JSON.stringify(node, (key, value) => (key === "position" ? undefined : value)),
  ) as T;
}

function inlineToPm(nodes: PhrasingContent[], marks: PmMark[]): PmNode[] {
  const out: PmNode[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case "text":
        out.push({ type: "text", text: node.value, ...(marks.length > 0 && { marks }) });
        break;
      case "inlineCode":
        out.push({ type: "text", text: node.value, marks: [...marks, { type: "code" }] });
        break;
      case "strong":
      case "emphasis":
      case "delete":
        out.push(...inlineToPm(node.children, [...marks, { type: MARK_BY_TYPE[node.type] }]));
        break;
      case "link":
        out.push(
          ...inlineToPm(node.children, [
            ...marks,
            { type: "link", attrs: { href: node.url, title: node.title ?? null } },
          ]),
        );
        break;
      case "image":
        out.push({
          type: "image",
          attrs: { src: node.url, alt: node.alt ?? null, title: node.title ?? null },
        });
        break;
      case "break":
        out.push({ type: "hardBreak" });
        break;
      case "mdxJsxTextElement":
        out.push({
          type: "mdxInline",
          attrs: {
            name: node.name,
            attributes: toMdxAttributes(node.attributes),
          },
          content: inlineToPm(node.children as PhrasingContent[], []),
          ...(marks.length > 0 && { marks }),
        });
        break;
      default:
        out.push({
          type: "unknownInline",
          attrs: { mdast: withoutPosition(node) },
          ...(marks.length > 0 && { marks }),
        });
    }
  }

  return out;
}

function blockToPm(node: RootContent): PmNode {
  switch (node.type) {
    case "paragraph":
      return { type: "paragraph", content: inlineToPm(node.children, []) };
    case "heading":
      return {
        type: "heading",
        attrs: { level: node.depth },
        content: inlineToPm(node.children, []),
      };
    case "blockquote":
      return { type: "blockquote", content: node.children.map(blockToPm) };
    case "list":
      return {
        type: node.ordered ? "orderedList" : "bulletList",
        attrs: { start: node.start ?? 1, spread: node.spread ?? false },
        content: node.children.map(blockToPm),
      };
    case "listItem":
      return {
        type: "listItem",
        attrs: { checked: node.checked ?? null, spread: node.spread ?? false },
        content: node.children.map(blockToPm),
      };
    case "code":
      return {
        type: "codeBlock",
        attrs: { language: node.lang ?? null, meta: node.meta ?? null },
        ...(node.value !== "" && { content: [{ type: "text", text: node.value }] }),
      };
    case "thematicBreak":
      return { type: "horizontalRule" };
    case "table":
      return {
        type: "table",
        attrs: { align: node.align ?? null },
        content: node.children.map(blockToPm),
      };
    case "tableRow":
      return { type: "tableRow", content: node.children.map(blockToPm) };
    case "tableCell":
      return { type: "tableCell", content: inlineToPm(node.children, []) };
    case "mdxJsxFlowElement":
      return {
        type: "mdxBlock",
        attrs: { name: node.name, attributes: toMdxAttributes(node.attributes) },
        content: node.children.map(blockToPm),
      };
    default:
      return { type: "unknownBlock", attrs: { mdast: withoutPosition(node) } };
  }
}

export function mdastToPm(tree: Root): PmNode {
  return { type: "doc", content: tree.children.map(blockToPm) };
}

function marksOf(node: PmNode): PmMark[] {
  return node.marks ?? [];
}

function sameMark(a: PmMark, b: PmMark): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * ProseMirror carries marks per text node; mdast nests them. Rebuild the
 * nesting by grouping runs of adjacent nodes that share the outermost mark.
 */
function inlineToMdast(nodes: PmNode[]): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  let index = 0;

  while (index < nodes.length) {
    const node = nodes[index]!;
    const [mark] = marksOf(node);

    if (!mark) {
      out.push(leafToMdast(node));
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < nodes.length && marksOf(nodes[end]!).some((m) => sameMark(m, mark))) end += 1;

    const children = inlineToMdast(
      nodes.slice(index, end).map((child) => ({
        ...child,
        marks: marksOf(child).filter((m) => !sameMark(m, mark)),
      })),
    );

    out.push(wrapMark(mark, children));
    index = end;
  }

  return out;
}

function wrapMark(mark: PmMark, children: PhrasingContent[]): PhrasingContent {
  switch (mark.type) {
    case "bold":
      return { type: "strong", children };
    case "italic":
      return { type: "emphasis", children };
    case "strike":
      return { type: "delete", children };
    case "code": {
      const value = children.map((child) => ("value" in child ? child.value : "")).join("");
      return { type: "inlineCode", value };
    }
    case "link": {
      const attrs = (mark.attrs ?? {}) as { href?: string; title?: string | null };
      return {
        type: "link",
        url: attrs.href ?? "",
        title: attrs.title ?? null,
        children,
      };
    }
    default:
      return { type: "text", value: "" };
  }
}

function leafToMdast(node: PmNode): PhrasingContent {
  switch (node.type) {
    case "text":
      return { type: "text", value: node.text ?? "" };
    case "hardBreak":
      return { type: "break" };
    case "image": {
      const attrs = (node.attrs ?? {}) as {
        src?: string;
        alt?: string | null;
        title?: string | null;
      };
      return {
        type: "image",
        url: attrs.src ?? "",
        alt: attrs.alt ?? null,
        title: attrs.title ?? null,
      };
    }
    case "mdxInline": {
      const attrs = (node.attrs ?? {}) as { name: string | null; attributes: MdxAttribute[] };
      return {
        type: "mdxJsxTextElement",
        name: attrs.name,
        attributes: fromMdxAttributes(attrs.attributes),
        children: inlineToMdast(node.content ?? []),
      } as PhrasingContent;
    }
    case "unknownInline":
      return (node.attrs as { mdast: PhrasingContent }).mdast;
    default:
      return { type: "text", value: node.text ?? "" };
  }
}

type MdastBlock = BlockContent | DefinitionContent;

export function blockToMdast(node: PmNode): RootContent {
  switch (node.type) {
    case "paragraph":
      return { type: "paragraph", children: inlineToMdast(node.content ?? []) };
    case "heading":
      return {
        type: "heading",
        depth: ((node.attrs?.level as number) ?? 1) as 1 | 2 | 3 | 4 | 5 | 6,
        children: inlineToMdast(node.content ?? []),
      };
    case "blockquote":
      return {
        type: "blockquote",
        children: (node.content ?? []).map(blockToMdast) as MdastBlock[],
      };
    case "bulletList":
    case "orderedList":
      return {
        type: "list",
        ordered: node.type === "orderedList",
        start: node.type === "orderedList" ? ((node.attrs?.start as number) ?? 1) : null,
        spread: (node.attrs?.spread as boolean) ?? false,
        children: (node.content ?? []).map(blockToMdast) as never,
      };
    case "listItem":
      return {
        type: "listItem",
        checked: (node.attrs?.checked as boolean | null) ?? null,
        spread: (node.attrs?.spread as boolean) ?? false,
        children: (node.content ?? []).map(blockToMdast) as MdastBlock[],
      };
    case "codeBlock":
      return {
        type: "code",
        lang: (node.attrs?.language as string | null) ?? null,
        meta: (node.attrs?.meta as string | null) ?? null,
        value: (node.content ?? []).map((child) => child.text ?? "").join(""),
      };
    case "horizontalRule":
      return { type: "thematicBreak" };
    case "table":
      return {
        type: "table",
        align: (node.attrs?.align as never) ?? null,
        children: (node.content ?? []).map(blockToMdast) as TableRow[],
      };
    case "tableRow":
      return { type: "tableRow", children: (node.content ?? []).map(blockToMdast) as TableCell[] };
    case "tableCell":
      return { type: "tableCell", children: inlineToMdast(node.content ?? []) };
    case "mdxBlock": {
      const attrs = (node.attrs ?? {}) as { name: string | null; attributes: MdxAttribute[] };
      return {
        type: "mdxJsxFlowElement",
        name: attrs.name,
        attributes: fromMdxAttributes(attrs.attributes),
        children: (node.content ?? []).map(blockToMdast),
      } as RootContent;
    }
    case "unknownBlock":
      return (node.attrs as { mdast: RootContent }).mdast;
    default:
      return { type: "paragraph", children: inlineToMdast(node.content ?? []) };
  }
}

export function pmToMdast(doc: PmNode): Root {
  return { type: "root", children: (doc.content ?? []).map(blockToMdast) };
}

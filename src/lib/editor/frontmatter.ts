import { Scalar, isMap, isScalar, isSeq, parseDocument, parse as parseYaml } from "yaml";
import type { Document, Node } from "yaml";

/**
 * Frontmatter is edited as a plain object but written back through the
 * original YAML text, so keys nobody touched keep their exact quoting, order
 * and line breaks instead of being reformatted on every save.
 */
export function parseFrontmatter(source: string): Record<string, unknown> {
  return (parseYaml(source) ?? {}) as Record<string, unknown>;
}

/**
 * Build the replacement node in the house style: strings double-quoted and
 * lists on one line, the way every post is already written. An existing node's
 * own style wins, so a key that was written differently stays that way.
 */
function styledNode(document: Document, previous: unknown, value: unknown): Node {
  const node = document.createNode(value);

  if (isSeq(node)) {
    node.flow = isSeq(previous) ? previous.flow : true;
    for (const item of node.items) {
      if (isScalar(item) && typeof item.value === "string") item.type = Scalar.QUOTE_DOUBLE;
    }
  } else if (isScalar(node) && typeof value === "string") {
    node.type = isScalar(previous) ? (previous.type ?? Scalar.QUOTE_DOUBLE) : Scalar.QUOTE_DOUBLE;
  }

  return node;
}

export function applyFrontmatter(source: string, values: Record<string, unknown>): string {
  const document = parseDocument(source);
  const current = parseFrontmatter(source);

  if (!isMap(document.contents)) return String(document);

  for (const key of Object.keys(current)) {
    if (!(key in values)) document.delete(key);
  }
  for (const [key, value] of Object.entries(values)) {
    if (JSON.stringify(current[key]) === JSON.stringify(value)) continue;
    document.set(key, styledNode(document, document.get(key, true), value));
  }

  // `lineWidth: 0` keeps long descriptions on one line; `flowCollectionPadding`
  // off matches how `tags: ["a", "b"]` is already written in every post.
  return document.toString({ lineWidth: 0, flowCollectionPadding: false }).replace(/\n$/, "");
}

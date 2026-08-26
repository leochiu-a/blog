import type { Root } from "mdast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import type { Handle, State } from "mdast-util-to-markdown";

/**
 * `>>` is this blog's pull-quote syntax — a blockquote whose only child is
 * another blockquote. `mdast-util-to-markdown` would write that back as
 * `> > text`, which renders the same but no longer matches how the posts are
 * written, so the outer level drops its space when it wraps a nested quote.
 */
const blockquote: Handle = (node, _parent, state: State, info) => {
  const nested = node.children.length === 1 && node.children[0]?.type === "blockquote";
  const exit = state.enter("blockquote");
  const tracker = state.createTracker(info);
  tracker.move(nested ? ">" : "> ");
  tracker.shift(nested ? 1 : 2);
  const value = state.indentLines(
    state.containerFlow(node, tracker.current()),
    (line, _index, blank) => ">" + (blank || nested ? "" : " ") + line,
  );
  exit();
  return value;
};

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMdx).use(remarkStringify, {
  bullet: "-",
  rule: "-",
  emphasis: "*",
  strong: "*",
  fences: true,
  handlers: { blockquote },
});

export function parseMarkdown(source: string): Root {
  return processor.parse(source) as Root;
}

export function stringifyMarkdown(tree: Root): string {
  return processor.stringify(tree);
}

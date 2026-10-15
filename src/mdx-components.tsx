import { Children, isValidElement } from "react";
import type { MDXComponents } from "mdx/types";
import { FancyQuote } from "@/components/mdx/FancyQuote";
import { Figure } from "@/components/mdx/Figure";
import { Clip } from "@/components/mdx/Clip";
import { LinkCard } from "@/components/mdx/LinkCard";
import { VideoEmbed } from "@/components/mdx/VideoEmbed";
import { OrnamentSeparator } from "@/components/mdx/OrnamentSeparator";

/**
 * `>` is an ordinary quote; `>>` is a pull quote.
 *
 * Nesting one blockquote inside another is the pull quote's markdown syntax, so
 * it stays plain text — any markdown editor live-previews it as a (nested)
 * quote instead of showing a bare JSX tag.
 */
function Blockquote({ children }: { children?: React.ReactNode }) {
  const items = Children.toArray(children).filter(
    (child) => typeof child !== "string" || child.trim() !== "",
  );
  const [first] = items;

  if (items.length === 1 && isValidElement(first) && first.type === Blockquote) {
    const inner = (first.props as { children?: React.ReactNode }).children;
    return <FancyQuote>{inner}</FancyQuote>;
  }

  return <blockquote>{children}</blockquote>;
}

/**
 * A table keeps its columns readable and scrolls sideways when it is wider than
 * the column, rather than squeezing each cell to a character or two per line.
 * The editor renders the same wrapper (see `Table` in lib/editor/extensions.ts).
 */
function Table(props: React.ComponentProps<"table">) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  );
}

/**
 * Required by @next/mdx App Router — Next.js calls this automatically to inject
 * global components into every MDX file. Not called directly in application code.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    hr: OrnamentSeparator,
    blockquote: Blockquote,
    table: Table,
    FancyQuote,
    Figure,
    Clip,
    VideoEmbed,
    LinkCard,
    ...components,
  };
}

import { Children, isValidElement } from "react";
import type { MDXComponents } from "mdx/types";
import { FancyQuote } from "@/components/mdx/FancyQuote";
import { Figure } from "@/components/mdx/Figure";
import { VideoEmbed } from "@/components/mdx/VideoEmbed";
import { Callout } from "@/components/mdx/Callout";
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
 * Required by @next/mdx App Router — Next.js calls this automatically to inject
 * global components into every MDX file. Not called directly in application code.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    hr: OrnamentSeparator,
    blockquote: Blockquote,
    FancyQuote,
    Figure,
    VideoEmbed,
    Callout,
    ...components,
  };
}

import type { MDXComponents } from "mdx/types";
import { PoemCard } from "@/components/mdx/PoemCard";
import { BookQuote } from "@/components/mdx/BookQuote";
import { FancyQuote } from "@/components/mdx/FancyQuote";
import { VideoEmbed } from "@/components/mdx/VideoEmbed";
import { Callout } from "@/components/mdx/Callout";
import { OrnamentSeparator } from "@/components/mdx/OrnamentSeparator";

/**
 * Required by @next/mdx App Router — Next.js calls this automatically to inject
 * global components into every MDX file. Not called directly in application code.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    hr: OrnamentSeparator,
    PoemCard,
    BookQuote,
    FancyQuote,
    VideoEmbed,
    Callout,
    ...components,
  };
}

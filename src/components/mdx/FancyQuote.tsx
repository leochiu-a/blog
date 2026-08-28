import { cn } from "@/lib/utils";
import { inlineContent } from "./inline-content";

interface FancyQuoteProps {
  children: React.ReactNode;
}

/**
 * Pull quote — written as a nested blockquote (`>>`) in a post.
 *
 * Sized off the same Substack measurements as the prose body (19px/1.6): 32px
 * at 1.4, centred, no rules. The contrast comes from scale and whitespace, the
 * way Substack does it, rather than from framing the quote in lines.
 */
export function FancyQuote({ children }: FancyQuoteProps) {
  return (
    <figure className="my-12 not-prose">
      <blockquote
        className={cn(
          "text-center font-spectral text-[1.625rem] leading-[1.4] text-foreground sm:text-[2rem]",
          inlineContent,
        )}
      >
        {children}
      </blockquote>
    </figure>
  );
}

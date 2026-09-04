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
 *
 * 24px on a phone. The desktop size is a ratio against a 728px column, and in
 * a 327px one it landed on exactly `h2`'s size — the loudest thing in the body
 * and the thing that divides the body, indistinguishable by scale.
 */
export function FancyQuote({ children }: FancyQuoteProps) {
  return (
    <figure className="my-12 not-prose">
      <blockquote
        className={cn(
          "text-center font-spectral text-2xl leading-[1.4] text-foreground sm:text-[2rem]",
          inlineContent,
        )}
      >
        {children}
      </blockquote>
    </figure>
  );
}

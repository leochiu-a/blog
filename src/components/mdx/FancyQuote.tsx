interface FancyQuoteProps {
  children: React.ReactNode;
}

export function FancyQuote({ children }: FancyQuoteProps) {
  return (
    <figure className="relative my-14 not-prose">
      <div className="mx-auto max-w-sm border-y border-gold/20 py-8">
        <blockquote className="text-center font-cormorant text-xl italic leading-relaxed text-foreground/90 sm:text-2xl">
          {children}
        </blockquote>
      </div>
    </figure>
  );
}

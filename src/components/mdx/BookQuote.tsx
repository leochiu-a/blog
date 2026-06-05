interface BookQuoteProps {
  speaker?: string;
  source?: string;
  children: React.ReactNode;
}

export function BookQuote({ speaker, source, children }: BookQuoteProps) {
  return (
    <figure className="group relative my-8 rounded-2xl bg-primary-foreground p-6 transition-all duration-300 not-prose">
      <div className="absolute left-0 top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-gold via-gold/60 to-bronze" />
      <div className="relative z-10 pl-4">
        <div className="mb-5 font-cormorant text-lg italic leading-relaxed text-foreground/90">
          {children}
        </div>
        {(speaker || source) && (
          <footer className="flex items-center justify-between border-t border-border/50 pt-4">
            <cite className="not-italic text-sm">
              {speaker && <span className="font-medium text-foreground">{speaker}</span>}
              {speaker && source && <span className="mx-2 text-gold/60">·</span>}
              {source && <span className="italic text-muted-foreground">{source}</span>}
            </cite>
          </footer>
        )}
      </div>
    </figure>
  );
}

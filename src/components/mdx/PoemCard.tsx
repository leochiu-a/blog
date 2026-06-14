interface PoemCardProps {
  title?: string;
  author?: string;
  translator?: string;
  source?: string;
  children: React.ReactNode;
}

export function PoemCard({ title, author, translator, source, children }: PoemCardProps) {
  return (
    <figure className="poem-page relative my-12 mx-auto max-w-lg not-prose">
      <div className="poem-paper relative rotate-[0.5deg] rounded-[2px] border border-[#e8e4da] bg-[#fffef9] p-8 dark:border-[#3d3b35] dark:bg-[#2f2e2a] sm:p-10">
        <div className="page-curl pointer-events-none absolute bottom-0 right-0 h-12 w-12 overflow-hidden">
          <div className="absolute bottom-0 right-0 h-[170%] w-[170%] origin-bottom-right translate-x-[30%] translate-y-[30%] rotate-45 bg-gradient-to-tl from-[#d4cfc2] via-[#ebe7dd] to-transparent dark:from-[#1a1917] dark:via-[#252420]" />
        </div>
        {title && (
          <h3 className="mb-6 ml-4 text-left font-cormorant text-lg italic tracking-wide text-[#5c5347] dark:text-[#c4b89e] sm:ml-6">
            {title}
          </h3>
        )}
        <div className="poem-body ml-4 font-alegreya text-base leading-normal text-[#3d3730] dark:text-[#d8d0c0] sm:ml-6">
          {children}
        </div>
        {(author || translator || source) && (
          <footer className="mt-12 space-y-1 text-center">
            {author && (
              <div className="font-cormorant text-sm text-[#6b6358] dark:text-[#a89e8a]">
                {author}
              </div>
            )}
            {translator && (
              <div className="font-sans text-xs tracking-wide text-[#8a8275] dark:text-[#7d7568]">
                translated by {translator}
              </div>
            )}
            {source && (
              <div className="font-sans text-xs italic text-[#9d958a] dark:text-[#6d675d]">
                {source}
              </div>
            )}
          </footer>
        )}
      </div>
    </figure>
  );
}

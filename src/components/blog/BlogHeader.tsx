/** Blog page header — same shell as the homepage nav but without the mode toggle. */
export function BlogHeader() {
  return (
    <header className="mb-12 flex w-full flex-wrap pb-3 text-sm sm:flex-nowrap">
      <nav className="relative mx-auto flex w-full items-center justify-between" aria-label="global">
        <div className="z-10 flex flex-1 items-center justify-start pb-8">
          <a
            href="/"
            className="flex-none font-garamond text-[1.25rem] font-medium transition-colors hover:text-gold"
            aria-label="Nav Menu Item"
          >
            Home
          </a>
        </div>
        <div className="z-10 flex flex-1 flex-row items-center justify-end gap-x-6 pb-8 sm:gap-x-8" />
      </nav>
    </header>
  );
}

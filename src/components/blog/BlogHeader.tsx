import Link from "next/link";

/** Blog page header — same shell as the homepage nav but without the mode toggle. */
export function BlogHeader() {
  return (
    <header className="mb-12 flex w-full flex-wrap pb-3 text-sm sm:flex-nowrap">
      <nav
        className="relative mx-auto flex w-full items-center justify-between"
        aria-label="global"
      >
        <div className="z-10 flex flex-1 items-center justify-start pb-8">
          <Link
            href="/"
            className="flex-none font-sans text-[1.25rem] font-semibold transition-colors hover:text-blog-accent"
            aria-label="Nav Menu Item"
          >
            Home
          </Link>
        </div>
        <div className="z-10 flex flex-1 flex-row items-center justify-end gap-x-6 pb-8 sm:gap-x-8">
          {/* Plain anchor: /feed.xml is a Route Handler that returns XML, not
              a navigable page, so next/link's client-side transition doesn't apply. */}
          {/* eslint-disable-next-line next/no-html-link-for-pages */}
          <a
            href="/feed.xml"
            className="font-sans text-sm text-muted-foreground transition-colors hover:text-blog-accent"
            aria-label="RSS feed"
          >
            RSS
          </a>
        </div>
      </nav>
    </header>
  );
}

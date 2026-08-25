export function Footer({ variant = "brand" }: { variant?: "brand" | "minimal" }) {
  const borderClass = variant === "minimal" ? "border-border" : "border-bronze/20";
  const textClass = variant === "minimal" ? "font-sans" : "font-garamond";

  return (
    <footer className="mx-auto mt-12 w-full">
      <div className={`border-t pt-6 ${borderClass}`}>
        <div className="flex flex-col items-center gap-y-3 sm:flex-row sm:items-center sm:justify-between sm:gap-y-0">
          <div className="flex gap-x-4 text-sm">
            <p className={`text-sm text-muted-foreground ${textClass}`}>© 2026 Leo Chiu</p>
          </div>
          {/* Plain anchor: /feed.xml is a Route Handler that returns XML, not
              a navigable page, so next/link's client-side transition doesn't apply. */}
          {/* eslint-disable-next-line next/no-html-link-for-pages */}
          <a
            href="/feed.xml"
            className={`text-sm text-muted-foreground transition-colors hover:text-gold ${textClass}`}
            aria-label="RSS feed"
          >
            RSS
          </a>
        </div>
      </div>
    </footer>
  );
}

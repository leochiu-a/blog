import { socialLinks } from "@/data/content";

export function Footer({ variant = "brand" }: { variant?: "brand" | "minimal" }) {
  const borderClass = variant === "minimal" ? "border-border" : "border-bronze/20";
  // Garamond's small x-height makes 14px read like 12px, so the brand variant
  // gets a step up; the minimal variant is sans, where 14px is right for fine print.
  const textClass = variant === "minimal" ? "font-sans text-sm" : "font-garamond text-base";
  const linkClass = `text-muted-foreground transition-colors hover:text-gold ${textClass}`;

  return (
    <footer className="mx-auto mt-12 w-full">
      <div className={`border-t pt-6 ${borderClass}`}>
        {/* Links come first in the DOM so the stacked mobile layout puts the
            navigation above the copyright fine print; row-reverse pulls the
            copyright back to the left edge on wider screens. */}
        <div className="flex flex-col items-center gap-y-3 sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-y-0">
          {/* Wraps on narrow screens: seven links don't fit one mobile row. */}
          <nav
            className="flex flex-wrap justify-center gap-x-4 gap-y-2"
            aria-label="Elsewhere on the web"
          >
            {socialLinks.map(({ label, href }) => (
              <a key={href} href={href} className={linkClass} rel="me noopener" target="_blank">
                {label}
              </a>
            ))}
            {/* Plain anchor: /feed.xml is a Route Handler that returns XML, not
                a navigable page, so next/link's client-side transition doesn't apply. */}
            {/* eslint-disable-next-line next/no-html-link-for-pages */}
            <a href="/feed.xml" className={linkClass} aria-label="RSS feed">
              RSS
            </a>
          </nav>
          <p className={`text-muted-foreground ${textClass}`}>© 2026 Leo Chiu</p>
        </div>
      </div>
    </footer>
  );
}

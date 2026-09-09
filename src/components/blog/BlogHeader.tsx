import { NavLink } from "@/components/NavLink";

/**
 * Blog page header — same shell as the homepage nav but without the mode
 * toggle.
 *
 * `children` land at the end of the row, for the odd page that has one control
 * of its own to put up here. The header itself stays unaware of what that is.
 */
export function BlogHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex w-full flex-wrap text-sm sm:flex-nowrap">
      <nav
        className="relative mx-auto flex w-full items-center justify-between"
        aria-label="global"
      >
        <div className="z-10 flex flex-1 items-center justify-start">
          <NavLink href="/">Home</NavLink>
        </div>
        {children}
      </nav>
    </header>
  );
}

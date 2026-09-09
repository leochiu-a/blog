import Link from "next/link";
import type { ReactNode } from "react";

/** Two-column section: left serif label (md:w-1/5) + content (md:w-2/3). Stacks below md. */
export function SectionRow({
  label,
  labelHref,
  aside,
  children,
}: {
  label: string;
  /**
   * Where the label leads, for a section the home page only summarises.
   *
   * The link sits inside the `h2` rather than around it, so the section keeps
   * its heading. "About" is weak anchor text, and deliberately so: every
   * post's byline already points at the same page under the author's name,
   * which is the anchor text that carries the entity — what the home page
   * needs from this one is a word a reader can find.
   */
  labelHref?: string;
  /** Rendered under the label, in the otherwise empty left column. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-y-5 md:flex-row md:gap-y-0">
      <div className="md:w-1/5">
        <h2 className="text-2xl font-semibold text-foreground">
          {labelHref ? (
            <Link href={labelHref} className="illuminated-link">
              {label}
            </Link>
          ) : (
            label
          )}
        </h2>
        {aside}
      </div>
      <div className="flex flex-col gap-y-3 md:w-2/3">{children}</div>
    </section>
  );
}

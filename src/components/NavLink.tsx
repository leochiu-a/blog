import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

/**
 * The link that opens a header — "Home" on the public site, "Editor" or
 * "Posts" behind a back arrow in the editor's own bar.
 *
 * One component for all of them, because the five headers on this site
 * otherwise agreed on nothing: the same word was set in garamond at 1.25rem on
 * a reading page and as a small sans ghost button in the editor, so moving
 * between the two read as leaving for a different site rather than opening a
 * tool on this one. The reading chrome wins the argument — it is the one a
 * reader sees — and the editor's bar keeps only what it needs to be a bar
 * (sticky, a rule under it, its own controls on the right).
 *
 * `font-garamond` is spelled out here rather than inherited because the editor
 * sets `font-sans` on the surface around it.
 *
 * Deliberately carries no `aria-label`: the text is already the accessible
 * name, and the label these headers used to pass ("Nav Menu Item") replaced it
 * with something a screen reader could do nothing with.
 *
 * Where it sits — and whether it is visible at all at a given width — is the
 * header's business, so every caller keeps its own wrapper.
 *
 * `back` draws the arrow that used to be a literal ← in each caller's label.
 * As an icon it can lean the way it points when the pointer or keyboard focus
 * arrives — a glyph sitting in the text run cannot move without taking the
 * word with it — which is the same treatment the forward links on the home
 * page get. It leans left because that is where the link goes.
 */
export function NavLink({
  href,
  back,
  children,
}: {
  href: string;
  back?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex-none inline-flex items-center gap-1.5 font-garamond text-[1.25rem] font-medium transition-colors hover:text-gold"
    >
      {back && (
        <ArrowLeftIcon
          aria-hidden
          className="size-5 transition-transform duration-200 ease-out group-hover:-translate-x-1 group-focus-visible:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0"
        />
      )}
      {children}
    </Link>
  );
}

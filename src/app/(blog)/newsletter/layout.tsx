import { DarkPageShell } from "@/components/blog/DarkPageShell";

/**
 * Every newsletter page reads dark — the subscribe page, the archive, and the
 * two pages a link in an email lands on — so nothing in the section crosses a
 * light/dark seam. The frame itself lives in `DarkPageShell`, because
 * `/privacy/` needs the same one from outside this route group.
 */
export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return <DarkPageShell>{children}</DarkPageShell>;
}

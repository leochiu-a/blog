import { DarkPageShell } from "@/components/blog/DarkPageShell";
import { DevSubscribersLink } from "@/components/newsletter/DevSubscribersLink";

/**
 * Every newsletter page reads dark — the subscribe page, the archive, and the
 * two pages a link in an email lands on — so nothing in the section crosses a
 * light/dark seam. The frame itself lives in `DarkPageShell`, because
 * `/privacy/` needs the same one from outside this route group.
 *
 * The header carries one control the reading pages don't: a dev-only way into
 * the subscriber dashboard. It sits in the layout rather than on the subscribe
 * page so it is there from the archive and from an Issue too — anywhere in the
 * section I might be when I want the number.
 */
export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return <DarkPageShell headerActions={<DevSubscribersLink />}>{children}</DarkPageShell>;
}

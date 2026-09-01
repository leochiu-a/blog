import { Footer } from "@/components/Footer";
import { BlogHeader } from "@/components/blog/BlogHeader";

/**
 * The dark reading frame: header, one measure-width column, minimal footer.
 *
 * It is a component rather than a layout because the pages that share it do not
 * share a route: the newsletter section gets it from its own layout, and
 * `/privacy/` sits outside that group but has to look like part of it — a link
 * from the subscribe form into the privacy page must not cross a light/dark
 * seam.
 *
 * `dark` sits on <main>, not <html>: this subtree has no root layout of its own
 * above `(blog)`, and `html:has(.dark)` in globals.css pulls the document
 * element into the same tokens. Same mechanism a professional post uses.
 */
export function DarkPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="dark flex min-h-screen w-full flex-col items-center px-6 pb-10 pt-7 font-garamond text-base leading-relaxed sm:px-10">
      {/* `flex-1` plus `mt-auto` on the footer is the sticky-footer idiom: the
          column grows to the full `min-h-screen`, and the free space collects
          above the footer instead of below it. Without it a short page — the
          subscribe page with no archive, a confirm landing — leaves the footer
          stranded in the middle of a tall viewport. */}
      <div className="flex w-full min-w-0 max-w-[45.5rem] flex-1 flex-col">
        <BlogHeader />
        {children}
        <div className="mt-auto">
          <Footer variant="minimal" />
        </div>
      </div>
    </main>
  );
}

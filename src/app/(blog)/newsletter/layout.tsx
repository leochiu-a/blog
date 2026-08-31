import { Footer } from "@/components/Footer";
import { BlogHeader } from "@/components/blog/BlogHeader";

/**
 * The shell every newsletter page shares.
 *
 * The section reads dark throughout — the subscribe page, the archive, and the
 * two pages a link in an email lands on. Keeping that here rather than on each
 * page means a reader clicking from the subscribe page into an Issue never
 * crosses a light/dark seam, and there is one copy of the frame instead of
 * four.
 *
 * `dark` sits on <main>, not <html>: this subtree has no root layout of its own
 * above `(blog)`, and `html:has(.dark)` in globals.css pulls the document
 * element into the same tokens. Same mechanism a professional post uses.
 */
export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="dark flex min-h-screen w-full flex-col items-center px-6 pb-10 pt-7 font-garamond text-base leading-relaxed sm:px-10">
      <div className="w-full min-w-0 max-w-[45.5rem]">
        <BlogHeader />
        {children}
        <Footer variant="minimal" />
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Mode, Post } from "@/types/content";
import { ThemeSync } from "@/components/ThemeSync";
import { ModeToggle } from "@/components/ModeToggle";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { PostsSection } from "@/components/PostsSection";
import { StuffSection } from "@/components/StuffSection";
import { Divider } from "@/components/Divider";
import { Footer } from "@/components/Footer";

interface PortfolioAppProps {
  mode: Mode;
  professionalPosts: Post[];
  personalPosts: Post[];
}

export function PortfolioApp({ mode, professionalPosts, personalPosts }: PortfolioAppProps) {
  return (
    <main className="flex min-h-screen w-full max-w-300 flex-col items-center px-6 pb-10 pt-7 font-garamond">
      <ThemeSync mode={mode} />
      <header className="mb-12 flex w-full flex-wrap pb-3 text-sm sm:flex-nowrap">
        {/* Below sm there isn't room for "Home" beside the toggle (the toggle
            alone is 320px) — and this *is* the home page, so the link is
            redundant there. Hide it and give the toggle the whole row. */}
        <nav
          className="relative mx-auto flex w-full items-center justify-between"
          aria-label="global"
        >
          <div className="z-10 hidden flex-1 items-center justify-start pb-8 sm:flex">
            <Link
              href="/"
              className="flex-none font-garamond text-[1.25rem] font-medium transition-colors hover:text-gold"
              aria-label="Nav Menu Item"
            >
              Home
            </Link>
          </div>
          <div className="z-0 flex w-full justify-center">
            <ModeToggle mode={mode} />
          </div>
          <div className="z-10 hidden flex-1 sm:flex" aria-hidden="true" />
        </nav>
      </header>

      {/* flex-1 lets this block absorb any leftover viewport height so the
          footer below it stays pinned to the bottom even on sparse pages
          (e.g. personal mode with no posts yet) instead of floating mid-page. */}
      <div className="flex w-full flex-1 flex-col gap-y-10">
        <Hero mode={mode} />
        <AboutSection mode={mode} />
        <Divider />
        <PostsSection posts={mode === "professional" ? professionalPosts : personalPosts} />
        {mode === "professional" && (
          <>
            <Divider />
            <StuffSection />
          </>
        )}
      </div>

      <Divider className="mt-20" />
      <Footer />
    </main>
  );
}

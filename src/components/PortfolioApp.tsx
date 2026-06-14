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
    <main className="flex min-h-screen w-screen max-w-[75rem] flex-col items-center px-6 pb-10 pt-7 font-garamond">
      <ThemeSync mode={mode} />
      <header className="mb-12 flex w-full flex-wrap pb-3 text-sm sm:flex-nowrap">
        <nav
          className="relative mx-auto flex w-full items-center justify-between"
          aria-label="global"
        >
          <div className="z-10 flex flex-1 items-center justify-start pb-8">
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
          <div className="z-10 flex flex-1 flex-row items-center justify-end gap-x-6 pb-8 sm:gap-x-8" />
        </nav>
      </header>

      <div className="flex w-full flex-col gap-y-10">
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

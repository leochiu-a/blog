"use client";

import { useState } from "react";
import Link from "next/link";
import type { Mode, Post } from "@/types/content";
import { ModeToggle } from "@/components/ModeToggle";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { PostsSection } from "@/components/PostsSection";
import { StuffSection } from "@/components/StuffSection";
import { Divider } from "@/components/Divider";
import { Footer } from "@/components/Footer";
import { otherMode, pathForMode, titleForMode } from "@/lib/mode-routes";

interface PortfolioAppProps {
  /** Whichever mode this route prerenders — `/` professional, `/personal/` personal. */
  initialMode: Mode;
  professionalPosts: Post[];
  personalPosts: Post[];
}

export function PortfolioApp({ initialMode, professionalPosts, personalPosts }: PortfolioAppProps) {
  const [mode, setMode] = useState<Mode>(initialMode);

  /**
   * Switching modes swaps state in place instead of navigating. The photo's
   * flip and the toggle's sliding indicator are CSS transitions, and those only
   * play while the same elements stay mounted — routing to the other page would
   * tear them down and the switch would land as a hard cut.
   *
   * The URL still has to name what's on screen, so it's rewritten with the
   * History API: no navigation, but a reload, a bookmark or a shared link
   * resolves to the route that prerenders exactly this view. Next.js reads
   * these calls back into its own router state (see
   * node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md,
   * "Shallow routing on the client").
   *
   * `replaceState`, not `pushState`: the two modes are one screen with a
   * cosmetic switch, so Back should leave the site rather than un-flip a photo.
   */
  const switchTo = (next: Mode) => {
    setMode(next);
    window.history.replaceState(null, "", pathForMode(next));
    // A shallow URL change doesn't re-run the route's metadata, so the tab
    // would keep naming the mode the visitor just left.
    document.title = titleForMode(next);
  };

  return (
    <main
      // Professional mode is the dark one. The class lands here rather than on
      // <html> so it can follow client-side state, with `html:has(.dark)` in
      // globals.css carrying the tokens up to the document element — the same
      // arrangement an article uses (see (blog)/layout.tsx).
      className={`flex min-h-screen w-full max-w-300 flex-col items-center px-6 pb-10 pt-7 font-garamond${
        mode === "professional" ? " dark" : ""
      }`}
    >
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
              href={pathForMode(mode)}
              className="flex-none font-garamond text-[1.25rem] font-medium transition-colors hover:text-gold"
              aria-label="Nav Menu Item"
            >
              Home
            </Link>
          </div>
          <div className="z-0 flex w-full justify-center">
            <ModeToggle mode={mode} onChange={switchTo} />
          </div>
          <div className="z-10 hidden flex-1 sm:flex" aria-hidden="true" />
        </nav>
      </header>

      {/* flex-1 lets this block absorb any leftover viewport height so the
          footer below it stays pinned to the bottom even on sparse pages
          (e.g. personal mode with no posts yet) instead of floating mid-page. */}
      <div className="flex w-full flex-1 flex-col gap-y-10">
        <Hero mode={mode} onFlip={() => switchTo(otherMode(mode))} />
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

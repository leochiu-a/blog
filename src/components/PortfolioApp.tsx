"use client";

import { useEffect, useState } from "react";
import type { Mode, Post } from "@/types/content";
import { ModeToggle } from "@/components/ModeToggle";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { PostsSection } from "@/components/PostsSection";
import { StuffSection } from "@/components/StuffSection";
import { Divider } from "@/components/Divider";
import { Footer } from "@/components/Footer";

interface PortfolioAppProps {
  professionalPosts: Post[];
  personalPosts: Post[];
}

export function PortfolioApp({ professionalPosts, personalPosts }: PortfolioAppProps) {
  const [mode, setMode] = useState<Mode>("professional");

  // Sync initial mode from ?mode= without causing hydration mismatch.
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    if (m === "personal" || m === "professional") setMode(m);
  }, []);

  // professional = dark theme, personal = light theme (matches blog).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "professional");
  }, [mode]);

  const changeMode = (m: Mode) => {
    setMode(m);
    const params = new URLSearchParams(window.location.search);
    params.set("mode", m);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };
  const toggleMode = () => changeMode(mode === "professional" ? "personal" : "professional");

  return (
    <main className="flex min-h-screen w-screen max-w-[75rem] flex-col items-center px-6 pb-10 pt-7 font-garamond">
      <header className="mb-12 flex w-full flex-wrap pb-3 text-sm sm:flex-nowrap">
        <nav className="relative mx-auto flex w-full items-center justify-between" aria-label="global">
          <div className="z-10 flex flex-1 items-center justify-start pb-8">
            <a
              href="/"
              className="flex-none font-garamond text-[1.25rem] font-medium transition-colors hover:text-gold"
              aria-label="Nav Menu Item"
            >
              Home
            </a>
          </div>
          <div className="z-0 flex w-full justify-center">
            <ModeToggle mode={mode} onChange={changeMode} />
          </div>
          <div className="z-10 flex flex-1 flex-row items-center justify-end gap-x-6 pb-8 sm:gap-x-8" />
        </nav>
      </header>

      <div className="flex w-full flex-col gap-y-10">
        <Hero mode={mode} onFlip={toggleMode} />
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

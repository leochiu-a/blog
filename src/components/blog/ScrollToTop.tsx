"use client";

import { useEffect, useState } from "react";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fixed back-to-top button; slides in after scrolling past ~400px. */
export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      aria-label="Back to Top"
      data-show={show}
      onClick={() =>
        window.scrollTo({
          top: 0,
          // A 4,000px smooth scroll is a long ride past every heading on the
          // page — the one piece of motion here that is worth removing outright
          // rather than shortening. Jumping lands the reader in the same place.
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        })
      }
      // The parked position stays a translate even under reduced motion: it is
      // what keeps an invisible button from sitting clickable over the corner.
      // Only the 300ms travel goes, so the button arrives without sliding 7rem.
      className="z-90 fixed bottom-8 end-4 flex cursor-pointer h-8 w-8 translate-y-28 items-center justify-center rounded-full border-2 border-transparent bg-background text-3xl text-foreground opacity-0 shadow-md transition-all duration-300 motion-reduce:transition-none hover:border-border/75 data-[show=true]:translate-y-0 data-[show=true]:opacity-100 sm:end-8 sm:h-12 sm:w-12"
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";

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
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="z-90 fixed bottom-8 end-4 flex h-8 w-8 translate-y-28 items-center justify-center rounded-full border-2 border-transparent bg-background text-3xl text-foreground opacity-0 shadow-md transition-all duration-300 hover:border-border/75 data-[show=true]:translate-y-0 data-[show=true]:opacity-100 sm:end-8 sm:h-12 sm:w-12"
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

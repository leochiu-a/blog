"use client";

import { useEffect, useState } from "react";

/**
 * Whether the element `selector` names has scrolled entirely off the top of the
 * window — the moment its content stops being on screen to read.
 *
 * An IntersectionObserver rather than a scroll listener: the answer only
 * changes when the element crosses the window's edge, which is exactly when the
 * observer fires, so nothing runs on the frames in between. Leaving through the
 * *bottom* also stops it intersecting, which is why the side it left by is
 * checked rather than taking "not visible" as "scrolled past".
 */
export function useScrolledPast(selector: string): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const element = document.querySelector(selector);
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [selector]);

  return past;
}

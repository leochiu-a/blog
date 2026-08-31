"use client";

import { useEffect, useRef } from "react";

interface ClipProps {
  src: string;
  /** First frame, saved alongside the clip at upload time. */
  poster: string;
  /** Intrinsic pixel size of the clip — keeps the layout from shifting as it loads. */
  width: number;
  height: number;
  /** Shown under the clip. Omit for a bare clip. */
  caption?: string;
}

/**
 * A short screen recording, played the way an animated GIF would be: muted,
 * looping, starting on its own.
 *
 * Nothing is fetched until the clip is actually on screen (`preload="none"`,
 * plus an observer that only calls `play()` once it scrolls into view), so a
 * post carrying three of them still paints from the posters alone. The poster
 * is a WebP the editor cut from frame one, which is what makes it safe to leave
 * the video itself unfetched — there is always something to look at.
 *
 * Controls are always there: a clip loops indefinitely, and WCAG 2.2.2 wants
 * anything that moves on its own for more than five seconds to be stoppable.
 * Touch them once and the observer stops taking the clip back off you — pausing
 * something that resumed itself on the next scroll would be no pause at all.
 *
 * Under `prefers-reduced-motion` nothing autoplays at all; the clip sits on its
 * poster until someone presses play.
 */
export function Clip({ src, poster, width, height, caption }: ClipProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const handled = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          el.pause();
          return;
        }
        // Autoplay can still be refused; the poster underneath is the fallback.
        if (!handled.current) void el.play().catch(() => {});
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className="my-6 not-prose">
      {/* width/height rather than a CSS aspect box: the intrinsic ratio comes
          from the file itself, so the slot is the right shape before any of the
          video is fetched. */}
      <video
        ref={ref}
        src={src}
        poster={poster}
        width={width}
        height={height}
        muted
        loop
        playsInline
        preload="none"
        controls
        onPointerDown={() => {
          handled.current = true;
        }}
        className="mx-auto h-auto w-full rounded-sm"
      />
      {caption && (
        <figcaption className="mt-3 text-center font-sans text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * The card's media slot. `image` always renders; `video` — when a project has
 * one — layers on top and only starts fetching once `active` goes true, so six
 * cards worth of demo reels never land on first paint.
 *
 * The clip plays once and rests on its last frame instead of looping. These are
 * walkthroughs with an end state worth reading, and a loop would have to get
 * back to the start somehow — every version of that is a jump cut.
 *
 * `active` is owned by the card, not here, so hovering anywhere on the card
 * starts the reel. Under `prefers-reduced-motion` nothing is ever played, so
 * the video never loads, `ready` stays false, and the poster is all there is.
 */
export function ProjectMedia({
  image,
  video,
  title,
  active,
}: {
  image: string;
  video?: string;
  title: string;
  active: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !video) return;

    if (!active) {
      // Left where it is — rewinding now would show the clip snapping back to
      // the start behind the fade-out. The next activation rewinds instead.
      el.pause();
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Always from the top: the poster is frame one, so the fade in has nothing
    // to reveal. Resuming mid-clip would cut straight to the middle.
    if (el.readyState > 0) el.currentTime = 0;
    // Autoplay can still be refused; the poster underneath is the fallback.
    void el.play().catch(() => {});
  }, [active, video]);

  return (
    // 75/41 is the CodeReel reel's own aspect. A GitHub OG image (1.90:1) loses
    // a few percent off its generous side margins here, which is the cheaper
    // trade: at 2:1 the reel lost its title bar to object-cover instead.
    <div className="relative aspect-75/41 w-full overflow-hidden rounded-t-md">
      {/* Two cards to a row inside the section's md:w-2/3 column, capped by the
          page's max-w-300 — so the card stops growing at 376px. */}
      <Image
        src={image}
        alt=""
        fill
        sizes="(min-width: 1200px) 376px, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover"
      />
      {video && (
        <video
          ref={ref}
          src={video}
          muted
          playsInline
          preload="none"
          aria-label={`${title} demo`}
          onLoadedData={() => setReady(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
            active && ready ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

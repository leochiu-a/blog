"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Repeated under the enlarged image, so the context survives the zoom. */
  caption?: string;
  /** Passed through from Figure — the one above-the-fold image loads eagerly. */
  hero?: boolean;
}

/**
 * A post image that opens full-screen when clicked.
 *
 * In the column an image is capped well below its intrinsic size — a phone
 * screenshot lands around 285px wide — which is enough to follow the prose but
 * not to read the UI being discussed. Clicking lifts it out onto a dimmed
 * backdrop at up to its full resolution.
 *
 * Base UI's Dialog carries the parts that are easy to get wrong by hand: Escape
 * to close, focus trapped then restored to the thumbnail, the page behind
 * locked and hidden from screen readers.
 *
 * The enlarged image mounts only once opened. Every post image would otherwise
 * ship a second, larger fetch that most readers never look at.
 */
export function ZoomableImage({ src, alt, width, height, caption, hero }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/*
        A height ceiling expressed as a width: 70svh of height on this aspect
        ratio is worth this many svh of width. A landscape shot yields a cap far
        wider than any column, so `w-full` wins and it spans the text; a portrait
        phone screenshot yields a narrow one and centres itself rather than
        towering over the prose.

        Two nearby approaches that do not work. Sizing off the intrinsic width
        (`w-auto`) lays every image out at exactly the `sizes` value — with a
        srcset the browser reports the intrinsic width as `sizes`, not as the
        file's pixels — so images come out narrower than a column that is not
        42rem. And `object-contain` inside a column-wide box scales the picture
        correctly but leaves `rounded-sm` clipping the box's empty corners while
        the picture's own corners stay square.

        The cap sits on the trigger rather than the image so the focus ring
        traces the picture instead of a column-wide box around a narrow one.
      */}
      <Dialog.Trigger
        style={{ maxWidth: `${((70 * width) / height).toFixed(2)}svh` }}
        className="mx-auto block w-full cursor-zoom-in rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={hero ? "eager" : undefined}
          fetchPriority={hero ? "high" : undefined}
          sizes="(min-width: 768px) 42rem, 100vw"
          className="h-auto w-full rounded-sm"
        />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-background/95 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup className="fixed inset-0 z-50 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <Dialog.Title className="sr-only">{caption || alt || "放大的圖片"}</Dialog.Title>

          {/*
            The whole surface closes, the way it does on Substack — a reader who
            has finished with the image clicks anywhere rather than hunting for
            the X. Rendered as a div because it wraps the image: a button around
            an image is fine, but the explicit close button below has to sit on
            top of this layer, and nesting one button inside another is not.
            Keyboard users reach that button, and Escape, instead.
          */}
          <Dialog.Close
            render={<div />}
            tabIndex={-1}
            className="flex h-full w-full cursor-zoom-out flex-col items-center justify-center gap-4 p-4 sm:p-8"
          >
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              sizes="100vw"
              // Fills the free space and letterboxes itself inside it, rather than
              // sizing to the bitmap: `w-auto`/`h-auto` on a replaced element takes
              // the loaded resource's intrinsic size, which srcset can hand back at
              // a fraction of the real file and leave the "enlarged" copy smaller
              // than the thumbnail it came from.
              // Never past the real pixel count, or a small image gets blown up
              // into mush by a large screen.
              style={{ maxWidth: width, maxHeight: height }}
              className="min-h-0 w-full flex-1 object-contain"
            />
            {caption && (
              <figcaption className="max-w-prose text-center font-sans text-sm text-muted-foreground">
                {caption}
              </figcaption>
            )}
          </Dialog.Close>

          <Dialog.Close className="absolute end-4 top-4 cursor-pointer rounded-md p-2 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            <XIcon className="size-5" />
            <span className="sr-only">關閉</span>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import Image from "next/image";

interface FigureProps {
  src: string;
  alt: string;
  /** Intrinsic pixel size of the source file — keeps the layout from shifting as it loads. */
  width: number;
  height: number;
  /** Shown under the image. Omit for a bare image. */
  caption?: string;
  /**
   * Set on the one image above the fold — a post's hero.
   *
   * Next lazy-loads images by default, so the hero is only discovered after
   * layout. It is the LCP element on every post, and measured on the live site
   * it spent 373ms of a 775ms LCP waiting to even be requested. Loading it
   * eagerly at high priority lets the preload scanner start the fetch straight
   * from the initial HTML.
   *
   * `loading`/`fetchPriority` rather than `preload` (or the `priority` prop it
   * replaced, deprecated in Next 16): the Image docs call for exactly this pair
   * for an LCP image, and say not to combine `preload` with `fetchPriority`.
   *
   * Never set it on more than one image per page — competing high-priority
   * fetches defeat the point.
   */
  hero?: boolean;
}

/**
 * An image with an optional caption.
 *
 * Markdown's `![alt](src)` has nowhere to put a caption and ends up wrapped in
 * a `<p>`, so captioned images get this component instead — it emits the
 * `<figure><img><figcaption>` structure that both screen readers and Medium's
 * importer expect.
 */
export function Figure({ src, alt, width, height, caption, hero }: FigureProps) {
  return (
    <figure className="my-6 not-prose">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={hero ? "eager" : undefined}
        fetchPriority={hero ? "high" : undefined}
        sizes="(min-width: 768px) 42rem, 100vw"
        // Intrinsic size capped on both axes rather than stretched to the column:
        // a portrait phone screenshot filling 42rem of width is unreadably huge,
        // so the height ceiling reins it in while landscape shots still fill the column.
        className="mx-auto h-auto max-h-[70svh] w-auto max-w-full rounded-sm"
      />
      {caption && (
        <figcaption className="mt-3 text-center font-sans text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

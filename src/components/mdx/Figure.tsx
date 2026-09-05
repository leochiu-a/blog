import { ZoomableImage } from "./ZoomableImage";

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
      <ZoomableImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        caption={caption}
        hero={hero}
      />
      {caption && (
        <figcaption className="mt-3 text-center font-sans text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

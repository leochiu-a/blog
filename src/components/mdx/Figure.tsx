import Image from "next/image";

interface FigureProps {
  src: string;
  alt: string;
  /** Intrinsic pixel size of the source file — keeps the layout from shifting as it loads. */
  width: number;
  height: number;
  /** Shown under the image. Omit for a bare image. */
  caption?: string;
}

/**
 * An image with an optional caption.
 *
 * Markdown's `![alt](src)` has nowhere to put a caption and ends up wrapped in
 * a `<p>`, so captioned images get this component instead — it emits the
 * `<figure><img><figcaption>` structure that both screen readers and Medium's
 * importer expect.
 */
export function Figure({ src, alt, width, height, caption }: FigureProps) {
  return (
    <figure className="my-6 not-prose">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 768px) 42rem, 100vw"
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

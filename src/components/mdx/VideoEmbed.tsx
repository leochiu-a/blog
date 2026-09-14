interface VideoEmbedProps {
  src: string;
  /**
   * What this video is, in a few words.
   *
   * An iframe's `title` is its accessible name: a screen reader can list every
   * frame on a page and jump between them, and this is the line it reads out.
   * Two embeds in one post both announcing "Embedded video" name neither of
   * them, which is why the fallback below is only a fallback.
   */
  title?: string;
  width?: number;
  height?: number;
}

export function VideoEmbed({ src, title, width = 640, height = 360 }: VideoEmbedProps) {
  return (
    <div className="mt-4">
      <iframe
        src={src}
        width={width}
        height={height}
        // An embed written before this attribute existed still has to announce
        // as something rather than as nothing.
        title={title || "Embedded video"}
        sandbox="allow-scripts allow-presentation"
        allowFullScreen
      />
    </div>
  );
}

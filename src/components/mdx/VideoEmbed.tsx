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
        // Span the column like a Figure does, so the player lines up with the
        // pictures around it; `width`/`height` only set the ratio. A player
        // capped at its pixel width sat flush left in a wider column.
        className="h-auto w-full rounded-sm"
        style={{ aspectRatio: `${width} / ${height}` }}
        // An embed written before this attribute existed still has to announce
        // as something rather than as nothing.
        title={title || "Embedded video"}
        // The player reads and writes storage on its own origin, and renders
        // nothing without `allow-same-origin`. Pairing it with `allow-scripts`
        // only lets a frame lift its own sandbox when it shares the page's
        // origin; a YouTube or Vimeo embed does not.
        // oxlint-disable-next-line react/iframe-missing-sandbox
        sandbox="allow-scripts allow-presentation allow-same-origin"
        allowFullScreen
      />
    </div>
  );
}

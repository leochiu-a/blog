"use client";

import { useState } from "react";

/**
 * The picture an MDX block stands for, drawn where the published page draws it
 * and captioned in place.
 *
 * Deliberately plain `<img>` and `<video>`: this preview never ships, and
 * next/image would demand configuration for paths that may not exist yet. A
 * clip you just uploaded has to be visible here, or a successful upload is
 * indistinguishable from one that silently did nothing — and nothing autoplays,
 * because nothing should be moving while you write.
 */
export function MediaPreview({
  kind,
  src,
  poster,
  alt,
  caption,
  offered,
  onCaptionChange,
  onSelect,
}: {
  kind: "Figure" | "Clip";
  src: string;
  poster: string;
  alt: string;
  caption: string;
  /** Whether the block is selected, and so should offer an empty caption line. */
  offered: boolean;
  onCaptionChange: (next: string) => void;
  /** Select the block: on a click, and again when the caption is finished with. */
  onSelect: () => void;
}) {
  return (
    <figure className="not-prose" contentEditable={false} role="presentation" onClick={onSelect}>
      {kind === "Figure" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="mx-auto h-auto max-h-[70svh] w-auto max-w-full rounded-sm"
        />
      ) : (
        <video
          src={src}
          poster={poster}
          controls
          muted
          preload="none"
          className="mx-auto h-auto w-full rounded-sm"
        />
      )}
      <CaptionField
        value={caption}
        offered={offered}
        onChange={onCaptionChange}
        onFinish={onSelect}
      />
    </figure>
  );
}

/**
 * The caption, written the way Medium writes it: the line under the picture
 * *is* the field, so clicking it puts the caret in the caption and typing
 * writes the attribute. A block with no caption offers the line while it is
 * selected and hides it otherwise, so at rest the preview is exactly the
 * published figure.
 */
function CaptionField({
  value,
  offered,
  onChange,
  onFinish,
}: {
  value: string;
  offered: boolean;
  onChange: (next: string) => void;
  onFinish: () => void;
}) {
  // Same reason as AttributeInput's: the attribute comes back a beat late and
  // would scramble the caret mid-sentence.
  const [draft, setDraft] = useState<string | null>(null);

  if (value === "" && !offered) return null;

  return (
    // The gap under the picture is the field's own padding rather than a
    // margin, so the whole strip is the target. At one line's height the band
    // was thinner than the text it holds: a click a few pixels high landed on
    // the figure, a few pixels low landed outside the block and took the
    // selection with it — and an empty caption line vanishes the moment that
    // happens.
    //
    // Almost all of that padding sits *above* the line, where it doubles as the
    // gap the published figure has anyway; below it there is only enough to
    // catch a click that undershoots, so the frame still closes on the caption
    // rather than on a band of empty space.
    <figcaption className="w-full text-center font-sans text-sm text-muted-foreground">
      <textarea
        rows={1}
        data-caption=""
        aria-label="圖說"
        placeholder="寫個圖說（可選）"
        value={draft ?? value}
        className="field-sizing-content block w-full cursor-text resize-none border-0 bg-transparent px-0 pb-1 pt-3 text-center outline-none placeholder:text-muted-foreground placeholder:opacity-60"
        // The figure selects the block on click and takes focus back to the
        // editor with it — which would empty the caption of the caret this
        // very click just put there.
        onClick={(event) => event.stopPropagation()}
        // `data-caption` is what keeps ProseMirror's hands off the pointer and
        // the keys in here; see DocumentEditor's `handleDOMEvents`.
        //
        // Leaving by keyboard hands the document back its caret; leaving by
        // clicking somewhere else does not, because that click has already
        // said where the caret goes.
        onKeyDown={(event) => {
          if (event.key !== "Escape" && !(event.key === "Enter" && !event.shiftKey)) return;
          event.preventDefault();
          setDraft(null);
          event.currentTarget.blur();
          onFinish();
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(event.target.value);
        }}
        onBlur={() => setDraft(null)}
      />
    </figcaption>
  );
}

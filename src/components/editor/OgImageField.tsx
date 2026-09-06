"use client";

import { useState } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

/**
 * The picture a post is shared with, shown at the shape it is shared at.
 *
 * A path typed into a text field is unverifiable until something else renders
 * it: you cannot tell a working path from a typo, a `.webp` from the `.jpg`
 * that is actually on disk, or a picture whose subject survives the 1.91:1 crop
 * from one that gets beheaded by it. So the field draws the crop — the ratio
 * Facebook, LinkedIn and X all cut to — rather than describing it.
 *
 * Empty is a real state with a real answer: the post falls back to the site
 * card, so that is what the preview shows, labelled as the fallback. A path
 * that loads nothing says so, because in this field a broken image and an empty
 * one must not look alike.
 */
export function OgImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [broken, setBroken] = useState(false);

  const src = value || DEFAULT_OG_IMAGE;

  return (
    <Field>
      <FieldLabel htmlFor="ogImage">ogImage</FieldLabel>
      <Input
        id="ogImage"
        value={value}
        placeholder="/blog-images/…"
        onChange={(event) => {
          setBroken(false);
          onChange(event.target.value);
        }}
      />

      {/* Plain `<img>` for the same reason the block previews use one: this
          never ships, and next/image would want configuring for a path that
          may not exist yet — which is exactly the path worth seeing fail. */}
      <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-md border border-input bg-muted/40">
        {broken ? (
          <p className="absolute inset-0 grid place-content-center px-4 text-center text-sm text-muted-foreground">
            找不到這張圖
          </p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className="size-full object-cover"
            onError={() => setBroken(true)}
          />
        )}
      </div>

      <FieldDescription>
        {value ? "分享到社群時的卡片圖，會裁成這個比例。" : "留空就用站上的預設卡片。"}
      </FieldDescription>
    </Field>
  );
}

"use client";

import { useState } from "react";
import { Demo } from "./Demo";

const AREAS = [
  "top left",
  "top",
  "top right",
  "left",
  "center",
  "right",
  "bottom left",
  "bottom",
  "bottom right",
] as const;

type Area = (typeof AREAS)[number];

/**
 * The 3×3 grid `position-area` is named after, as something to click.
 *
 * The picker is the grid itself, laid out the way the areas sit around the
 * anchor, so the button you press is where the box lands. The box is a plain
 * absolutely positioned element: no coordinates, no script measuring the anchor.
 */
export function PositionAreaDemo() {
  const [area, setArea] = useState<Area>("top");

  return (
    <Demo className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <fieldset className="grid grid-cols-3 gap-1 justify-self-center">
        <legend className="sr-only">position-area</legend>
        {AREAS.map((a) => (
          <label
            key={a}
            className="size-9 rounded border border-border hover:bg-muted has-checked:bg-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
          >
            <input
              type="radio"
              name="position-area"
              aria-label={a}
              checked={area === a}
              onChange={() => setArea(a)}
              className="sr-only"
            />
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-3">
        <div className="relative h-52 overflow-hidden rounded-md border border-dashed border-border">
          <div
            style={{ anchorName: "--area-anchor" } as React.CSSProperties}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-muted px-3 py-2 text-muted-foreground"
          >
            anchor
          </div>
          <div
            style={{ positionAnchor: "--area-anchor", positionArea: area } as React.CSSProperties}
            className="absolute w-fit rounded bg-foreground px-2.5 py-1.5 text-background"
          >
            box
          </div>
        </div>
        <code className="text-muted-foreground">position-area: {area};</code>
      </div>
    </Demo>
  );
}

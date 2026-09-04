import Link from "next/link";

/* A 404 that gets stolen: a saucer drifts in from the right, drops a tractor
   beam over the number, draws the message up into itself a piece at a time,
   leaves with it — and the message grows back out of the empty page as the ship
   goes. One 10s CSS timeline drives every part (see `.ufo-*` in globals.css).

   It plays once and stops. Looping was tempting (a reader arriving mid-flight
   would still catch the whole trick) but this file's own reduced-motion note
   argues the other way: what a page has no business doing is motion nobody
   asked for and nobody can stop, and this is the page whose only job is to let
   someone leave. Once through, it is a joke that lands and then gets out of the
   way; on a loop it is wallpaper.

   Each digit and each word is its own element because the beam has to take
   them one at a time. Lifting the number as a single block reads as text
   disappearing; lifting `4`, then `0`, then `4` reads as something pulling
   them. Where each piece is pulled to, which way it tumbles and when it goes
   all live in globals.css as `:nth-child` custom properties, next to the rest
   of the timeline, rather than as inline styles here.

   The dust specks live inside the beam element so they inherit its opacity:
   debris is only ever visible while there is a beam to carry it, and the
   beam's `clip-path` funnels the specks into the cone for free.

   The ship is line art and the beam is a faint wash — see the note on the
   `<svg>` below.

   The "Go home" link sits outside the stage on purpose. It is the one thing on
   this page that has to be there when the reader looks, so nothing in the
   animation is allowed to take it away. And because every visible piece of the
   message spends part of the loop mid-abduction, the stage is `aria-hidden`
   with a plain copy of the same text below it. */
const NUMBER = ["4", "0", "4"];
const DUST = [1, 2, 3, 4, 5, 6, 7, 8];
const COPY = ["This", "page", "has", "been", "abducted."];

export function UfoAbduction() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="ufo-stage" aria-hidden="true">
        {/* The beam is a sibling of the craft, not a child of it: the craft is
            above the message so a piece drawn up to the hull is swallowed by
            it, and a beam inside the craft inherits that and washes the message
            out from in front. Out here it paints under the text — cone behind,
            crisp glyphs on top — and it travels with the ship by running the
            same `ufo-flight`; see `.ufo-beam`. */}
        <div className="ufo-beam">
          <div className="ufo-beam-cone" />
          {DUST.map((n) => (
            <span key={n} className="ufo-dust" />
          ))}
        </div>

        <div className="ufo-craft">
          <svg className="ufo-saucer" viewBox="0 0 220 96" role="presentation">
            {/* Line art, in bronze, at the weight of the site's own borders and
                rules — this page sits in a serif, near-white site whose whole
                vocabulary is thin lines, so a flat-filled cartoon ship was the
                one loud object on it.

                Drawn in the order it has to be drawn, because strokes cannot
                occlude: antenna, then dome, then the hull *over* the dome's
                base. Unfilled, this reads as a wire hoop with a croissant
                balanced on it — you see the disc's far rim straight through the
                ship and the beam runs up over the hull instead of out from under
                it. A lens (two arcs meeting at points) instead of the ellipse
                reads as a leaf and leaves no room for the dome.

                Kept at 220×96 with the hull's middle on y=55: the beam's offset
                and every piece's measured pull target are in those terms, so
                the geometry is not free to drift. */}
            <g stroke="hsl(var(--bronze))" strokeWidth="2" strokeLinecap="round">
              <path d="M110 18 V9" fill="none" />
              <circle cx="110" cy="6" r="3" fill="hsl(var(--bronze))" />
              {/* Dome: an arc whose feet end below the hull's top edge, so the
                  hull covers them and it reads as seated rather than balanced.
                  Its apex clears that edge by ~21 units — any shallower and the
                  ship is a disc with a pimple. The radius is exactly half the
                  chord (34 across 76→144) because that is the only ratio that
                  gives the full half-circle: a radius *larger* than half the
                  chord makes SVG pick a shallower slice of a bigger circle,
                  which is what flattened this to a bump twice over. */}
              <path d="M76 52 A34 34 0 0 1 144 52" fill="none" />
              {/* The hull, and the one filled shape in the drawing: the fill is
                  the page colour, so it hides the dome's feet, the disc's own
                  far rim where the dome sits, and the top of the beam — which is
                  how the beam comes out from *under* the ship. */}
              <ellipse cx="110" cy="55" rx="96" ry="17" fill="var(--background)" />
            </g>
            {/* Windows, on the disc's near face below the centre line. */}
            <g fill="hsl(var(--bronze))">
              <circle cx="76" cy="61" r="3.2" />
              <circle cx="99" cy="63" r="3.2" />
              <circle cx="121" cy="63" r="3.2" />
              <circle cx="144" cy="61" r="3.2" />
            </g>
          </svg>
        </div>

        <p className="ufo-loot ufo-loot-number font-garamond">
          {NUMBER.map((digit, i) => (
            <span key={`${digit}-${i}`} className="ufo-glyph">
              {digit}
            </span>
          ))}
        </p>
        <p className="ufo-loot ufo-loot-copy font-garamond">
          {COPY.map((word) => (
            <span key={word} className="ufo-glyph">
              {word}
            </span>
          ))}
        </p>
      </div>

      <p className="sr-only">404 — this page has been abducted.</p>

      <Link
        href="/"
        className="ufo-home cursor-pointer rounded-full border border-bronze px-5 py-2 font-garamond text-lg text-foreground transition-colors hover:bg-gold/20"
      >
        Go home
      </Link>
    </div>
  );
}

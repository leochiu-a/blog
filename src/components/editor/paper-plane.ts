/**
 * The send: the article behind the dialog lifts off the page as a sheet of
 * paper, is folded into a paper plane the way a dart is folded by hand, and
 * flies off into the distance.
 *
 * The paper is paperlab's: a real mesh in WebGL, folded by its `fold`
 * deformer, lit by its lighting rig. The article is printed on it as a
 * texture — snapDOM takes a picture of the page as it is on screen. An
 * earlier version folded copies of the article's DOM with CSS 3D; it took
 * hundreds of composited layers to do what one canvas does, the creases were
 * painted gradients rather than light on a bend, and Chrome flickered under
 * the load.
 *
 * This module is the light half, loaded with the editor: it measures the
 * page, takes the picture and hides the dialog. The scene — three.js,
 * paperlab — is loaded only when a send starts.
 *
 * The article is whichever element carries `data-letter`; the editor marks its
 * column.
 */

import { snapdom } from "@zumer/snapdom";

// A sheet of paper's proportions, the ones a dart is folded from: A4's √2.
const SHEET_RATIO = Math.SQRT2;

const motionAllowed = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Where the sheet is on screen, in CSS pixels, and the article printed on it. */
export type Sheet = { left: number; top: number; width: number; height: number; image: string };

/**
 * The sheet: the article's whole column with a margin of page either side, as
 * tall as paper of that width is, or as the article is if it ends sooner —
 * paper past the last line would fold up blank. It starts at the top of the
 * article, title and all, unless the article has scrolled further than a sheet
 * is tall, when it moves down with it so that it still covers the screen.
 */
async function takeSheet(article: HTMLElement): Promise<Sheet> {
  const column = article.getBoundingClientRect();
  const pad = 24;
  const left = Math.max(column.left - pad, 0);
  const width = Math.min(column.width + pad * 2, window.innerWidth - left);
  const tall = width * SHEET_RATIO;
  const top = Math.max(column.top - pad, Math.min(0, window.innerHeight - tall));
  const height = Math.max(Math.min(tall, column.bottom + pad - top), width * 0.6);

  // The page's own background: the theme is set on an ancestor of the
  // article (`.dark` sits on the editor's wrapper, not on <html>).
  let background = "transparent";
  for (let at: Element | null = article; at; at = at.parentElement) {
    const color = getComputedStyle(at).backgroundColor;
    if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") {
      background = color;
      break;
    }
  }

  // Sharp enough to read once it has shrunk, and no sharper: the texture is
  // uploaded to the GPU whole.
  const scale = Math.min(window.devicePixelRatio, 2);
  const picture = await snapdom.toCanvas(article, { backgroundColor: background, scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d")!;
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    picture,
    (column.left - left) * scale,
    (column.top - top) * scale,
    column.width * scale,
    (picture.height / picture.width) * column.width * scale,
  );
  return { left, top, width, height, image: canvas.toDataURL("image/jpeg", 0.92) };
}

/**
 * Hides `popup`, folds the article into a paper plane and throws it off the top
 * right of the screen. Resolves once the plane is gone; `popup` stays hidden
 * until `land` is called.
 *
 * Without WebGL, with reduced motion asked for, or with no article on the
 * page, nothing moves and it resolves at once.
 */
export async function flyAway(popup: HTMLElement): Promise<void> {
  const article = document.querySelector<HTMLElement>("[data-letter]");
  if (!motionAllowed() || article === null || typeof popup.animate !== "function") return;

  const [sheet, { fly, supported }] = await Promise.all([
    takeSheet(article),
    import("./PaperPlaneFlight"),
  ]);
  if (!supported()) return;

  // The dialog steps aside as the paper comes up — not before, or the page
  // would show bare between the two.
  await fly(sheet, () =>
    popup.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 240,
      easing: "ease-out",
      fill: "forwards",
    }),
  );
}

/** Brings back what `flyAway` hid. */
export function land(popup: HTMLElement) {
  if (typeof popup.animate !== "function") return;
  popup.getAnimations().forEach((animation) => animation.cancel());
  popup.animate(
    [
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1 },
    ],
    { duration: 220, easing: "ease-out" },
  );
}

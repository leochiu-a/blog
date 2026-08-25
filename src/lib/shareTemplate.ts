/** Client-only canvas renderer for the "share to Story" template — a
 * 1080×1920 portrait card carrying the post title, subtitle, and URL, styled
 * to match the site's warm cream/gold palette (see globals.css tokens). */

const WIDTH = 1080;
const HEIGHT = 1920;
const MARGIN = 90;

// Hex equivalents of the site's HSL tokens (--background/--foreground/--gold/
// --bronze in the light theme) — canvas needs concrete colors, not CSS vars.
const INK = "#2b2b2b";
const MUTED = "#7a7a7a";
const GOLD = "#c9973f";

export interface StoryTemplateData {
  title: string;
  subtitle?: string;
  date?: string;
  url: string;
}

/** Draws the template and resolves a PNG blob ready for `navigator.share`. */
export async function generateStoryImage(data: StoryTemplateData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, "#fbf8f3");
  bg.addColorStop(1, "#f3ead9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawRule(ctx, 140);

  ctx.fillStyle = GOLD;
  ctx.textAlign = "center";
  ctx.font = "600 32px Georgia, 'Times New Roman', serif";
  ctx.fillText("L E O   C H I U", WIDTH / 2, 100);

  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  const titleSize = data.title.length > 40 ? 62 : 76;
  ctx.font = `700 ${titleSize}px Georgia, 'Times New Roman', serif`;
  const titleLines = wrapText(ctx, data.title, WIDTH - MARGIN * 2);
  const titleLineHeight = titleSize * 1.25;
  let y = HEIGHT * 0.38;
  for (const line of titleLines) {
    ctx.fillText(line, MARGIN, y);
    y += titleLineHeight;
  }

  if (data.subtitle) {
    ctx.fillStyle = MUTED;
    ctx.font = "400 36px Georgia, serif";
    const subLines = wrapText(ctx, data.subtitle, WIDTH - MARGIN * 2).slice(0, 3);
    y += 16;
    for (const line of subLines) {
      ctx.fillText(line, MARGIN, y);
      y += 48;
    }
  }

  drawRule(ctx, HEIGHT - 220);

  ctx.fillStyle = MUTED;
  ctx.font = "400 32px Georgia, serif";
  ctx.fillText(data.url.replace(/^https?:\/\//, ""), MARGIN, HEIGHT - 155);

  if (data.date) {
    ctx.fillStyle = GOLD;
    ctx.font = "400 28px Georgia, serif";
    ctx.fillText(data.date, MARGIN, HEIGHT - 108);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

function drawRule(ctx: CanvasRenderingContext2D, y: number) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(WIDTH - MARGIN, y);
  ctx.stroke();
  ctx.restore();
}

// CJK text has no spaces to break on, so tokenize as: one CJK character, or a
// run of whitespace, or a run of everything else (a Latin "word"). Wrapping
// then breaks between tokens — char-by-char for CJK, word-by-word for Latin.
const CJK_CHAR = /[㐀-䶿一-鿿豈-﫿]/u;
const TOKEN_RE = new RegExp(`${CJK_CHAR.source}|\\s+|\\S+`, "gu");

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const tokens = text.match(TOKEN_RE) ?? [];
  const lines: string[] = [];
  let current = "";
  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      if (current) current += " ";
      continue;
    }
    const candidate = current + token;
    if (current.trim() && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current.trimEnd());
      current = token;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) lines.push(current.trimEnd());
  return lines;
}

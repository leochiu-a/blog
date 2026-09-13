import { EB_Garamond, Inter, Spectral } from "next/font/google";

// EB Garamond and Inter are variable fonts (weight optional). Spectral is not,
// so explicit weights are required.
//
// Only Spectral declares an italic: next/font preloads every face it declares,
// and the article body is the one place a post can turn italic (the editor's
// Italic button). Nothing writes into the Garamond or Inter contexts, so those
// stay upright rather than preloading a face that can never render.
export const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
});

// UI/heading sans for the blog reading view (Substack-style: sans headings and
// chrome over a serif body).
// `--font-inter` and not `--font-sans`: the theme layer builds the real
// `--font-sans` on top of this one, appending the CJK fallback next/font's
// Latin subset cannot supply. Declaring both under one name would put
// next/font's value on <html> and Tailwind's in `:root` — a specificity tie
// next/font wins, silently dropping the fallback.
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Article body serif for the blog reading view — same typeface Substack ships
// (Spectral), paired with the Inter headings/chrome above. 400 (body), 500
// (links) and 600 (`strong`) are the only weights the prose rules ask for.
export const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const fontVariables = `${garamond.variable} ${inter.variable} ${spectral.variable}`;

import { EB_Garamond, Cormorant_Garamond, Inter, Spectral } from "next/font/google";

// EB Garamond and Inter are variable fonts (weight optional). Cormorant
// Garamond and Spectral are not, so explicit weights are required.
export const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

// 400 (PostsSection), 500 (the mode toggle) and 600 (`font-semibold`, every
// heading on the home page) are the only weights anything asks for — 300 and
// 700 were four more faces nothing rendered.
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// UI/heading sans for the blog reading view (Substack-style: sans headings and
// chrome over a serif body).
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Article body serif for the blog reading view — same typeface Substack ships
// (Spectral), paired with the Inter headings/chrome above.
export const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const fontVariables = `${garamond.variable} ${cormorant.variable} ${inter.variable} ${spectral.variable}`;

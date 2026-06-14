import { EB_Garamond, Cormorant_Garamond, Newsreader, Alegreya } from "next/font/google";

// EB Garamond, Newsreader, and Alegreya are variable fonts (weight optional).
// Cormorant Garamond is not, so explicit weights are required.
export const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const alegreya = Alegreya({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-alegreya",
  display: "swap",
});

export const fontVariables = `${garamond.variable} ${cormorant.variable} ${newsreader.variable} ${alegreya.variable}`;

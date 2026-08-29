import { profile } from "@/data/content";
import type { Mode } from "@/types/content";

/**
 * Each mode is a real, prerendered route rather than a query string, so both
 * sides of the homepage are crawlable and rankable on their own.
 *
 * The route metadata and the client-side toggle both read from here: switching
 * modes rewrites the URL and the title in place (see PortfolioApp), and those
 * have to land on exactly what the other route prerenders.
 */
export function pathForMode(mode: Mode): string {
  return mode === "personal" ? "/personal/" : "/";
}

export function titleForMode(mode: Mode): string {
  return `${mode === "personal" ? "Personal" : "Home"} • ${profile.name}`;
}

export function otherMode(mode: Mode): Mode {
  return mode === "professional" ? "personal" : "professional";
}

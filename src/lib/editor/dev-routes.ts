/**
 * The editor exists only while `next dev` is running.
 *
 * Its routes are named `page.dev.tsx` / `route.dev.ts`, and those extensions
 * are registered with Next.js only in development. A production build never
 * resolves them as routes, so neither the editor pages nor its file APIs exist
 * in the deployed app — no runtime flag to get wrong, nothing to strip.
 */
const BASE_EXTENSIONS = ["js", "jsx", "md", "mdx", "ts", "tsx"];
const DEV_EXTENSIONS = ["dev.ts", "dev.tsx"];

export function pageExtensionsFor(nodeEnv: string | undefined): string[] {
  return nodeEnv === "development" ? [...DEV_EXTENSIONS, ...BASE_EXTENSIONS] : BASE_EXTENSIONS;
}

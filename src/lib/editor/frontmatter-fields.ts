import { REQUIRED_KEYS } from "@/lib/post-frontmatter";

/**
 * Frontmatter as the file actually holds it — YAML the editor didn't write can
 * contain anything — with typed access on top, so call sites stop casting.
 */
export type FrontmatterValues = Record<string, unknown>;

export function readText(frontmatter: FrontmatterValues, key: string): string {
  const value = frontmatter[key];
  return typeof value === "string" ? value : "";
}

export function readList(frontmatter: FrontmatterValues, key: string): string[] {
  const value = frontmatter[key];
  return Array.isArray(value) ? (value as string[]) : [];
}

export function readFlag(frontmatter: FrontmatterValues, key: string): boolean {
  return frontmatter[key] === true;
}

export function withField(
  frontmatter: FrontmatterValues,
  key: string,
  value: unknown,
): FrontmatterValues {
  return { ...frontmatter, [key]: value };
}

/**
 * Remove a field — except a required one, which is blanked instead.
 *
 * Dropping `datetime` or `readTime` stops the post compiling, and an editor
 * that does it the moment you clear an input is an editor that breaks the
 * build behind your back. Emptying is visible; deleting isn't.
 */
export function without(frontmatter: FrontmatterValues, key: string): FrontmatterValues {
  if (REQUIRED_KEYS.includes(key)) return { ...frontmatter, [key]: "" };

  const { [key]: _removed, ...rest } = frontmatter;
  return rest;
}

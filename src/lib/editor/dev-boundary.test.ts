import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const APP_DIR = join(process.cwd(), "src/app");

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** `page.dev.tsx` and friends only exist under `next dev`; everything else ships. */
const shipped = filesUnder(APP_DIR).filter((path) => !path.includes(".dev."));

const importsOf = (path: string) =>
  [...readFileSync(path, "utf8").matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]!);

describe("the production route tree", () => {
  it("has routes to check", () => {
    expect(shipped.length).toBeGreaterThan(3);
  });

  /**
   * M8 rests on the editor being unreachable from anything that ships. The
   * `pageExtensions` gate keeps its own routes out of the build, but nothing
   * stops a shipped page from importing the editor by hand — and that import
   * would drag Tiptap into the production bundle without failing any build.
   */
  it.each(shipped.map((path) => relative(process.cwd(), path)))(
    "%s does not reach into the editor",
    (path) => {
      const reachesEditor = importsOf(join(process.cwd(), path)).filter(
        (specifier) =>
          specifier.startsWith("@/components/editor") || specifier.startsWith("@/lib/editor"),
      );

      expect(reachesEditor).toEqual([]);
    },
  );
});

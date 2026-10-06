import { lazy, type ComponentType, type ReactElement } from "react";

/**
 * Every interactive demo a post can use, by component name.
 *
 * Found by file name rather than listed by hand, so a new demo is picked up
 * without being registered here. The convention it leans on is the one every
 * demo already follows: `FooDemo.tsx` exports `FooDemo`. `Demo.tsx` matches
 * too, and is left out: it is the frame they all sit in, not a demo.
 *
 * Globbed from this directory because Turbopack's `import.meta.glob` matches
 * nothing for a pattern that climbs out with `../`.
 *
 * Lazy, so a page loads only the demos it draws.
 */
const modules = import.meta.glob("./*Demo.tsx");

const demos = new Map<string, () => ReactElement>(
  Object.entries(modules).flatMap(([path, load]) => {
    const name = path.slice(path.lastIndexOf("/") + 1, -".tsx".length);
    if (name === "Demo") return [];
    const Demo = lazy(async () => ({
      default: ((await load()) as Record<string, ComponentType>)[name]!,
    }));
    return [[name, () => <Demo />] as const];
  }),
);

/** The demo by its component name, as an element, or `undefined` if there is none. */
export function demoElement(name: string): ReactElement | undefined {
  return demos.get(name)?.();
}

export function isDemo(name: string): boolean {
  return demos.has(name);
}

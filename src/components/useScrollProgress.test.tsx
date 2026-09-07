// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import type { TocSection } from "./TocRail";
import { useScrollProgress } from "./useScrollProgress";

/** A section in the scale the hook measures in: scrolled document pixels. */
const section = (key: string, start: number, end: number): TocSection => ({
  key,
  text: key,
  start,
  end,
});

/**
 * The hook draws nothing of its own, so these tests drive it through the
 * smallest component that uses it the way its two consumers do: hand over a
 * `measure`, read back the sections, and keep the `remeasure` it returns.
 *
 * `renders` grows by one for every render the hook causes, which is what the
 * cost of a stray state change looks like from outside.
 */
function mount(measure: () => TocSection[]) {
  const renders: ReturnType<typeof useScrollProgress>[] = [];

  function Harness() {
    renders.push(useScrollProgress(measure));
    return null;
  }

  render(<Harness />);
  return { renders, remeasure: () => renders.at(-1)!.remeasure() };
}

/**
 * Mount, and let the first scroll position land before the test starts
 * counting. The hook reads the scroll on mount and defers that to a frame, so
 * a render for it is owed to every caller and is nobody's regression.
 */
async function settled(measure: () => TocSection[]) {
  const mounted = mount(measure);
  await frame();
  return mounted;
}

/** Reach the frame a deferred measurement lands on. */
async function frame() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

/** Whether the window is wide enough for the rail the hook feeds. */
let wide = true;

beforeEach(() => {
  wide = true;
  // happy-dom has neither of these, and the hook needs both to mount.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: () => ({
      get matches() {
        return wide;
      },
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useScrollProgress", () => {
  it("leaves the rail alone when a re-measure finds the document unchanged", async () => {
    // Every late layout shift on the page re-measures — an image landing, a
    // font swapping, the address bar collapsing — and almost none of them move
    // a heading. Re-rendering the rail for each would be paying to redraw the
    // same bar.
    const measure = vi.fn(() => [section("a", 0, 100), section("b", 100, 400)]);
    const { renders, remeasure } = await settled(measure);
    const before = renders.length;

    remeasure();
    await frame();

    expect(measure.mock.calls.length).toBeGreaterThan(1);
    expect(renders).toHaveLength(before);
  });

  it("takes the new shape when a heading has actually moved", async () => {
    // The other half of the same claim: skipping unchanged measurements is only
    // safe if a changed one still gets through. An image above the fold has
    // just loaded, and every section below it is 200px further down the page.
    let shifted = false;
    const { renders, remeasure } = await settled(() =>
      shifted ? [section("a", 200, 300)] : [section("a", 0, 100)],
    );

    shifted = true;
    remeasure();
    await frame();

    expect(renders.at(-1)!.sections).toEqual([section("a", 200, 300)]);
  });

  it("measures at most once a frame, however often it is asked", async () => {
    // The editor asks on every keystroke, and measuring reads the geometry of
    // every heading — which forces the browser to lay the page out again,
    // synchronously, in the middle of typing.
    const measure = vi.fn(() => [section("a", 0, 100)]);
    const { remeasure } = await settled(measure);
    measure.mockClear();

    remeasure();
    remeasure();
    remeasure();
    await frame();

    expect(measure).toHaveBeenCalledTimes(1);
  });

  it("measures nothing at all on a window with no gutter for the rail", async () => {
    // The editor asks on every keystroke, and asking walks the whole document
    // to place every heading. Below the breakpoint there is no rail to draw
    // from the answer, so the question is not worth putting — and this is the
    // one hot path where the gate was still letting it through.
    wide = false;
    const measure = vi.fn(() => [section("a", 0, 100)]);
    const { remeasure } = mount(measure);

    remeasure();
    await frame();

    expect(measure).not.toHaveBeenCalled();
  });

  it("still measures on mount without waiting for a frame", async () => {
    // The rail is drawn from the first render on a page whose headings are
    // already in place. Deferring that measurement would cost a frame of empty
    // gutter on every page load to save work only the editor is asking for.
    const { renders } = mount(() => [section("a", 0, 100)]);

    expect(renders.at(-1)!.sections).toEqual([section("a", 0, 100)]);
  });
});

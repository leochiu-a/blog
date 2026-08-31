// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Clip } from "./Clip";

/**
 * The two things `Clip` reads from the browser, neither of which happy-dom has:
 * an IntersectionObserver, and the reduced-motion query. Standing in for both
 * lets a test say "the clip has just scrolled into view" directly, which is the
 * only input its playback has.
 */
let scrollInto: ((intersecting: boolean) => void) | null = null;

function stubEnvironment({ reduceMotion = false } = {}) {
  class StubObserver {
    constructor(private callback: IntersectionObserverCallback) {
      scrollInto = (intersecting: boolean) => {
        // Only the field the component reads; a real entry's ratios and rects
        // would be invented numbers standing in for a layout no test here has.
        const entry = { isIntersecting: intersecting } as IntersectionObserverEntry;
        act(() => {
          this.callback([entry], this as unknown as IntersectionObserver);
        });
      };
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: StubObserver,
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({ matches: reduceMotion && query.includes("reduce") }),
  });
}

/** happy-dom's `<video>` has no playback engine, so play/pause are spies. */
function renderClip() {
  const play = vi.fn(() => Promise.resolve());
  const pause = vi.fn();
  Object.defineProperty(HTMLMediaElement.prototype, "play", { writable: true, value: play });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", { writable: true, value: pause });

  const { container } = render(
    <Clip
      src="/blog-videos/demo.mp4"
      poster="/blog-images/demo-poster.webp"
      width={1280}
      height={800}
    />,
  );
  const video = container.querySelector("video");
  if (!video) throw new Error("no video rendered");
  return { video, play, pause };
}

beforeEach(() => {
  scrollInto = null;
  stubEnvironment();
});

afterEach(cleanup);

describe("Clip", () => {
  it("starts playing once it scrolls into view", () => {
    const { play } = renderClip();

    scrollInto!(true);

    expect(play).toHaveBeenCalled();
  });

  it("pauses when it leaves the viewport", () => {
    const { pause } = renderClip();

    scrollInto!(true);
    scrollInto!(false);

    expect(pause).toHaveBeenCalled();
  });

  it("stops taking the clip back once the reader has used the controls", async () => {
    const { video, play } = renderClip();

    scrollInto!(true);
    await userEvent.pointer({ target: video, keys: "[MouseLeft]" });
    play.mockClear();

    scrollInto!(false);
    scrollInto!(true);

    expect(play).not.toHaveBeenCalled();
  });

  it("never autoplays under prefers-reduced-motion", () => {
    stubEnvironment({ reduceMotion: true });
    const { play } = renderClip();

    // Nothing is even observed, so there is no way for the clip to start.
    expect(scrollInto).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("carries the intrinsic size, so the slot is the right shape before it loads", () => {
    const { video } = renderClip();

    expect(video.getAttribute("width")).toBe("1280");
    expect(video.getAttribute("height")).toBe("800");
    expect(video.getAttribute("poster")).toBe("/blog-images/demo-poster.webp");
    expect(video.getAttribute("preload")).toBe("none");
  });
});

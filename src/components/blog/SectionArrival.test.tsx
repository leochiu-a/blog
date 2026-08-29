// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { SectionArrival } from "./SectionArrival";

/**
 * The component reads the article out of the live DOM, so these tests build
 * one: headings carrying the ids a fragment would name, exactly as the server
 * sends them.
 */
function plantHeadings(...ids: string[]) {
  const article = document.createElement("div");
  article.className = "prose";
  for (const id of ids) {
    const heading = document.createElement("h2");
    heading.id = id;
    heading.textContent = id;
    article.appendChild(heading);
  }
  document.body.appendChild(article);
}

/**
 * Every scroll the component asks for, in order, with what it passed.
 *
 * The argument is the assertion, not decoration. Bare `scrollIntoView()` is
 * what leaves the landing offset to the heading's own `scroll-margin-top`; the
 * plausible-looking `scrollIntoView({ block: "center" })` overrides it and
 * drops the reader somewhere else entirely. A stub that only counted the calls
 * would let exactly that change through green.
 */
function recordScrolls() {
  const scrolls: Array<{ id: string; options?: boolean | ScrollIntoViewOptions }> = [];
  for (const heading of document.querySelectorAll<HTMLElement>(".prose h2")) {
    heading.scrollIntoView = (options?: boolean | ScrollIntoViewOptions) => {
      scrolls.push({ id: heading.id, options });
    };
  }
  return scrolls;
}

/**
 * Follow a fragment the way a link would, and wait for it to be heard.
 *
 * happy-dom dispatches `hashchange` on a timer rather than on assignment, so a
 * test that asserted straight after setting the hash would be reading the DOM
 * before the component had been told anything — and would leave the event
 * pending, to land in whichever test ran next.
 */
async function followFragment(id: string) {
  await act(async () => {
    window.location.hash = id;
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/**
 * Every write of `history.scrollRestoration`, if any.
 *
 * Reading the value back would not answer the question: happy-dom flips it to
 * `"manual"` by itself whenever the hash changes, so the property says nothing
 * about who set it. The decision here is that this component writes it at all
 * — leaving a reload to the browser's own restoration, which is the only
 * mechanism that positions the page before the first paint rather than after.
 */
function recordRestorationWrites() {
  const writes: string[] = [];
  const inherited = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(history),
    "scrollRestoration",
  )!;
  Object.defineProperty(history, "scrollRestoration", {
    configurable: true,
    get: () => inherited.get!.call(history),
    set: (value: string) => {
      writes.push(value);
      inherited.set!.call(history, value);
    },
  });
  return writes;
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  window.location.hash = "";
  Reflect.deleteProperty(history, "scrollRestoration");
});

const arrived = (id: string) => document.getElementById(id)!.className.includes("heading-arrival");

describe("SectionArrival", () => {
  describe("marking where the reader landed", () => {
    it("marks the heading a #fragment already in the URL points at", () => {
      // Someone opening a link they were handed: already scrolled on arrival,
      // with no click and no hashchange for the component to hear.
      plantHeadings("one", "two");
      window.location.hash = "two";
      render(<SectionArrival />);

      expect(arrived("two")).toBe(true);
      expect(arrived("one")).toBe(false);
    });

    it("decodes a percent-encoded fragment, so CJK headings still match", () => {
      plantHeadings("前言");
      window.location.hash = encodeURIComponent("前言");
      render(<SectionArrival />);

      expect(arrived("前言")).toBe(true);
    });

    it("marks the section a later fragment names", async () => {
      plantHeadings("one", "two");
      render(<SectionArrival />);

      await followFragment("two");
      expect(arrived("two")).toBe(true);
    });
  });

  describe("leaving the landing to the browser", () => {
    it("never scrolls the page itself", () => {
      // The reload flash this avoids: anything scrolled from here happens after
      // the first paint, so the reader watches the post open at the top and
      // then jump. Native restoration lands them before anything is painted.
      plantHeadings("one", "two");
      window.location.hash = "two";
      const scrolls = recordScrolls();

      render(<SectionArrival />);
      expect(scrolls).toEqual([]);
    });

    it("leaves scroll restoration switched on", () => {
      // Turning it off is what opens a reload at the top in the first place.
      plantHeadings("one", "two");
      window.location.hash = "two";
      const writes = recordRestorationWrites();

      render(<SectionArrival />);
      expect(writes).toEqual([]);
    });

    it("still leaves both alone once a later fragment is followed", async () => {
      plantHeadings("one", "two");
      render(<SectionArrival />);
      const scrolls = recordScrolls();
      const writes = recordRestorationWrites();

      await followFragment("two");
      expect(scrolls).toEqual([]);
      expect(writes).toEqual([]);
    });
  });
});

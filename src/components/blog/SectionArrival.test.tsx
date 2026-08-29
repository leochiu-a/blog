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

/** Where the page sits when the component mounts — the browser's turn, already taken. */
function pageIsAt(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, writable: true, configurable: true });
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  window.location.hash = "";
  history.scrollRestoration = "auto";
  pageIsAt(0);
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

  describe("landing on the section", () => {
    it("scrolls to the named section when the browser left the page at the top", () => {
      plantHeadings("one", "two");
      window.location.hash = "two";
      const scrolls = recordScrolls();

      render(<SectionArrival />);
      expect(scrolls).toEqual([{ id: "two", options: undefined }]);
    });

    it("lands on a CJK section, whose fragment arrives percent-encoded", () => {
      // The ids here are the heading text, so every section of a Chinese post
      // reaches the browser escaped — the landing has to survive that, not just
      // the arrival mark.
      plantHeadings("小結");
      window.location.hash = encodeURIComponent("小結");
      const scrolls = recordScrolls();

      render(<SectionArrival />);
      expect(scrolls).toEqual([{ id: "小結", options: undefined }]);
    });

    it("leaves a page that is not at the top alone", () => {
      // Either the browser landed the reader itself, or they have started
      // reading before this mounted. Scrolling into either is an interruption.
      plantHeadings("one", "two");
      window.location.hash = "two";
      pageIsAt(1200);
      const scrolls = recordScrolls();

      render(<SectionArrival />);
      expect(scrolls).toEqual([]);
    });

    it("scrolls nowhere on a plain post URL", () => {
      plantHeadings("one", "two");
      const scrolls = recordScrolls();

      render(<SectionArrival />);
      expect(scrolls).toEqual([]);
    });

    it("leaves a fragment followed later to the browser, which scrolls to it", async () => {
      plantHeadings("one", "two");
      render(<SectionArrival />);
      const scrolls = recordScrolls();

      await followFragment("two");
      expect(scrolls).toEqual([]);
    });
  });

  describe("deciding what a reload lands on", () => {
    it("hands a reload to the fragment when the URL names a section", () => {
      // Otherwise the reload restores the offset the reader had scrolled to and
      // never consults the fragment — a link to one section reopening at
      // another. `manual` is what drops that remembered offset.
      plantHeadings("one", "two");
      window.location.hash = "two";
      render(<SectionArrival />);

      expect(history.scrollRestoration).toBe("manual");
    });

    it("leaves a plain post URL restoring, so a reader keeps their place", () => {
      plantHeadings("one", "two");
      render(<SectionArrival />);

      expect(history.scrollRestoration).toBe("auto");
    });

    it("hands over again for a section reached later, on its own history entry", async () => {
      // Following a fragment writes a fresh entry, which starts out restoring
      // like any other — so the entry a reader would reload is not the one set
      // up on mount.
      plantHeadings("one", "two");
      render(<SectionArrival />);
      expect(history.scrollRestoration).toBe("auto");

      await followFragment("two");
      expect(history.scrollRestoration).toBe("manual");
    });
  });
});

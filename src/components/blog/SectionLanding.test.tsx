// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { LANDING_SCRIPT } from "./SectionLanding";

/**
 * The script as the browser gets it, run against a planted article.
 *
 * The source is executed rather than re-expressed: it ships as a string, so a
 * test that called an equivalent function would be checking a copy while the
 * page ran the original.
 */
function runLandingScript() {
  new Function(LANDING_SCRIPT)();
}

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
 * Every scroll the script asks for, with what it passed.
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

/** Where the page sits when the script runs — the browser's turn, already taken. */
function pageIsAt(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, writable: true, configurable: true });
}

afterEach(() => {
  document.body.innerHTML = "";
  window.location.hash = "";
  pageIsAt(0);
  // Last, and unconditionally: happy-dom flips this to `"manual"` by itself
  // whenever the hash changes, clearing it above included, so a test that
  // reset it any earlier would start the next one on the wrong footing.
  history.scrollRestoration = "auto";
});

describe("the section landing script", () => {
  it("scrolls to the section the fragment names", () => {
    plantHeadings("one", "two");
    window.location.hash = "two";
    const scrolls = recordScrolls();

    runLandingScript();
    expect(scrolls).toEqual([{ id: "two", options: undefined }]);
  });

  it("decodes a percent-encoded fragment, so a CJK section still matches", () => {
    // The ids here are the heading text, so every section of a Chinese post
    // reaches the browser escaped.
    plantHeadings("小結");
    window.location.hash = encodeURIComponent("小結");
    const scrolls = recordScrolls();

    runLandingScript();
    expect(scrolls).toEqual([{ id: "小結", options: undefined }]);
  });

  it("survives a fragment that is not valid escaping", () => {
    plantHeadings("100%");
    window.location.hash = "100%";
    const scrolls = recordScrolls();

    expect(() => runLandingScript()).not.toThrow();
    expect(scrolls).toEqual([{ id: "100%", options: undefined }]);
  });

  it("stops the entry restoring, so its next reload has nothing to prefer", () => {
    plantHeadings("one", "two");
    window.location.hash = "two";

    runLandingScript();
    expect(history.scrollRestoration).toBe("manual");
  });

  it("leaves a whole-post URL entirely alone", () => {
    plantHeadings("one", "two");
    const scrolls = recordScrolls();

    runLandingScript();
    expect(scrolls).toEqual([]);
    // Restoration is the best answer where there is no section to prefer: a
    // reader reloading mid-article should keep their place.
    expect(history.scrollRestoration).toBe("auto");
  });

  it("leaves a page that is not at the top where it is", () => {
    // Either the browser landed the reader itself, or they have started reading
    // during a slow load. Scrolling into either is an interruption.
    plantHeadings("one", "two");
    window.location.hash = "two";
    pageIsAt(1200);
    const scrolls = recordScrolls();

    runLandingScript();
    expect(scrolls).toEqual([]);
  });

  it("says nothing about a section this post does not have", () => {
    plantHeadings("one");
    window.location.hash = "missing";
    const scrolls = recordScrolls();

    expect(() => runLandingScript()).not.toThrow();
    expect(scrolls).toEqual([]);
  });
});

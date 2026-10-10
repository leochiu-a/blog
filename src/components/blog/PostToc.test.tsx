// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostToc } from "./PostToc";

/**
 * `PostToc` measures the article out of the live DOM, so these tests build one.
 *
 * The article is planted on `document.body` before rendering, exactly as it is
 * on a real post: the server sends `.prose` and the component measures it on
 * mount.
 *
 * happy-dom lays nothing out — every rect is zero — so each heading is given
 * the one it would have had. `top` is where the heading sits with the page
 * unscrolled, which is what the component converts to a document position.
 */
function plantArticle(
  headings: Array<{ level: 2 | 3; id?: string; text: string; top: number }>,
  articleEnd = 4000,
) {
  const article = document.createElement("div");
  article.className = "prose";
  stubRect(article, articleEnd);

  for (const { level, id, text, top } of headings) {
    const node = document.createElement(`h${level}`);
    if (id) node.id = id;
    node.textContent = text;
    stubRect(node, top);
    article.appendChild(node);
  }
  document.body.appendChild(article);
}

/** Only the two edges the component reads; the rest would be invented numbers. */
function stubRect(element: Element, top: number) {
  element.getBoundingClientRect = () => ({ top, bottom: top }) as DOMRect;
}

/** Put the reader `y` pixels down the page and let the rail catch up. */
async function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, writable: true, configurable: true });
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    // The listener defers its state change to the next frame, so the test has
    // to reach that frame before reading the rail.
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

/**
 * Whether the window is wide enough for the gutter the rail hangs in.
 *
 * The rail is a pointer-and-gutter thing, absent below `xl` rather than
 * restyled, so every test has to say which side of that it is on. Tests default
 * to a wide window, since that is where the rail is the feature.
 */
let wide = true;
/** What the component asked to watch, so a test can see it asked nothing. */
let observed: Element[] = [];
/** The component's own re-measure hook, for standing in as a layout shift. */
let layoutShifts: Array<() => void> = [];
const queryListeners = new Set<() => void>();

/** Resize across the breakpoint, as a reader dragging the window would. */
function resizeTo(value: boolean) {
  wide = value;
  for (const notify of [...queryListeners]) notify();
}

beforeEach(() => {
  wide = true;
  observed = [];
  layoutShifts = [];
  queryListeners.clear();

  // happy-dom has no ResizeObserver. The component uses it to re-measure after
  // late layout shifts; nothing here shifts, so recording the target is enough.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(onResize: () => void) {
        layoutShifts.push(onResize);
      }
      observe(target: Element) {
        observed.push(target);
      }
      unobserve() {}
      disconnect() {}
    },
  );
  // happy-dom answers width queries from a window size no test has set, so the
  // breakpoint is stubbed rather than inherited. Only width queries answer
  // `wide`; the reduced-motion check is a separate question and answers no.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return query.includes("min-width") ? wide : false;
      },
      addEventListener: (_: string, notify: () => void) => void queryListeners.add(notify),
      removeEventListener: (_: string, notify: () => void) => void queryListeners.delete(notify),
    }),
  });
  Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  window.location.hash = "";
});

const rail = () => screen.getByRole("navigation", { name: "目錄" });
const entries = () => screen.getAllByRole("link");
/** The bar's text, e.g. `▓▓░░ 13%` — the one readout of how far through the reader is. */
const readout = () =>
  [...rail().querySelectorAll("p")].find((line) => line.textContent?.endsWith("%"))!.textContent;
const current = () => entries().filter((e) => e.getAttribute("aria-current") === "location");
/** Whether the row holding a link is unfolded; closed rows are `invisible`. */
const unfolded = (link: HTMLElement) =>
  link.parentElement!.parentElement!.className.includes("visible grid-rows-[1fr]") &&
  !link.parentElement!.parentElement!.className.includes("invisible grid-rows-[1fr]");

const article = [
  { level: 2 as const, id: "one", text: "First section", top: 100 },
  { level: 3 as const, id: "one-a", text: "A subheading", top: 300 },
  { level: 2 as const, id: "two", text: "Second section", top: 600 },
];

describe("PostToc", () => {
  it("renders nothing when the article has no sections", () => {
    plantArticle([{ level: 3, text: "A subheading on its own", top: 100 }]);
    const { container } = render(<PostToc />);
    expect(container.firstChild).toBeNull();
  });

  it("ignores headings outside .prose, so the bio and read-more list stay out", () => {
    plantArticle([{ level: 2, id: "real", text: "In the article", top: 100 }]);
    const outside = document.createElement("h2");
    outside.id = "read-more";
    outside.textContent = "Read more";
    document.body.appendChild(outside);

    render(<PostToc />);
    expect(entries()).toHaveLength(1);
    expect(entries()[0]).toHaveProperty("hash", "#real");
  });

  it("skips headings that have no id, since there is nothing to link to", () => {
    plantArticle([
      { level: 2, id: "kept", text: "Linkable", top: 100 },
      { level: 2, text: "No id", top: 200 },
    ]);
    render(<PostToc />);
    expect(entries()).toHaveLength(1);
  });

  it("lists subheadings under the section above them", () => {
    plantArticle(article, 1100);
    render(<PostToc />);

    expect(entries().map((entry) => entry.textContent)).toEqual([
      "└First section",
      "└A subheading",
      "└Second section",
    ]);
  });

  describe("the current entry", () => {
    it("names nothing before the reader has reached a heading", () => {
      plantArticle(article, 1100);
      render(<PostToc />);
      expect(current()).toHaveLength(0);
    });

    it("follows the reader down, section and subheading alike", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);

      await scrollTo(100);
      expect(current().map((e) => e.getAttribute("href"))).toEqual(["#one"]);

      await scrollTo(300);
      expect(current().map((e) => e.getAttribute("href"))).toEqual(["#one-a"]);

      await scrollTo(600);
      expect(current().map((e) => e.getAttribute("href"))).toEqual(["#two"]);
    });

    it("unfolds a section's subheadings only while the reader is inside it", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);
      const sub = screen.getByRole("link", { name: /A subheading/ });

      expect(unfolded(sub)).toBe(false);

      await scrollTo(100);
      expect(unfolded(sub)).toBe(true);

      // Inside the subheading itself the section is still open.
      await scrollTo(300);
      expect(unfolded(sub)).toBe(true);

      await scrollTo(600);
      expect(unfolded(sub)).toBe(false);
    });
  });

  describe("the progress readout", () => {
    it("starts empty, climbs with the reader, and ends full at the article's end", async () => {
      // The article runs 100 to 1100 and the reading line sits 96px down.
      plantArticle(article, 1100);
      render(<PostToc />);
      expect(readout()).toBe("░░░░░░░░░░░░░░░░░░░░0%");

      await scrollTo(504);
      expect(readout()).toBe("▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░50%");

      await scrollTo(2000);
      expect(readout()).toBe("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓100%");
    });
  });

  it("tells the reader ↑ and ↓ scroll the page", () => {
    plantArticle(article, 1100);
    render(<PostToc />);
    expect(rail().textContent).toContain("PRESS ↑ / ↓ TO SCROLL");
  });

  it("leaves once the reader is past the article, before the foot of the page", async () => {
    // 1100 is where `.prose` ends; the subscribe box, the bio and the
    // read-more list come after it and are none of the tree's business.
    plantArticle(article, 1100);
    render(<PostToc />);
    expect(rail().className).not.toContain("opacity-0");

    await scrollTo(1100);
    expect(rail().className).toContain("opacity-0");
    expect(rail().className).toContain("pointer-events-none");

    // And comes back if the reader scrolls up into the writing again.
    await scrollTo(500);
    expect(rail().className).not.toContain("opacity-0");
  });

  describe("going to a section", () => {
    const heading = (id: string) => document.querySelector(`.prose #${id}`)!;
    const entry = (text: string) => screen.getByRole("link", { name: new RegExp(text) });

    it("links every entry by its own fragment", () => {
      plantArticle(
        [
          { level: 2, id: "前言", text: "前言", top: 100 },
          { level: 2, id: "收尾", text: "收尾", top: 600 },
        ],
        1100,
      );
      render(<PostToc />);

      expect(entries().map((a) => a.getAttribute("href"))).toEqual(["#前言", "#收尾"]);
    });

    it("glides to the section rather than jumping, and names it in the URL", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);
      const scrollIntoView = vi.fn();
      heading("two").scrollIntoView = scrollIntoView;

      await userEvent.click(entry("Second section"));

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
      expect(window.location.hash).toBe("#two");
    });

    it("marks the heading an entry points at when that entry is clicked", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);

      expect(heading("two").className).not.toContain("heading-arrival");
      await userEvent.click(entry("Second section"));
      expect(heading("two").className).toContain("heading-arrival");
    });

    it("marks it again on a second click, when the fragment has not changed", async () => {
      // `:target` cannot see this click: the URL it would key on is already what
      // the click asks for. A reader who has scrolled away and wants showing
      // back to their place clicks exactly here.
      plantArticle(article, 1100);
      render(<PostToc />);

      await userEvent.click(entry("First section"));
      heading("one").classList.remove("heading-arrival");

      await userEvent.click(entry("First section"));
      expect(heading("one").className).toContain("heading-arrival");
    });
  });

  describe("on a screen with no gutter to hang in", () => {
    it("measures nothing and watches nothing, since it has nothing to draw", () => {
      // The tree is hidden below `xl` by class, so a phone used to pay for all
      // of it anyway: a scroll listener, a state change every frame, and the
      // geometry of every heading read back.
      resizeTo(false);
      const listen = vi.spyOn(window, "addEventListener");
      plantArticle(article, 1100);

      const { container } = render(<PostToc />);

      expect(container.firstChild).toBeNull();
      expect(listen.mock.calls.map(([event]) => event)).not.toContain("scroll");
      expect(observed).toHaveLength(0);
    });

    it("still follows the page after the window has been narrowed and widened", async () => {
      // Re-measurements are held to one a frame, and tearing down mid-frame used
      // to leave that frame's slot occupied for good — so the tree came back on
      // the next resize and then never moved again.
      plantArticle(article, 1100);
      render(<PostToc />);

      layoutShifts.at(-1)!();
      await act(async () => resizeTo(false));
      await act(async () => resizeTo(true));

      // A code block has hydrated a thousand pixels taller, so the reader's
      // 504px position is now a quarter of the way through the article.
      stubRect(document.querySelector(".prose")!, 2100);
      await act(async () => {
        layoutShifts.at(-1)!();
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      await scrollTo(504);

      expect(readout()).toBe("▓▓▓▓▓░░░░░░░░░░░░░░░25%");
    });

    it("arrives if the window is widened into one", async () => {
      resizeTo(false);
      plantArticle(article, 1100);
      render(<PostToc />);
      expect(screen.queryByRole("navigation", { name: "目錄" })).toBeNull();

      await act(async () => resizeTo(true));

      expect(entries()).toHaveLength(3);
    });
  });

  it("stays off touch screens entirely, rather than folding into the page", () => {
    plantArticle(article);
    const { container } = render(<PostToc />);

    // No second, stacked copy of the contents for narrow screens: the tree is
    // the whole feature, and it is hidden below xl by class.
    expect(container.querySelector("details")).toBeNull();
    expect(container.querySelectorAll("nav")).toHaveLength(1);
    expect(rail().className).toContain("hidden");
    expect(rail().className).toContain("xl:block");
  });
});

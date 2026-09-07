// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
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
/** The row holding the two columns: labels on the left, the bar on the right. */
const columns = () => rail().lastElementChild!;
const labels = () => [...columns().firstElementChild!.children] as HTMLElement[];
/** One element per section, each holding its own fill. */
const track = () => [...columns().lastElementChild!.firstElementChild!.children] as HTMLElement[];
/**
 * How full a section's bar is, 0 to 1. The fill is a full-height element the
 * component squashes with `scaleY` rather than one it resizes, so that a scroll
 * frame costs the compositor a transform and not the page a re-flow.
 */
const fill = (i: number) => {
  const scaled = (track()[i].firstElementChild as HTMLElement).style.transform;
  return Number.parseFloat(scaled.replace(/[^\d.]/g, ""));
};
const entries = () => screen.getAllByRole("link");

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

  it("names sections and never subheadings", () => {
    plantArticle([
      { level: 2, id: "one", text: "First section", top: 100 },
      { level: 3, id: "one-a", text: "A subheading", top: 300 },
      { level: 2, id: "two", text: "Second section", top: 500 },
    ]);
    render(<PostToc />);

    expect(entries().map((entry) => entry.textContent)).toEqual([
      "First section",
      "Second section",
    ]);
  });

  describe("the bar", () => {
    /** 100px, 300px and 600px of article: an eighth, three eighths, a half. */
    const article = [
      { level: 2 as const, id: "a", text: "Short one", top: 100 },
      { level: 2 as const, id: "b", text: "Middling one", top: 200 },
      { level: 2 as const, id: "c", text: "Long one", top: 500 },
    ];

    it("gives each section a share of the bar proportional to its length", () => {
      plantArticle(article, 1100);
      render(<PostToc />);

      expect(track().map((segment) => segment.style.top)).toEqual(["0%", "10%", "40%"]);
      expect(track().map((segment) => segment.style.height)).toEqual([
        "calc(10% - 3px)",
        "calc(30% - 3px)",
        "calc(60% - 3px)",
      ]);
    });

    it("ends the last section at the article, not at the foot of the page", () => {
      // The subscribe box and the bio come after `.prose`. Counting them would
      // leave the bar short of full with the article finished.
      plantArticle(article, 1100);
      render(<PostToc />);

      const [, , last] = track();
      expect(last.style.top).toBe("40%");
      expect(last.style.height).toBe("calc(60% - 3px)");
    });

    it("fills nothing before the reader has reached the first section", () => {
      plantArticle(article, 1100);
      render(<PostToc />);

      expect(track().map((_, i) => fill(i))).toEqual([0, 0, 0]);
    });

    it("fills a section as the reader moves through it, and the ones behind it whole", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);

      // The reading line — 96px below the top of the viewport — is halfway
      // through the second section, which runs from 200 to 500.
      await scrollTo(254);

      expect(fill(0)).toBe(1);
      expect(fill(1)).toBe(0.5);
      expect(fill(2)).toBe(0);
    });

    it("fills to the end once the reader is past the article", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);

      await scrollTo(2000);
      expect(track().map((_, i) => fill(i))).toEqual([1, 1, 1]);
    });

    it("leaves once the reader is past the article, before the foot of the page", async () => {
      // 1100 is where `.prose` ends; the subscribe box, the bio and the
      // read-more list come after it and are none of the rail's business.
      plantArticle(article, 1100);
      render(<PostToc />);
      expect(rail().className).not.toContain("opacity-0");

      await scrollTo(1100);
      expect(rail().className).toContain("opacity-0");

      // And comes back if the reader scrolls up into the writing again.
      await scrollTo(500);
      expect(rail().className).not.toContain("opacity-0");
    });

    it("stops taking the pointer once it has left, so nothing invisible opens", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);
      // The hover pad is the only part of the rail that takes input.
      const pad = () => rail().children[1];
      expect(pad().className).toContain("pointer-events-auto");

      await scrollTo(1100);
      expect(pad().className).toContain("pointer-events-none");
    });

    it("stays hidden until something moves, then shows itself and settles back", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);
      const bar = () => columns().lastElementChild!.firstElementChild!;

      // Nothing has scrolled yet: a bar with no progress to report is a mark
      // on the page that has not earned its place.
      expect(bar().className).toContain("opacity-0");

      await scrollTo(300);
      expect(bar().className).toContain("opacity-100");

      // And fades out again once the reader settles.
      await waitFor(() => expect(bar().className).toContain("opacity-0"), { timeout: 3000 });
    });
  });

  describe("the labels", () => {
    const article = [
      { level: 2 as const, id: "one", text: "First section", top: 100 },
      { level: 2 as const, id: "two", text: "Second section", top: 600 },
    ];

    it("stands each label level with the section it names", () => {
      plantArticle(article, 1100);
      render(<PostToc />);

      // The second section starts halfway down a 1000px article, so its label
      // stands halfway down the rail.
      expect(labels().map((label) => label.style.top)).toEqual(["0%", "50%"]);
    });

    it("lights nothing before the reader has reached a section", () => {
      plantArticle(article, 1100);
      render(<PostToc />);
      expect(entries().filter((e) => e.className.includes("text-foreground"))).toHaveLength(0);
    });

    it("lights the section being read, and only that one", async () => {
      plantArticle(article, 1100);
      render(<PostToc />);

      await scrollTo(600);
      expect(entries().map((e) => e.className.includes("text-foreground"))).toEqual([false, true]);
    });

    it("keeps a section lit while the reader is inside its subheadings", async () => {
      plantArticle(
        [
          ...article.slice(0, 1),
          { level: 3, id: "one-a", text: "A subheading", top: 300 },
          ...article.slice(1),
        ],
        1100,
      );
      render(<PostToc />);

      // At the subheading, which has no section of its own — the section above
      // it is the one still being read.
      await scrollTo(300);
      expect(entries().map((e) => e.className.includes("text-foreground"))).toEqual([true, false]);
    });
  });

  describe("going to a section", () => {
    const article = [
      { level: 2 as const, id: "one", text: "First section", top: 100 },
      { level: 2 as const, id: "two", text: "Second section", top: 600 },
    ];
    const heading = (id: string) => document.querySelector(`.prose #${id}`)!;
    const entry = (text: string) => screen.getByRole("link", { name: text });

    it("links every section by its own fragment", () => {
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
      // The regression this guards: `:target` cannot see this click, because the
      // URL it would key on is already what the click asks for. A reader who has
      // scrolled away and wants showing back to their place clicks exactly here.
      plantArticle(article, 1100);
      render(<PostToc />);

      await userEvent.click(entry("First section"));
      // Stand in for the animation having been and gone: what matters is that
      // the class leaves and returns, since that is what restarts it.
      heading("one").classList.remove("heading-arrival");

      await userEvent.click(entry("First section"));
      expect(heading("one").className).toContain("heading-arrival");
    });
  });

  it("does not hold itself open after a click, once the pointer has gone", () => {
    // The regression this guards: an entry keeps focus after being clicked, and
    // a plain `:focus-within` on the rail read that as "still in use" — so the
    // labels stayed out over the article until the reader clicked elsewhere.
    plantArticle([
      { level: 2, id: "one", text: "First section", top: 100 },
      { level: 2, id: "two", text: "Second section", top: 600 },
    ]);
    render(<PostToc />);

    for (const entry of entries()) {
      expect(entry.className).not.toContain("group-focus-within:opacity-100");
      expect(entry.className).toContain("group-has-[:focus-visible]:opacity-100");
    }
  });

  describe("on a screen with no gutter to hang in", () => {
    const article = [
      { level: 2 as const, id: "one", text: "First section", top: 100 },
      { level: 2 as const, id: "two", text: "Second section", top: 600 },
    ];

    it("measures nothing and watches nothing, since it has nothing to draw", () => {
      // The rail is hidden below `xl` by class, so a phone used to pay for all
      // of it anyway: a scroll listener, a state change every frame, and the
      // geometry of every heading read back — to position a `display: none`
      // nav.
      resizeTo(false);
      const listen = vi.spyOn(window, "addEventListener");
      plantArticle(article, 1100);

      const { container } = render(<PostToc />);

      expect(container.firstChild).toBeNull();
      expect(listen.mock.calls.map(([event]) => event)).not.toContain("scroll");
      expect(observed).toHaveLength(0);
    });

    it("still follows the page after the window has been narrowed and widened", async () => {
      // The regression this guards: re-measurements are held to one a frame, and
      // tearing down mid-frame used to leave that frame's slot occupied for
      // good — so the rail came back on the next resize and then never moved
      // again, however far the page shifted under it.
      plantArticle(article, 1100);
      render(<PostToc />);

      layoutShifts.at(-1)!();
      await act(async () => resizeTo(false));
      await act(async () => resizeTo(true));

      // The second section starts halfway down the article as planted.
      expect(labels()[1].style.top).toBe("50%");

      // A code block in the last section has hydrated a thousand pixels taller,
      // so the same heading is now a quarter of the way down.
      stubRect(document.querySelector(".prose")!, 2100);
      await act(async () => {
        layoutShifts.at(-1)!();
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      expect(labels()[1].style.top).toBe("25%");
    });

    it("arrives if the window is widened into one", async () => {
      // Dragging a window past the breakpoint is the one case a mount-time
      // check gets wrong, and it gets it wrong until the reader reloads.
      resizeTo(false);
      plantArticle(article, 1100);
      render(<PostToc />);
      expect(screen.queryByRole("navigation", { name: "目錄" })).toBeNull();

      await act(async () => resizeTo(true));

      expect(entries()).toHaveLength(2);
    });
  });

  it("stays off touch screens entirely, rather than folding into the page", () => {
    plantArticle([
      { level: 2, id: "one", text: "First section", top: 100 },
      { level: 2, id: "two", text: "Second section", top: 600 },
    ]);
    const { container } = render(<PostToc />);

    // No second, stacked copy of the contents for narrow screens: the rail is
    // the whole feature, and it is hidden below xl by class.
    expect(container.querySelector("details")).toBeNull();
    expect(container.querySelectorAll("nav")).toHaveLength(1);
    expect(rail().className).toContain("hidden");
    expect(rail().className).toContain("xl:block");
  });
});

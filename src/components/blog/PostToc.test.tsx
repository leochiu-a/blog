// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostToc } from "./PostToc";

/**
 * `PostToc` reads the article out of the live DOM, so these tests build one.
 *
 * The article is planted on `document.body` before rendering, exactly as it is
 * on a real post: the server sends `.prose` and the component finds it on mount.
 */
function plantArticle(headings: Array<{ level: 2 | 3; id: string; text: string }>) {
  const article = document.createElement("div");
  article.className = "prose";
  for (const { level, id, text } of headings) {
    const node = document.createElement(`h${level}`);
    node.id = id;
    node.textContent = text;
    article.appendChild(node);
  }
  document.body.appendChild(article);
}

/**
 * happy-dom has no IntersectionObserver, and even in a browser it would need a
 * real scroll to fire. Standing in for it lets a test say "the reader has just
 * reached this heading" directly, which is the only input the active state has.
 */
let reachHeading: ((id: string) => void) | null = null;

beforeEach(() => {
  class StubObserver {
    constructor(private callback: IntersectionObserverCallback) {
      reachHeading = (id: string) => {
        const target = document.getElementById(id);
        if (!target) throw new Error(`no heading #${id} to reach`);
        // Only the three fields the component reads; the rest of the entry
        // (intersectionRatio, rootBounds, time) would be invented numbers
        // standing in for a layout no test here has.
        const entry = {
          isIntersecting: true,
          target,
          boundingClientRect: { top: 0 },
        } as unknown as IntersectionObserverEntry;
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
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  reachHeading = null;
  window.location.hash = "";
});

const rail = () => screen.getByRole("navigation", { name: "目錄" });
/**
 * The rail's own list, not the panel's — both are `<ul>`s of `<li>`s inside the
 * same `<nav>`, and a query by role would sweep up all of them.
 */
const ticks = () => [...rail().querySelector(":scope > ul")!.querySelectorAll("li > span")];
const panelEntries = () => within(rail()).getAllByRole("link");

describe("PostToc", () => {
  it("renders nothing when the article has no headings", () => {
    plantArticle([]);
    const { container } = render(<PostToc />);
    expect(container.firstChild).toBeNull();
  });

  it("ignores headings outside .prose, so the bio and read-more list stay out", () => {
    plantArticle([{ level: 2, id: "real", text: "In the article" }]);
    const outside = document.createElement("h2");
    outside.id = "read-more";
    outside.textContent = "Read more";
    document.body.appendChild(outside);

    render(<PostToc />);
    expect(panelEntries()).toHaveLength(1);
    expect(panelEntries()[0]).toHaveProperty("hash", "#real");
  });

  it("skips headings that have no id, since there is nothing to link to", () => {
    plantArticle([{ level: 2, id: "kept", text: "Linkable" }]);
    const anonymous = document.createElement("h2");
    anonymous.textContent = "No id";
    document.querySelector(".prose")!.appendChild(anonymous);

    render(<PostToc />);
    expect(panelEntries()).toHaveLength(1);
  });

  describe("the collapsed rail", () => {
    it("draws one tick per h2 and none for h3", () => {
      plantArticle([
        { level: 2, id: "one", text: "First section" },
        { level: 3, id: "one-a", text: "A subheading" },
        { level: 3, id: "one-b", text: "Another subheading" },
        { level: 2, id: "two", text: "Second section" },
      ]);
      render(<PostToc />);

      expect(ticks()).toHaveLength(2);
      expect(panelEntries()).toHaveLength(4);
    });

    it("scales tick width to title length, longest full and shortest shortest", () => {
      plantArticle([
        { level: 2, id: "s", text: "Short" },
        { level: 2, id: "m", text: "A middling heading" },
        { level: 2, id: "l", text: "The considerably longer heading of the two" },
      ]);
      render(<PostToc />);

      const widths = ticks().map((t) => Number.parseFloat((t as HTMLElement).style.width));
      expect(widths[0]).toBe(40);
      expect(widths[2]).toBe(100);
      expect(widths[1]).toBeGreaterThan(widths[0]);
      expect(widths[1]).toBeLessThan(widths[2]);
    });

    it("counts a CJK character as twice a Latin one", () => {
      // Four CJK characters weigh 8; eight Latin letters weigh 8. Ties, because
      // they occupy the same width on screen — which is what the tick draws.
      plantArticle([
        { level: 2, id: "cjk", text: "認知卸載" },
        { level: 2, id: "latin", text: "offloads" },
      ]);
      render(<PostToc />);

      const [a, b] = ticks().map((t) => (t as HTMLElement).style.width);
      expect(a).toBe(b);
    });

    it("draws even ticks when every section title is the same length", () => {
      plantArticle([
        { level: 2, id: "a", text: "Alpha" },
        { level: 2, id: "b", text: "Bravo" },
      ]);
      render(<PostToc />);

      // Not NaN% — the shortest-to-longest spread has no range to divide by.
      for (const tick of ticks()) {
        expect((tick as HTMLElement).style.width).toBe("70%");
      }
    });
  });

  describe("the expanded panel", () => {
    it("links every heading by its own fragment", () => {
      plantArticle([
        { level: 2, id: "前言", text: "前言" },
        { level: 3, id: "核心問題", text: "核心問題" },
      ]);
      render(<PostToc />);

      expect(panelEntries().map((a) => (a as HTMLAnchorElement).getAttribute("href"))).toEqual([
        "#前言",
        "#核心問題",
      ]);
    });

    it("indents subheadings and leaves sections flush", () => {
      plantArticle([
        { level: 2, id: "sec", text: "Section" },
        { level: 3, id: "sub", text: "Subsection" },
      ]);
      render(<PostToc />);

      const [section, sub] = panelEntries().map((a) => a.parentElement!);
      expect(section.className).not.toContain("ps-3");
      expect(sub.className).toContain("ps-3");
    });
  });

  describe("tracking where the reader is", () => {
    const article = [
      { level: 2, id: "one", text: "First section" },
      { level: 3, id: "one-a", text: "A subheading" },
      { level: 2, id: "two", text: "Second section" },
    ] as const;

    it("lights nothing before the reader has reached a heading", () => {
      plantArticle([...article]);
      render(<PostToc />);
      expect(ticks().filter((t) => t.className.includes("bg-blog-accent"))).toHaveLength(0);
    });

    it("lights the tick of the section being read", () => {
      plantArticle([...article]);
      render(<PostToc />);

      reachHeading!("two");
      const lit = ticks().map((t) => t.className.includes("bg-blog-accent"));
      expect(lit).toEqual([false, true]);
    });

    it("keeps a section lit while the reader is inside its subheadings", () => {
      plantArticle([...article]);
      render(<PostToc />);

      // The reader is at "A subheading", which has no tick of its own — the
      // section above it is the one still being read.
      reachHeading!("one-a");
      const lit = ticks().map((t) => t.className.includes("bg-blog-accent"));
      expect(lit).toEqual([true, false]);
    });

    it("marks the current heading itself in the panel, subheading included", () => {
      plantArticle([...article]);
      render(<PostToc />);

      reachHeading!("one-a");
      const current = panelEntries().filter((a) => a.className.includes("font-semibold"));
      expect(current).toHaveLength(1);
      expect(current[0].textContent).toBe("A subheading");
    });
  });

  describe("marking the heading the reader lands on", () => {
    const article = [
      { level: 2, id: "one", text: "First section" },
      { level: 2, id: "two", text: "Second section" },
    ] as const;

    const heading = (id: string) => document.querySelector(`.prose #${id}`)!;
    const entry = (text: string) => screen.getByRole("link", { name: text });

    it("marks the heading an entry points at when that entry is clicked", async () => {
      plantArticle([...article]);
      render(<PostToc />);

      expect(heading("two").className).not.toContain("heading-arrival");
      await userEvent.click(entry("Second section"));
      expect(heading("two").className).toContain("heading-arrival");
    });

    it("marks it again on a second click, when the fragment has not changed", async () => {
      // The regression this guards: `:target` cannot see this click, because the
      // URL it would key on is already what the click asks for. A reader who has
      // scrolled away and wants showing back to their place clicks exactly here.
      plantArticle([...article]);
      render(<PostToc />);

      await userEvent.click(entry("First section"));
      // Stand in for the animation having been and gone: what matters is that
      // the class leaves and returns, since that is what restarts it.
      heading("one").classList.remove("heading-arrival");

      await userEvent.click(entry("First section"));
      expect(heading("one").className).toContain("heading-arrival");
    });

    it("marks the heading a #fragment already in the URL points at", () => {
      // Someone opening a link they were handed: already scrolled on arrival,
      // with no click and no hashchange for the component to hear.
      plantArticle([...article]);
      window.location.hash = "two";
      render(<PostToc />);

      expect(heading("two").className).toContain("heading-arrival");
    });

    it("decodes a percent-encoded fragment, so CJK headings still match", () => {
      plantArticle([{ level: 2, id: "前言", text: "前言" }]);
      window.location.hash = encodeURIComponent("前言");
      render(<PostToc />);

      expect(document.getElementById("前言")!.className).toContain("heading-arrival");
    });
  });

  it("stays off touch screens entirely, rather than folding into the page", () => {
    plantArticle([
      { level: 2, id: "one", text: "First section" },
      { level: 3, id: "one-a", text: "A subheading" },
    ]);
    const { container } = render(<PostToc />);

    // No second, stacked copy of the contents for narrow screens: the rail is
    // the whole feature, and it is hidden below lg by class.
    expect(container.querySelector("details")).toBeNull();
    expect(container.querySelectorAll("nav")).toHaveLength(1);
    expect(rail().className).toContain("hidden");
    expect(rail().className).toContain("lg:block");
  });
});

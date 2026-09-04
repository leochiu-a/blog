// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SharePost } from "./SharePost";

const POST = {
  title: "為什麼 AI 記不住",
  url: "https://leochiu.com/blog/why-ai-forgets/",
  image: "/blog-images/harness-hero.webp",
};

/**
 * happy-dom has no clipboard. `writeText` is a spy so a test can read what was
 * put on it, and reject when a test is standing in for a browser that refuses.
 */
function stubNavigator({ clipboardDenied }: { clipboardDenied?: boolean } = {}) {
  const writeText = vi.fn(() =>
    clipboardDenied ? Promise.reject(new Error("NotAllowedError")) : Promise.resolve(),
  );
  Object.defineProperty(navigator, "clipboard", {
    writable: true,
    configurable: true,
    value: { writeText },
  });
  return { writeText };
}

/** The panel is portalled out of the trigger, so it is found on the screen. */
async function openPanel() {
  await userEvent.click(screen.getByRole("button", { name: "分享" }));
  return screen.getByRole("dialog");
}

afterEach(cleanup);

describe("SharePost", () => {
  it("keeps the panel shut until the reader asks for it", () => {
    stubNavigator();
    render(<SharePost {...POST} />);

    expect(screen.getByRole("button", { name: "分享" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the post's own social card and title, so the sharer sees what a network will render", async () => {
    stubNavigator();
    render(<SharePost {...POST} />);
    const panel = await openPanel();

    expect(within(panel).getByText(POST.title)).toBeTruthy();
    // next/image rewrites the src through the optimiser, so the assertion is
    // that the post's image is the one being asked for — not the exact URL.
    const card = within(panel).getByRole("presentation", { hidden: true });
    expect(decodeURIComponent(card.getAttribute("src") ?? "")).toContain(POST.image);
  });

  it("puts the post's URL on the clipboard, and says so", async () => {
    const { writeText } = stubNavigator();
    render(<SharePost {...POST} />);
    const panel = await openPanel();

    await userEvent.click(within(panel).getByRole("button", { name: "複製連結" }));

    expect(writeText).toHaveBeenCalledWith(POST.url);
    expect(within(panel).getByRole("button", { name: "已複製" })).toBeTruthy();
  });

  it("says so when the browser refuses the clipboard, rather than doing nothing", async () => {
    stubNavigator({ clipboardDenied: true });
    render(<SharePost {...POST} />);
    const panel = await openPanel();

    await userEvent.click(within(panel).getByRole("button", { name: "複製連結" }));

    expect(within(panel).getByRole("button", { name: "複製失敗" })).toBeTruthy();
    expect(within(panel).queryByRole("button", { name: "已複製" })).toBeNull();
  });

  it("hands each network the post's URL and title, pre-encoded", async () => {
    stubNavigator();
    render(<SharePost {...POST} />);
    const panel = await openPanel();

    const hrefFor = (name: string) =>
      within(panel).getByRole("link", { name }).getAttribute("href") ?? "";

    for (const name of ["X", "Facebook"]) {
      expect(hrefFor(name)).toContain(encodeURIComponent(POST.url));
    }
    // Threads takes one `text` parameter and no `url`, so the link has to be
    // encoded inside the text to travel with the post at all.
    expect(hrefFor("Threads")).toContain(encodeURIComponent(`${POST.title} ${POST.url}`));
    // Facebook's sharer takes the URL alone and reads the title off the page it
    // fetches, so it is the one network here that is not handed the title.
    expect(hrefFor("X")).toContain(encodeURIComponent(POST.title));
    expect(hrefFor("Facebook")).not.toContain(encodeURIComponent(POST.title));
  });
});

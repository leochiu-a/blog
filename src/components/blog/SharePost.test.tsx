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
 * happy-dom has neither of the two browser capabilities this component reaches
 * for. `writeText` is a spy so a test can read what was put on the clipboard;
 * `share` is deleted by default so the OS-sheet tile is absent unless a test
 * asks for it, which is what a desktop browser looks like.
 */
function stubNavigator({
  nativeShare,
  clipboardDenied,
}: { nativeShare?: () => Promise<void>; clipboardDenied?: boolean } = {}) {
  const writeText = vi.fn(() =>
    clipboardDenied ? Promise.reject(new Error("NotAllowedError")) : Promise.resolve(),
  );
  Object.defineProperty(navigator, "clipboard", {
    writable: true,
    configurable: true,
    value: { writeText },
  });
  if (nativeShare) {
    Object.defineProperty(navigator, "share", {
      writable: true,
      configurable: true,
      value: nativeShare,
    });
  } else {
    // @ts-expect-error — removing an optional capability the type assumes.
    delete navigator.share;
  }
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

    for (const name of ["X", "Facebook", "LinkedIn", "Email"]) {
      expect(hrefFor(name)).toContain(encodeURIComponent(POST.url));
    }
    // Threads takes one `text` parameter and no `url`, so the link has to be
    // encoded inside the text to travel with the post at all.
    expect(hrefFor("Threads")).toContain(encodeURIComponent(`${POST.title} ${POST.url}`));
    // Facebook's sharer takes the URL alone and reads the title off the page it
    // fetches, so only the other two carry the title.
    expect(hrefFor("X")).toContain(encodeURIComponent(POST.title));
    expect(hrefFor("Email")).toContain(encodeURIComponent(POST.title));
    expect(hrefFor("Email")).toMatch(/^mailto:/);
  });

  it("offers the OS share sheet only where the browser has one", async () => {
    stubNavigator();
    render(<SharePost {...POST} />);
    expect(within(await openPanel()).queryByRole("button", { name: "更多" })).toBeNull();

    cleanup();

    const share = vi.fn(() => Promise.resolve());
    stubNavigator({ nativeShare: share });
    render(<SharePost {...POST} />);
    const panel = await openPanel();

    await userEvent.click(within(panel).getByRole("button", { name: "更多" }));
    expect(share).toHaveBeenCalledWith({ title: POST.title, url: POST.url });
  });

  it("does not surface a reader backing out of the OS share sheet as an error", async () => {
    stubNavigator({ nativeShare: () => Promise.reject(new Error("AbortError")) });
    render(<SharePost {...POST} />);
    const panel = await openPanel();

    await expect(
      userEvent.click(within(panel).getByRole("button", { name: "更多" })),
    ).resolves.toBeUndefined();
  });
});

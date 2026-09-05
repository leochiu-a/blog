// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ZoomableImage } from "./ZoomableImage";

const IMAGE = {
  src: "/blog-images/image-2.webp",
  alt: "行銷頁面的雙欄卡片排版",
  width: 814,
  height: 1382,
};

function renderImage(props: Partial<typeof IMAGE> & { caption?: string } = {}) {
  return render(<ZoomableImage {...IMAGE} {...props} />);
}

/** The enlarged copy lives in a portal, so it is found from the dialog, not the trigger. */
function lightbox() {
  return screen.getByRole("dialog");
}

describe("ZoomableImage", () => {
  afterEach(cleanup);

  it("shows only the thumbnail until it is clicked", () => {
    renderImage();

    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("caps a portrait thumbnail by width, so its rounded corners land on the picture", () => {
    renderImage();

    // 70svh of height on an 814x1382 shot is worth 41.23svh of width.
    expect(screen.getByRole("button").style.maxWidth).toBe("41.23svh");
  });

  it("leaves a landscape thumbnail free to span the column", () => {
    renderImage({ width: 2300, height: 1246 });

    // Far wider than any column, so `w-full` is what actually decides the size.
    expect(parseFloat(screen.getByRole("button").style.maxWidth)).toBeGreaterThan(100);
  });

  it("opens a full-screen copy of the same image", async () => {
    const user = userEvent.setup();
    renderImage();

    await user.click(screen.getByRole("button"));

    const enlarged = within(lightbox()).getByRole("img", { name: IMAGE.alt });
    expect(enlarged.getAttribute("src")).toContain(encodeURIComponent(IMAGE.src));
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderImage();
    await user.click(screen.getByRole("button"));

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when the reader clicks the enlarged image, the way Substack does", async () => {
    const user = userEvent.setup();
    renderImage();
    await user.click(screen.getByRole("button"));

    await user.click(within(lightbox()).getByRole("img", { name: IMAGE.alt }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("repeats the caption under the enlarged image", async () => {
    const user = userEvent.setup();
    renderImage({ caption: "雙欄卡片排版" });

    await user.click(screen.getByRole("button"));

    const caption = within(lightbox()).getByText("雙欄卡片排版", { selector: "figcaption" });
    expect(caption).toBeTruthy();
  });

  it("names the dialog after the alt text when there is no caption", async () => {
    const user = userEvent.setup();
    renderImage();

    await user.click(screen.getByRole("button"));

    expect(within(lightbox()).getByRole("heading").textContent).toBe(IMAGE.alt);
  });
});

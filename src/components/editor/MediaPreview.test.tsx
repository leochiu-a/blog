// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaPreview } from "./MediaPreview";

afterEach(cleanup);

const IMAGE = {
  kind: "Figure",
  src: "/blog-images/example.webp",
  poster: "",
  alt: "範例圖片",
  caption: "",
  offered: false,
} as const;

function renderPreview(props: Partial<React.ComponentProps<typeof MediaPreview>> = {}) {
  const onCaptionChange = vi.fn();
  const onSelect = vi.fn();
  render(
    <MediaPreview {...IMAGE} onCaptionChange={onCaptionChange} onSelect={onSelect} {...props} />,
  );
  return { onCaptionChange, onSelect };
}

const caption = () => screen.queryByRole("textbox", { name: "圖說" });

describe("the caption line", () => {
  it("stays out of the way of a block that has no caption and is not selected", () => {
    renderPreview();
    expect(caption()).toBeNull();
  });

  it("offers itself as soon as the block is selected", () => {
    renderPreview({ offered: true });
    expect(caption()?.getAttribute("placeholder")).toBe("寫個圖說（可選）");
  });

  it("shows a caption the block already has, selected or not", () => {
    renderPreview({ caption: "雙欄卡片排版" });
    expect((caption() as HTMLTextAreaElement).value).toBe("雙欄卡片排版");
  });

  it("reports every keystroke as the whole caption", async () => {
    const { onCaptionChange } = renderPreview({ offered: true });
    await userEvent.type(caption() as HTMLTextAreaElement, "夜景");

    expect(onCaptionChange.mock.calls.map(([next]) => next)).toEqual(["夜", "夜景"]);
  });

  it("hands the block back its selection when the caption is finished with", async () => {
    const { onSelect, onCaptionChange } = renderPreview({ offered: true });
    await userEvent.type(caption() as HTMLTextAreaElement, "夜景{Enter}");

    expect(onSelect).toHaveBeenCalledOnce();
    // The Enter went to the block, not into the caption: a figcaption is one
    // sentence, and the line under a picture has nowhere to put a second.
    expect(onCaptionChange).toHaveBeenLastCalledWith("夜景");
  });

  it("keeps Shift+Enter for a second line", async () => {
    const { onSelect, onCaptionChange } = renderPreview({ offered: true });
    await userEvent.type(caption() as HTMLTextAreaElement, "上{Shift>}{Enter}{/Shift}下");

    expect(onSelect).not.toHaveBeenCalled();
    expect(onCaptionChange).toHaveBeenLastCalledWith("上\n下");
  });

  it("takes Escape as finished too", async () => {
    const { onSelect } = renderPreview({ offered: true, caption: "夜景" });
    await userEvent.type(caption() as HTMLTextAreaElement, "{Escape}");

    expect(onSelect).toHaveBeenCalledOnce();
  });

  /**
   * The marker DocumentEditor's `handleDOMEvents` looks for. Without it
   * ProseMirror handles the pointer and the keys first — it sits below the root
   * React listens on — and the caption never keeps the caret it was just given.
   */
  it("marks itself as a caption for the editor to keep its hands off", () => {
    renderPreview({ offered: true });
    expect(caption()?.hasAttribute("data-caption")).toBe(true);
  });
});

describe("selecting the block", () => {
  it("happens on a click on the picture", async () => {
    const { onSelect } = renderPreview();
    await userEvent.click(screen.getByRole("img"));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  /**
   * Selecting takes focus back to the editor, which would empty the caption of
   * the caret this very click just put there — the bug that made the caption
   * look like it could not be clicked at all.
   */
  it("does not happen on a click on the caption", async () => {
    const { onSelect } = renderPreview({ offered: true });
    await userEvent.click(caption() as HTMLTextAreaElement);

    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("the picture itself", () => {
  it("is the image, with its alt text", () => {
    renderPreview();
    expect(screen.getByRole("img").getAttribute("src")).toBe("/blog-images/example.webp");
    expect(screen.getByRole("img").getAttribute("alt")).toBe("範例圖片");
  });

  it("is a paused, poster-bearing player for a clip", () => {
    const { container } = render(
      <MediaPreview
        {...IMAGE}
        kind="Clip"
        src="/blog-videos/example.mp4"
        poster="/blog-videos/example.webp"
        onCaptionChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    const video = container.querySelector("video");

    expect(video?.getAttribute("src")).toBe("/blog-videos/example.mp4");
    expect(video?.getAttribute("poster")).toBe("/blog-videos/example.webp");
    expect(video?.hasAttribute("autoplay")).toBe(false);
  });
});

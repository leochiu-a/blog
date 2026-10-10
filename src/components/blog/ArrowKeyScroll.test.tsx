// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ArrowKeyScroll } from "./ArrowKeyScroll";

let scrollBy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollBy = vi.fn();
  window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: () => ({ matches: false }),
  });
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe("ArrowKeyScroll", () => {
  it("moves the page a third of a screen per press, smoothly", () => {
    render(<ArrowKeyScroll />);

    expect(press("ArrowDown").defaultPrevented).toBe(true);
    press("ArrowUp");

    expect(scrollBy.mock.calls).toEqual([
      [{ top: 340, behavior: "smooth" }],
      [{ top: -340, behavior: "smooth" }],
    ]);
  });

  it("jumps rather than glides for a reader who asked for less motion", () => {
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
    render(<ArrowKeyScroll />);

    press("ArrowDown");
    expect(scrollBy).toHaveBeenCalledWith({ top: 340, behavior: "auto" });
  });

  it("leaves arrows with a modifier to the browser", () => {
    render(<ArrowKeyScroll />);

    for (const modifier of ["metaKey", "ctrlKey", "altKey", "shiftKey"]) {
      expect(press("ArrowDown", { [modifier]: true }).defaultPrevented).toBe(false);
    }
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("leaves arrows alone inside a text field or anything editable", () => {
    render(<ArrowKeyScroll />);
    const input = document.body.appendChild(document.createElement("input"));
    const editable = document.body.appendChild(document.createElement("div"));
    editable.contentEditable = "true";

    press("ArrowDown", {}, input);
    press("ArrowDown", {}, editable);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("leaves a key alone once something on the page has handled it", () => {
    render(<ArrowKeyScroll />);
    const widget = document.body.appendChild(document.createElement("div"));
    widget.addEventListener("keydown", (event) => event.preventDefault());

    press("ArrowDown", {}, widget);
    expect(scrollBy).not.toHaveBeenCalled();
  });
});

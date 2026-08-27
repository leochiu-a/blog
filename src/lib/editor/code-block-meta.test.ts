import { describe, expect, it } from "vitest";
import { hasLineNumbers, toggleLineNumbers } from "./code-block-meta";

describe("reading line numbers off a fence's meta", () => {
  it("is off when the block has no meta at all", () => {
    expect(hasLineNumbers(null)).toBe(false);
  });

  it("is on for the bare token", () => {
    expect(hasLineNumbers("showLineNumbers")).toBe(true);
  });

  it("is on when the count starts somewhere other than 1", () => {
    expect(hasLineNumbers("showLineNumbers{98}")).toBe(true);
  });

  it("is on when other options sit alongside it", () => {
    expect(hasLineNumbers('title="a.js" showLineNumbers {1-3}')).toBe(true);
  });

  it("is off for a different option that merely starts the same way", () => {
    expect(hasLineNumbers("showLineNumbersPlease")).toBe(false);
  });
});

describe("toggling line numbers on a fence's meta", () => {
  it("turns them on for a block that had no meta", () => {
    expect(toggleLineNumbers(null)).toBe("showLineNumbers");
  });

  it("returns to null rather than an empty string, so the fence stays bare", () => {
    expect(toggleLineNumbers("showLineNumbers")).toBe(null);
  });

  it("survives a round trip", () => {
    expect(toggleLineNumbers(toggleLineNumbers(null))).toBe(null);
  });

  it("keeps the other options when turning them on", () => {
    expect(toggleLineNumbers('title="a.js"')).toBe('title="a.js" showLineNumbers');
  });

  it("keeps the other options when turning them off", () => {
    expect(toggleLineNumbers('title="a.js" showLineNumbers {1-3}')).toBe('title="a.js" {1-3}');
  });

  it("drops the start offset along with the token", () => {
    expect(toggleLineNumbers("showLineNumbers{98}")).toBe(null);
  });

  it("leaves no double space behind where the token was", () => {
    expect(toggleLineNumbers("{1-3} showLineNumbers {5}")).toBe("{1-3} {5}");
  });
});

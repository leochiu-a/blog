import { describe, expect, it } from "vitest";
import { lineStarts } from "./line-numbers";

describe("where a code block's lines begin", () => {
  it("numbers a single line", () => {
    expect(lineStarts("const a = 1;", 5)).toEqual([5]);
  });

  it("counts from the position the content starts at", () => {
    expect(lineStarts("ab\ncd", 100)).toEqual([100, 103]);
  });

  it("opens no line after a trailing newline", () => {
    expect(lineStarts("ab\n", 0)).toEqual([0]);
  });

  it("does count a blank line in the middle", () => {
    expect(lineStarts("a\n\nb", 0)).toEqual([0, 2, 3]);
  });

  it("has one start per line for a block of several", () => {
    const text = "one\ntwo\nthree";

    expect(lineStarts(text, 1)).toEqual([1, 5, 9]);
  });

  it("treats an empty block as one line", () => {
    expect(lineStarts("", 7)).toEqual([7]);
  });
});

import { describe, expect, it } from "vitest";
import { MAX_CLIP_BYTES, clipTooLarge } from "./uploads";

describe("the clip size ceiling", () => {
  it("passes a clip under the ceiling", () => {
    expect(clipTooLarge(1024)).toBeNull();
  });

  it("passes a clip exactly at the ceiling", () => {
    expect(clipTooLarge(MAX_CLIP_BYTES)).toBeNull();
  });

  it("explains a clip over the ceiling in megabytes", () => {
    const message = clipTooLarge(MAX_CLIP_BYTES + 1024 * 1024);

    expect(message).toContain("6.0MB");
    expect(message).toContain("5.0MB");
    expect(message).toMatch(/上限/);
  });
});

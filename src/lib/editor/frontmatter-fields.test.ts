import { describe, expect, it } from "vitest";
import { REQUIRED_KEYS } from "@/lib/post-frontmatter";
import { readFlag, readList, readText, withField, without } from "./frontmatter-fields";

const post = {
  title: "Hello",
  datetime: "2026-01-01",
  readTime: "2 min",
  font: "newsreader",
  category: "personal",
  tags: ["AI"],
  draft: true,
};

describe("the required key list", () => {
  it("is derived from the schema, not restated", () => {
    expect(REQUIRED_KEYS).toEqual(["title", "datetime", "readTime", "font", "category"]);
  });
});

describe("reading a field", () => {
  it("reads text, missing or not", () => {
    expect(readText(post, "title")).toBe("Hello");
    expect(readText(post, "description")).toBe("");
  });

  it("reads a list, missing or not", () => {
    expect(readList(post, "tags")).toEqual(["AI"]);
    expect(readList(post, "nope")).toEqual([]);
  });

  it("reads a flag, missing or not", () => {
    expect(readFlag(post, "draft")).toBe(true);
    expect(readFlag(post, "featured")).toBe(false);
  });
});

describe("changing a field", () => {
  it("sets a value without touching the rest", () => {
    expect(withField(post, "title", "Renamed")).toEqual({ ...post, title: "Renamed" });
  });

  it("drops an optional key", () => {
    expect(without(post, "draft")).toEqual({ ...post, draft: undefined });
    expect("draft" in without(post, "draft")).toBe(false);
  });

  it.each(REQUIRED_KEYS)("refuses to drop %s, blanking it instead", (key) => {
    const next = without(post, key);

    expect(key in next).toBe(true);
    expect(next[key]).toBe("");
  });
});

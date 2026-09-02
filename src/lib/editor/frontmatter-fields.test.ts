import { describe, expect, it } from "vitest";
import { COLLECTIONS } from "./collections";
import { readFlag, readList, readText, withField, without } from "./frontmatter-fields";

const REQUIRED_KEYS = COLLECTIONS.posts.requiredKeys;

const post = {
  title: "Hello",
  datetime: "2026-01-01",
  readTime: "2 min",
  category: "personal",
  tags: ["AI"],
  draft: true,
};

describe("the required key list", () => {
  it("is derived from a Post's schema, not restated", () => {
    expect(REQUIRED_KEYS).toEqual(["title", "datetime", "readTime", "category"]);
  });

  it("is derived from an Issue's schema too", () => {
    expect(COLLECTIONS.issues.requiredKeys).toEqual(["title", "datetime"]);
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
    expect(without(post, "draft", REQUIRED_KEYS)).toEqual({ ...post, draft: undefined });
    expect("draft" in without(post, "draft", REQUIRED_KEYS)).toBe(false);
  });

  it.each(REQUIRED_KEYS)("refuses to drop %s, blanking it instead", (key) => {
    const next = without(post, key, REQUIRED_KEYS);

    expect(key in next).toBe(true);
    expect(next[key]).toBe("");
  });
});

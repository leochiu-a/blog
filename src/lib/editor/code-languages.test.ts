import { describe, expect, it } from "vitest";
import { CODE_LANGUAGES, NO_LANGUAGE, languageOptions } from "./code-languages";

describe("the code block language picker's options", () => {
  it("always offers 'no language' first", () => {
    expect(languageOptions(null)[0]).toBe(NO_LANGUAGE);
  });

  it("offers the curated list", () => {
    expect(languageOptions(null)).toEqual([NO_LANGUAGE, ...CODE_LANGUAGES]);
  });

  it("adds nothing when the block's language is already on the list", () => {
    expect(languageOptions("ts")).toEqual([NO_LANGUAGE, ...CODE_LANGUAGES]);
  });

  it("keeps a hand-written language the list doesn't know", () => {
    const options = languageOptions("kotlin");

    expect(options).toContain("kotlin");
    expect(options).toHaveLength(CODE_LANGUAGES.length + 2);
  });
});

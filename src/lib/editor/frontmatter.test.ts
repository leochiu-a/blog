import { describe, expect, it } from "vitest";
import { applyFrontmatter, parseFrontmatter } from "./frontmatter";

const SOURCE = [
  `title: "Hello"`,
  `datetime: "2026-01-01"`,
  `featured: true`,
  `tags: ["AI", "工程師職涯"]`,
].join("\n");

const values = parseFrontmatter(SOURCE);

describe("writing frontmatter back", () => {
  it("leaves untouched keys exactly as they were written", () => {
    expect(applyFrontmatter(SOURCE, values)).toBe(SOURCE);
  });

  it("keeps a string's quotes when its value changes", () => {
    expect(applyFrontmatter(SOURCE, { ...values, title: "Renamed" })).toContain(`title: "Renamed"`);
  });

  it("keeps tags on one line, double-quoted, when they change", () => {
    const next = applyFrontmatter(SOURCE, { ...values, tags: ["AI", "工程師職涯", "新標籤"] });

    expect(next).toContain(`tags: ["AI", "工程師職涯", "新標籤"]`);
  });

  it("writes a brand new string key in the same style", () => {
    expect(applyFrontmatter(SOURCE, { ...values, subtitle: "A subtitle" })).toContain(
      `subtitle: "A subtitle"`,
    );
  });

  it("writes a brand new list in the same style", () => {
    const bare = `title: "Hello"`;
    const next = applyFrontmatter(bare, { title: "Hello", tags: ["one", "two"] });

    expect(next).toContain(`tags: ["one", "two"]`);
  });

  it("leaves booleans unquoted", () => {
    expect(applyFrontmatter(SOURCE, { ...values, draft: true })).toContain("draft: true");
  });

  it("drops a key that is no longer there", () => {
    const { featured: _featured, ...rest } = values;

    expect(applyFrontmatter(SOURCE, rest)).not.toContain("featured");
  });
});

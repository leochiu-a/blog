import { describe, expect, it } from "vitest";
import { acceptsUploads, insertOptions } from "@/components/editor/insert-options";
import { MDX_BLOCKS } from "@/components/editor/mdx-blocks";

describe("what a Post may insert", () => {
  it("offers everything: uploads, every MDX block, and the plain-Markdown ones", () => {
    const ids = insertOptions("posts").map((option) => option.id);

    expect(ids).toEqual([
      "upload:image",
      "upload:video",
      ...MDX_BLOCKS.map((block) => `mdx:${block.name}`),
      "command:codeBlock",
      "command:pullQuote",
      "command:horizontalRule",
    ]);
  });

  it("takes a dropped file", () => {
    expect(acceptsUploads("posts")).toBe(true);
  });
});

describe("what an Issue may insert", () => {
  it("offers only what the email carries", () => {
    expect(insertOptions("issues").map((option) => option.id)).toEqual([
      "command:pullQuote",
      "command:horizontalRule",
    ]);
  });

  // The blocks the email drops, named one by one: a regression here is silent,
  // because the block still renders everywhere except the inbox. Both kinds an
  // MDX block can be offered under count — a `LinkCard` is asked for by URL
  // rather than inserted empty, and would otherwise slip past this.
  it("offers no MDX block, under either kind", () => {
    const offered = insertOptions("issues");
    expect(offered.filter((option) => option.kind === "mdx")).toEqual([]);
    expect(offered.filter((option) => option.kind === "link")).toEqual([]);
  });

  it("offers no upload, and refuses a dropped file for the same reason", () => {
    expect(insertOptions("issues").filter((option) => option.kind === "upload")).toEqual([]);
    expect(acceptsUploads("issues")).toBe(false);
  });

  it("offers no fenced code block", () => {
    expect(insertOptions("issues").map((option) => option.id)).not.toContain("command:codeBlock");
  });
});

describe("the rule itself", () => {
  it("hands an Issue nothing the email would drop", () => {
    expect(insertOptions("issues").every((option) => option.survivesEmail)).toBe(true);
  });

  it("is a filter of the Post list, so a new option is offered to a Post by default", () => {
    const issue = insertOptions("issues");
    const post = insertOptions("posts");

    expect(post).toEqual(expect.arrayContaining(issue));
    expect(post.length).toBeGreaterThan(issue.length);
  });
});

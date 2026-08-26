import { describe, expect, it } from "vitest";
import { editableAttributes } from "@/components/editor/mdx-blocks";
import type { MdxAttribute } from "./types";

const text = (name: string, value: string): MdxAttribute => ({ name, value, expression: null });

describe("the attribute form's fields", () => {
  it("keeps what the file already has, in the file's order", () => {
    const current = [text("alt", "a"), text("src", "/a.png")];

    expect(editableAttributes("Figure", current).slice(0, 2)).toEqual(current);
  });

  it("offers the spec's fields the file left out", () => {
    const fields = editableAttributes("Callout", []);

    expect(fields.map((field) => field.name)).toEqual(["type"]);
    expect(fields[0]).toEqual({ name: "type", value: "note", expression: null });
  });

  it("does not offer a field the file already filled in", () => {
    const fields = editableAttributes("Callout", [text("type", "warning")]);

    expect(fields).toEqual([text("type", "warning")]);
  });

  it("keeps an attribute the spec doesn't know about", () => {
    const fields = editableAttributes("Figure", [text("data-x", "1")]);

    expect(fields[0]).toEqual(text("data-x", "1"));
    expect(fields.map((field) => field.name)).toContain("src");
  });

  it("has nothing to offer for a component it has no spec for", () => {
    expect(editableAttributes("Unknown", [])).toEqual([]);
  });
});

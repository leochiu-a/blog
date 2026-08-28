import { describe, expect, it } from "vitest";
import { editableAttributes } from "@/components/editor/mdx-blocks";
import type { MdxAttribute } from "./types";

const text = (name: string, value: string): MdxAttribute => ({ name, value, expression: null });

describe("the attribute form's fields", () => {
  it("keeps what the file already has, in the file's order", () => {
    const current = [text("caption", "c"), text("alt", "a"), text("src", "/a.png")];

    // `src` is derived, so it drops out; the two that remain keep the file's
    // order rather than the spec's.
    expect(editableAttributes("Figure", current)).toEqual([current[0], current[1]]);
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
    expect(fields.map((field) => field.name)).toContain("caption");
  });

  it("leaves out the fields a Figure derives from the dropped image", () => {
    const current = [
      text("src", "/a.png"),
      text("alt", "a"),
      { name: "width", value: null, expression: "800" },
      { name: "height", value: null, expression: "600" },
      text("caption", "c"),
    ];

    expect(editableAttributes("Figure", current).map((field) => field.name)).toEqual([
      "alt",
      "caption",
    ]);
  });

  it("still offers a derived field that ended up empty", () => {
    // A Figure inserted from the menu rather than by dropping an image: without
    // the field there would be nothing to point it at a file with.
    const fields = editableAttributes("Figure", [text("src", ""), text("alt", "a")]);

    expect(fields.map((field) => field.name)).toEqual(["src", "alt", "caption"]);
  });

  it("shows a src the spec derives elsewhere but VideoEmbed does not", () => {
    const fields = editableAttributes("VideoEmbed", [text("src", "/a.mp4")]);

    expect(fields.map((field) => field.name)).toEqual(["src", "title"]);
  });

  it("has nothing to offer for a component it has no spec for", () => {
    expect(editableAttributes("Unknown", [])).toEqual([]);
  });
});

import { getSchema } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { describe, expect, it } from "vitest";
import { extensions } from "./extensions";
import { HERO_ATTRIBUTE, heroPositions, soleHeroPlugin } from "./hero";
import type { MdxAttribute } from "./types";

const schema = getSchema(extensions);

const hero: MdxAttribute = { name: HERO_ATTRIBUTE, value: null, expression: null };

/** A `<Figure>` block, named by its `src` so the assertions can tell them apart. */
function figure(src: string, { isHero = false } = {}) {
  return schema.nodes.mdxBlock!.create({
    name: "Figure",
    attributes: [{ name: "src", value: src, expression: null }, ...(isHero ? [hero] : [])],
  });
}

function stateWith(...figures: ReturnType<typeof figure>[]) {
  return EditorState.create({
    schema,
    doc: schema.nodes.doc!.create(null, figures),
    plugins: [soleHeroPlugin],
  });
}

/** The `src` of every block still claiming to be the hero. */
function heroes(state: EditorState): string[] {
  return heroPositions(state.doc).map((position) => {
    const attributes = state.doc.nodeAt(position)!.attrs.attributes as MdxAttribute[];
    return attributes.find((attribute) => attribute.name === "src")!.value!;
  });
}

describe("one hero per post", () => {
  it("leaves a pasted copy of the hero unmarked", () => {
    const start = stateWith(figure("/a.webp", { isHero: true }));

    const state = start.apply(
      start.tr.insert(start.doc.content.size, figure("/b.webp", { isHero: true })),
    );

    expect(heroes(state)).toEqual(["/a.webp"]);
  });

  /** Position alone would hand the mark to whatever was pasted above it. */
  it("keeps the mark on the hero when the copy lands above it", () => {
    const start = stateWith(figure("/a.webp", { isHero: true }));

    const state = start.apply(start.tr.insert(0, figure("/b.webp", { isHero: true })));

    expect(heroes(state)).toEqual(["/a.webp"]);
  });

  it("keeps the first when both arrive at once", () => {
    const start = stateWith(figure("/a.webp"));

    const state = start.apply(
      start.tr.insert(start.doc.content.size, [
        figure("/b.webp", { isHero: true }),
        figure("/c.webp", { isHero: true }),
      ]),
    );

    expect(heroes(state)).toEqual(["/b.webp"]);
  });

  /** What the toggle dispatches: the swap is one transaction, and it stands. */
  it("lets the toggle move the mark", () => {
    const start = stateWith(figure("/a.webp", { isHero: true }), figure("/b.webp"));

    const tr = start.tr;
    tr.setNodeAttribute(0, "attributes", [{ name: "src", value: "/a.webp", expression: null }]);
    tr.setNodeAttribute(start.doc.child(0).nodeSize, "attributes", [
      { name: "src", value: "/b.webp", expression: null },
      hero,
    ]);

    expect(heroes(start.apply(tr))).toEqual(["/b.webp"]);
  });

  it("leaves a post with one hero alone", () => {
    const start = stateWith(figure("/a.webp", { isHero: true }), figure("/b.webp"));

    const state = start.apply(start.tr.insert(start.doc.content.size, figure("/c.webp")));

    expect(heroes(state)).toEqual(["/a.webp"]);
  });
});

import type { MdxAttribute } from "@/lib/editor/types";

/** The MDX components the editor can insert, and how each one is shaped. */
export type MdxBlockSpec = {
  name: string;
  label: string;
  /** Self-closing components hold no editable children. */
  selfClosing: boolean;
  attributes: MdxAttribute[];
};

const text = (name: string, value = ""): MdxAttribute => ({ name, value, expression: null });
const expression = (name: string, value: string): MdxAttribute => ({
  name,
  value: null,
  expression: value,
});

export const MDX_BLOCKS: MdxBlockSpec[] = [
  {
    name: "Figure",
    label: "Figure（帶圖說的圖片）",
    selfClosing: true,
    attributes: [
      text("src"),
      text("alt"),
      expression("width", "1200"),
      expression("height", "800"),
      text("caption"),
    ],
  },
  {
    name: "BookQuote",
    label: "BookQuote（有出處的引言）",
    selfClosing: false,
    attributes: [text("speaker"), text("source")],
  },
  {
    name: "Callout",
    label: "Callout（提示框）",
    selfClosing: false,
    attributes: [text("type", "note")],
  },
  { name: "FancyQuote", label: "FancyQuote（置中大字引言）", selfClosing: false, attributes: [] },
  { name: "PoemCard", label: "PoemCard（詩卡）", selfClosing: false, attributes: [text("title")] },
  {
    name: "VideoEmbed",
    label: "VideoEmbed（影片）",
    selfClosing: true,
    attributes: [text("src"), text("title")],
  },
];

const SELF_CLOSING = new Set(
  MDX_BLOCKS.filter((block) => block.selfClosing).map((block) => block.name),
);

export function isSelfClosing(name: string | null): boolean {
  return name !== null && SELF_CLOSING.has(name);
}

export function specFor(name: string | null): MdxBlockSpec | undefined {
  return MDX_BLOCKS.find((block) => block.name === name);
}

/**
 * The fields the attribute form should show: everything the file already has,
 * in the file's own order, followed by the spec's remaining fields.
 *
 * Without the second half a `<Callout>` written without `type=` offers nowhere
 * to add it, even though the spec declares the shape.
 */
export function editableAttributes(name: string | null, current: MdxAttribute[]): MdxAttribute[] {
  const declared = specFor(name)?.attributes ?? [];
  const present = new Set(current.map((attribute) => attribute.name));

  return [...current, ...declared.filter((attribute) => !present.has(attribute.name))];
}

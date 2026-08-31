import type { MdxAttribute } from "@/lib/editor/types";

/** The MDX components the editor can insert, and how each one is shaped. */
export type MdxBlockSpec = {
  name: string;
  label: string;
  /** Self-closing components hold no editable children. */
  selfClosing: boolean;
  attributes: MdxAttribute[];
  /**
   * Attributes filled in from the file being inserted rather than typed, so
   * the attribute form leaves them out. See `editableAttributes`.
   */
  derived: string[];
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
    // Dropping an image sets all three from the file itself (PostEditor's
    // `uploadImage`, which reads the real bitmap size). `alt` and `caption`
    // are the only two a person writes.
    derived: ["src", "width", "height"],
  },
  {
    name: "Callout",
    label: "Callout（提示框）",
    selfClosing: false,
    attributes: [text("type", "note")],
    derived: [],
  },
  {
    name: "FancyQuote",
    label: "FancyQuote（置中大字引言）",
    selfClosing: false,
    attributes: [],
    derived: [],
  },
  {
    name: "Clip",
    label: "Clip（螢幕錄影短片，上傳）",
    selfClosing: true,
    attributes: [
      text("src"),
      text("poster"),
      expression("width", "1200"),
      expression("height", "800"),
      text("caption"),
    ],
    // A clip only ever arrives by upload, which reads the real frame size and
    // cuts the poster (PostEditor's `uploadVideo`). `caption` is the one field
    // a person writes.
    derived: ["src", "poster", "width", "height"],
  },
  {
    name: "VideoEmbed",
    label: "VideoEmbed（影片）",
    selfClosing: true,
    attributes: [text("src"), text("title")],
    derived: [],
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
 * in the file's own order, followed by the spec's remaining fields, minus the
 * ones the spec derives from the inserted file.
 *
 * Without the second half a `<Callout>` written without `type=` offers nowhere
 * to add it, even though the spec declares the shape.
 */
export function editableAttributes(name: string | null, current: MdxAttribute[]): MdxAttribute[] {
  const spec = specFor(name);
  const declared = spec?.attributes ?? [];
  const present = new Set(current.map((attribute) => attribute.name));
  const derived = new Set(spec?.derived ?? []);
  const fields = [...current, ...declared.filter((attribute) => !present.has(attribute.name))];

  // A derived attribute is still worth a field while it holds nothing: that's a
  // block inserted from the menu rather than by dropping an image, and with the
  // field gone there would be no way to point it at a file.
  return fields.filter(
    (field) =>
      !derived.has(field.name ?? "") || (field.value ?? field.expression ?? "").trim() === "",
  );
}

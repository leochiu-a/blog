/**
 * The editor document model — a plain-JSON ProseMirror document plus the
 * document's frontmatter. Everything here has to survive `JSON.stringify`,
 * because it travels between the editor route and the dev-only file APIs.
 */
export type PmMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type PmNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PmNode[];
  text?: string;
  marks?: PmMark[];
};

/** One attribute of an MDX JSX element, in a form a settings form can bind to. */
export type MdxAttribute = {
  /** `null` for a spread attribute (`{...props}`). */
  name: string | null;
  /** A plain string attribute (`alt="…"`). */
  value: string | null;
  /** An expression attribute (`width={1200}`), kept as its raw source. */
  expression: string | null;
};

export type EditorDocument = {
  /** Frontmatter as a plain object, for the settings panel. */
  frontmatter: Record<string, unknown>;
  /** The original YAML text, so untouched keys keep their exact formatting. */
  frontmatterSource: string;
  /** The body, as a ProseMirror `doc` node. */
  doc: PmNode;
};

/** What the editor needs to write a `<Clip>` block: both files, and their size. */
export type Clip = {
  src: string;
  poster: string;
  width: number;
  height: number;
};

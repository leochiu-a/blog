import { collectionOf, type CollectionName } from "@/lib/editor/collections";
import { VIDEO_ACCEPT } from "@/lib/editor/uploads";
import { MDX_BLOCKS } from "./mdx-blocks";

/**
 * What the `+` menu can put on the page, and — the part worth testing — which
 * of it a given collection is allowed to see.
 *
 * The list lives apart from the menu because the rule below is content logic,
 * not layout: it decides what a person is even offered, and it fails silently
 * when it is wrong. `InsertMenu` renders these; it does not choose them.
 */

/** An editor command with nothing to configure. */
export type InsertCommand = "codeBlock" | "pullQuote" | "horizontalRule";

type Common = {
  id: string;
  label: string;
  /**
   * Whether the option survives `src/lib/newsletter/email.ts`, which renders
   * an Issue into an inbox and knows Markdown and nothing else.
   */
  survivesEmail: boolean;
};

export type InsertOption = Common &
  (
    | { kind: "upload"; accept: string; target: "image" | "video" }
    | { kind: "mdx"; block: string }
    | { kind: "command"; command: InsertCommand }
  );

/** The file pickers, narrowed for the menu that renders them differently. */
export type UploadOption = Extract<InsertOption, { kind: "upload" }>;

/** Every option, in the order the menu offers them. */
const ALL: InsertOption[] = [
  {
    id: "upload:image",
    label: "圖片（上傳）",
    kind: "upload",
    accept: "image/*",
    target: "image",
    survivesEmail: false,
  },
  {
    id: "upload:video",
    label: "影片（上傳短片）",
    kind: "upload",
    accept: VIDEO_ACCEPT,
    target: "video",
    survivesEmail: false,
  },
  // An upload lands as an MDX block, so the two travel together.
  ...MDX_BLOCKS.map((block): InsertOption => ({
    id: `mdx:${block.name}`,
    label: block.label,
    kind: "mdx",
    block: block.name,
    survivesEmail: false,
  })),
  {
    id: "command:codeBlock",
    label: "程式碼區塊",
    kind: "command",
    command: "codeBlock",
    // A fenced block reaches the archive page as highlighted code and the
    // email as nothing at all.
    survivesEmail: false,
  },
  {
    id: "command:pullQuote",
    label: "Pull quote（>>）",
    kind: "command",
    command: "pullQuote",
    survivesEmail: true,
  },
  {
    id: "command:horizontalRule",
    label: "分隔線",
    kind: "command",
    command: "horizontalRule",
    survivesEmail: true,
  },
];

/**
 * What this collection may insert.
 *
 * A block an Issue cannot carry is worse than a missing one: it shows in the
 * editor, it shows in preview, it shows on the archive page, and it is absent
 * from the thing that actually went out. So the menu never offers it.
 */
export function insertOptions(collection: CollectionName): InsertOption[] {
  if (collectionOf(collection).mdxBlocks) return ALL;
  return ALL.filter((option) => option.survivesEmail);
}

/**
 * Whether a dropped file has anywhere to go. The drop handler and the menu's
 * upload pickers are one rule, so they read it from one place.
 */
export function acceptsUploads(collection: CollectionName): boolean {
  return insertOptions(collection).some((option) => option.kind === "upload");
}

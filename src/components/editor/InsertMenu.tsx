"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusIcon } from "lucide-react";
import { collectionOf, type CollectionName } from "@/lib/editor/collections";
import { VIDEO_ACCEPT } from "@/lib/editor/uploads";
import { MDX_BLOCKS, specFor } from "./mdx-blocks";

type Props = {
  collection: CollectionName;
  editor: Editor;
  onUploadImage: (file: File) => Promise<void>;
  onUploadVideo: (file: File) => Promise<void>;
};

/**
 * The `+` that sits in the left margin of an empty paragraph, exactly where
 * Medium puts it. `/` on an empty line opens the same menu.
 */
/** The `+` only belongs on a line with nothing on it yet. */
function onEmptyParagraph(editor: Editor): boolean {
  const { $from, empty } = editor.state.selection;
  return empty && $from.parent.type.name === "paragraph" && $from.parent.content.size === 0;
}

export function InsertMenu({ collection, editor, onUploadImage, onUploadVideo }: Props) {
  // What the collection can actually render. An Issue is Markdown on its way
  // to an inbox: an MDX block, an upload and a fenced code block all reach the
  // archive page and none of them reach the email, so the menu leaves them out
  // rather than offering a block that disappears on the way out.
  const { mdxBlocks } = collectionOf(collection);
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState<number | null>(null);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (!onEmptyParagraph(editor)) {
        setTop(null);
        setOpen(false);
        return;
      }

      const box = anchor.current?.getBoundingClientRect();
      const caret = editor.view.coordsAtPos(editor.state.selection.$from.pos);
      setTop(box ? caret.top - box.top : null);
    };

    const openOnSlash = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      if (onEmptyParagraph(editor)) {
        event.preventDefault();
        setOpen(true);
      }
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    editor.view.dom.addEventListener("keydown", openOnSlash);
    update();

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      editor.view.dom.removeEventListener("keydown", openOnSlash);
    };
  }, [editor]);

  const insertMdx = (name: string) => {
    const spec = specFor(name);
    if (!spec) return;
    setOpen(false);
    editor
      .chain()
      .focus()
      .insertContent({
        type: "mdxBlock",
        attrs: { name: spec.name, attributes: spec.attributes },
        ...(spec.selfClosing
          ? {}
          : { content: [{ type: "paragraph", content: [{ type: "text", text: "…" }] }] }),
      })
      .run();
  };

  /** The two file pickers: label, what it offers, and where the file goes. */
  const uploads: Array<[string, string, (file: File) => Promise<void>]> = mdxBlocks
    ? [
        ["圖片（上傳）", "image/*", onUploadImage],
        ["影片（上傳短片）", VIDEO_ACCEPT, onUploadVideo],
      ]
    : [];

  /** Blocks an email cannot carry: the MDX components, and a fenced code block. */
  const rich: Array<[string, () => void]> = [
    ...MDX_BLOCKS.map(
      (block) => [block.label, () => insertMdx(block.name)] as [string, () => void],
    ),
    ["程式碼區塊", () => (setOpen(false), editor.chain().focus().toggleCodeBlock().run())],
  ];

  /** Plain Markdown, which every collection renders — inbox included. */
  const prose: Array<[string, () => void]> = [
    [
      "Pull quote（>>）",
      () => {
        setOpen(false);
        editor.chain().focus().toggleBlockquote().toggleBlockquote().run();
      },
    ],
    ["分隔線", () => (setOpen(false), editor.chain().focus().setHorizontalRule().run())],
  ];

  const actions = mdxBlocks ? [...rich, ...prose] : prose;

  return (
    <div ref={anchor} className="pointer-events-none absolute inset-0">
      {top !== null && (
        <div
          className="pointer-events-auto absolute -left-12 font-sans"
          style={{ top: `${top - 4}px` }}
        >
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              aria-label="Insert"
              render={<Button variant="outline" size="icon-sm" className="rounded-full" />}
            >
              <PlusIcon />
            </PopoverTrigger>

            <PopoverContent align="start" side="right" className="w-64 p-1">
              {uploads.map(([label, accept, run]) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {label}
                  <input
                    type="file"
                    accept={accept}
                    hidden
                    onChange={async (event) => {
                      const selected = event.target.files?.[0];
                      event.target.value = "";
                      setOpen(false);
                      if (selected) await run(selected);
                    }}
                  />
                </label>
              ))}
              {actions.map(([label, run]) => (
                <Button
                  key={label}
                  variant="ghost"
                  className="w-full justify-start font-normal"
                  onClick={run}
                >
                  {label}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

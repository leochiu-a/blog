"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusIcon } from "lucide-react";
import { MDX_BLOCKS, specFor } from "./mdx-blocks";

type Props = {
  editor: Editor;
  onUploadImage: (file: File) => Promise<void>;
};

/**
 * The `+` that sits in the left margin of an empty paragraph, exactly where
 * Medium puts it. `/` on an empty line opens the same menu.
 */
export function InsertMenu({ editor, onUploadImage }: Props) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState<number | null>(null);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const { $from, empty } = editor.state.selection;
      const isEmptyParagraph =
        empty && $from.parent.type.name === "paragraph" && $from.parent.content.size === 0;

      if (!isEmptyParagraph) {
        setTop(null);
        setOpen(false);
        return;
      }

      const box = anchor.current?.getBoundingClientRect();
      const caret = editor.view.coordsAtPos($from.pos);
      setTop(box ? caret.top - box.top : null);
    };

    const openOnSlash = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const { $from, empty } = editor.state.selection;
      if (empty && $from.parent.type.name === "paragraph" && $from.parent.content.size === 0) {
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

  const actions: Array<[string, () => void]> = [
    ...MDX_BLOCKS.map(
      (block) => [block.label, () => insertMdx(block.name)] as [string, () => void],
    ),
    [
      "Pull quote（>>）",
      () => {
        setOpen(false);
        editor.chain().focus().toggleBlockquote().toggleBlockquote().run();
      },
    ],
    ["程式碼區塊", () => (setOpen(false), editor.chain().focus().toggleCodeBlock().run())],
    ["分隔線", () => (setOpen(false), editor.chain().focus().setHorizontalRule().run())],
  ];

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
              <label className="flex cursor-pointer items-center rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                圖片（上傳）
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (event) => {
                    const selected = event.target.files?.[0];
                    event.target.value = "";
                    setOpen(false);
                    if (selected) await onUploadImage(selected);
                  }}
                />
              </label>
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

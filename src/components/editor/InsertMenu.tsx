"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusIcon } from "lucide-react";
import type { CollectionName } from "@/lib/editor/collections";
import {
  insertOptions,
  type InsertCommand,
  type InsertOption,
  type UploadOption,
} from "./insert-options";
import { mdxNodeType, specFor } from "@/lib/editor/mdx-blocks";

type Props = {
  collection: CollectionName;
  editor: Editor;
  onUploadImage: (file: File) => Promise<void>;
  onUploadVideo: (file: File) => Promise<void>;
  /** Rejects with the reason the link could not be read, which the menu shows. */
  onInsertLink: (url: string) => Promise<void>;
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

/** The commands with nothing to configure, keyed by the option that names one. */
const COMMANDS: Record<InsertCommand, (editor: Editor) => void> = {
  codeBlock: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  // Twice, because the first call only extends the blockquote the caret is in.
  pullQuote: (editor) => editor.chain().focus().toggleBlockquote().toggleBlockquote().run(),
  horizontalRule: (editor) => editor.chain().focus().setHorizontalRule().run(),
};

export function InsertMenu({
  collection,
  editor,
  onUploadImage,
  onUploadVideo,
  onInsertLink,
}: Props) {
  // What this collection may insert lives in `insert-options`, which is where
  // the reasoning about what an email can carry belongs.
  const options = insertOptions(collection);
  const [open, setOpen] = useState(false);
  // Set while a block that needs a URL has been picked but not yet given one.
  const [asking, setAsking] = useState(false);
  const [url, setUrl] = useState("");
  const [reading, setReading] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [top, setTop] = useState<number | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const urlField = useRef<HTMLInputElement>(null);

  // Focus follows the control the user just opened, the way the link field in
  // `BubbleToolbar` does.
  useEffect(() => {
    if (asking) urlField.current?.focus();
  }, [asking]);

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
    editor
      .chain()
      .focus()
      .insertContent({
        type: mdxNodeType(spec.name),
        attrs: { name: spec.name, attributes: spec.attributes },
        ...(spec.selfClosing
          ? {}
          : { content: [{ type: "paragraph", content: [{ type: "text", text: "…" }] }] }),
      })
      .run();
  };

  const uploads = options.filter((option): option is UploadOption => option.kind === "upload");
  const actions = options.filter((option) => option.kind !== "upload");

  const run = (option: InsertOption) => {
    // The one option that cannot act on a press alone: there is nothing to
    // insert until it is told which page to read.
    if (option.kind === "link") {
      setAsking(true);
      setUrl("");
      setFailure(null);
      return;
    }

    setOpen(false);
    if (option.kind === "mdx") insertMdx(option.block);
    if (option.kind === "command") COMMANDS[option.command](editor);
  };

  /**
   * The wait is somebody else's server, so it is shown here rather than
   * swallowed: the menu stays open with the URL still in it, and a failure
   * lands under the field that caused it — close enough to fix the typo and
   * try again.
   */
  const readLink = async () => {
    const target = url.trim();
    if (target === "" || reading) return;

    setReading(true);
    setFailure(null);
    try {
      await onInsertLink(target);
      setOpen(false);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "讀取失敗");
    } finally {
      setReading(false);
    }
  };

  return (
    <div ref={anchor} className="pointer-events-none absolute inset-0">
      {top !== null && (
        <div
          className="pointer-events-auto absolute -left-12 font-sans"
          style={{ top: `${top - 4}px` }}
        >
          <Popover
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              // Closing the menu abandons whatever was half-typed in it; the
              // next `+` should offer the list again, not a stale field.
              if (!next) setAsking(false);
            }}
          >
            <PopoverTrigger
              aria-label="Insert"
              render={<Button variant="outline" size="icon-sm" className="rounded-full" />}
            >
              <PlusIcon />
            </PopoverTrigger>

            <PopoverContent align="start" side="right" className="w-64 p-1">
              {asking ? (
                <div className="flex flex-col gap-2 p-2 font-sans">
                  <Input
                    ref={urlField}
                    type="url"
                    inputMode="url"
                    placeholder="https://… 或 /blog/…"
                    value={url}
                    disabled={reading}
                    onChange={(event) => setUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      void readLink();
                    }}
                  />
                  {failure !== null && (
                    <p className="text-xs leading-relaxed text-destructive">{failure}</p>
                  )}
                  <Button
                    size="sm"
                    disabled={reading || url.trim() === ""}
                    onClick={() => void readLink()}
                  >
                    {reading ? "讀取中…" : "插入"}
                  </Button>
                </div>
              ) : (
                <>
                  {uploads.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {option.label}
                      <input
                        type="file"
                        accept={option.accept}
                        hidden
                        onChange={async (event) => {
                          const selected = event.target.files?.[0];
                          event.target.value = "";
                          setOpen(false);
                          if (!selected) return;
                          await (option.target === "video"
                            ? onUploadVideo(selected)
                            : onUploadImage(selected));
                        }}
                      />
                    </label>
                  ))}
                  {actions.map((option) => (
                    <Button
                      key={option.id}
                      variant="ghost"
                      className="w-full justify-start font-normal"
                      onClick={() => run(option)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  QuoteIcon,
  StrikethroughIcon,
} from "lucide-react";

/**
 * The only chrome that appears while writing: a Medium-style toolbar that
 * shows up on a selection and disappears the moment it collapses.
 */
export function BubbleToolbar({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState("");
  const linkField = useRef<HTMLInputElement>(null);

  // Focus follows the control the user just opened.
  useEffect(() => {
    if (linking) linkField.current?.focus();
  }, [linking]);

  const surface =
    "flex items-center gap-0.5 rounded-md border bg-popover p-1 text-popover-foreground shadow-md";

  /**
   * The URL is typed into the toolbar rather than a `window.prompt`: browsers
   * suppress native dialogs in enough contexts that the button would silently
   * do nothing. ProseMirror keeps the selection while the input has focus, so
   * the chain still applies to the text that was highlighted.
   */
  if (linking) {
    const apply = () => {
      setLinking(false);
      if (href.trim() === "") editor.chain().focus().unsetLink().run();
      else editor.chain().focus().setLink({ href: href.trim() }).run();
    };

    return (
      <BubbleMenu editor={editor} className={surface}>
        <Input
          ref={linkField}
          value={href}
          placeholder="https://…"
          onChange={(event) => setHref(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
            if (event.key === "Escape") setLinking(false);
          }}
          className="w-56 border-0 shadow-none focus-visible:ring-0"
        />
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(event) => event.preventDefault()}
          onClick={apply}
        >
          {href.trim() === "" ? "remove" : "apply"}
        </Button>
      </BubbleMenu>
    );
  }

  const action = (label: string, Icon: typeof BoldIcon, active: boolean, run: () => void) => (
    <Button
      key={label}
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={run}
    >
      <Icon />
    </Button>
  );

  return (
    <BubbleMenu
      editor={editor}
      className={surface}
      shouldShow={({ editor: instance, from, to }) =>
        from !== to && !instance.isActive("codeBlock") && !instance.isActive("unknownBlock")
      }
    >
      {action("bold", BoldIcon, editor.isActive("bold"), () =>
        editor.chain().focus().toggleBold().run(),
      )}
      {action("italic", ItalicIcon, editor.isActive("italic"), () =>
        editor.chain().focus().toggleItalic().run(),
      )}
      {action("strikethrough", StrikethroughIcon, editor.isActive("strike"), () =>
        editor.chain().focus().toggleStrike().run(),
      )}
      {action("code", CodeIcon, editor.isActive("code"), () =>
        editor.chain().focus().toggleCode().run(),
      )}
      {action("link", LinkIcon, editor.isActive("link"), () => {
        setHref((editor.getAttributes("link").href as string | undefined) ?? "");
        setLinking(true);
      })}

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      <Button
        variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>
      {action("quote", QuoteIcon, editor.isActive("blockquote"), () =>
        editor.chain().focus().toggleBlockquote().run(),
      )}
    </BubbleMenu>
  );
}

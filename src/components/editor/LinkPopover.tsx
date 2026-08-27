"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { CheckIcon, CopyIcon, PencilIcon, UnlinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

/**
 * The anchor the cursor is sitting in, so the popover hangs off the link
 * itself the way Medium's does, rather than off the caret.
 */
function linkElementAt(editor: Editor): HTMLAnchorElement | null {
  const { from } = editor.state.selection;
  const { node } = editor.view.domAtPos(from);
  const element = node instanceof Element ? node : node.parentElement;
  return element?.closest("a") ?? null;
}

/**
 * Put the cursor in a link and its own controls appear: where it points, and
 * the three things you ever want from an existing link — copy it, change it,
 * take it off. The bubble toolbar covers making a link out of a selection;
 * this covers the link that is already there, which used to mean reselecting
 * the whole phrase before the toolbar would offer anything.
 */
export function LinkPopover({ editor }: { editor: Editor }) {
  // Both bits of local state are tied to the link they belong to rather than
  // held as bare flags, so moving the cursor to another link reopens the
  // popover closed and un-copied without an effect reaching in to reset it.
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [href, setHref] = useState("");
  const field = useRef<HTMLInputElement>(null);

  // Read through `useEditorState`: the popover is shown and hidden by a
  // ProseMirror plugin, which doesn't re-render React — without a subscription
  // the URL here is whatever it was when the editor last rendered for some
  // other reason.
  const current = useEditorState({
    editor,
    selector: ({ editor: instance }) =>
      (instance.getAttributes("link").href as string | undefined) ?? "",
  });
  const editing = editingLink === current;
  const copied = copiedLink === current;

  // Selected, not just focused: changing a link usually means replacing the
  // URL outright, so typing should overwrite it the way Medium's does.
  useEffect(() => {
    if (editing) field.current?.select();
  }, [editing]);

  /**
   * `extendMarkRange` leaves the whole link selected, which hands the surface
   * over to the selection toolbar the moment you finish. Collapsing back to
   * where the cursor was keeps this popover on screen, showing the URL you
   * just set — the same thing Medium does.
   */
  const applyHref = (next: string) => {
    const { from } = editor.state.selection;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (next === "") chain.unsetLink();
    else chain.setLink({ href: next });
    chain.setTextSelection(from).run();
  };

  const apply = () => {
    setEditingLink(null);
    applyHref(href.trim());
  };

  const copy = async () => {
    await navigator.clipboard.writeText(current);
    setCopiedLink(current);
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="linkPopover"
      getReferencedVirtualElement={() => linkElementAt(editor)}
      // Below the link, like Medium: above, it covers the line you were
      // reading to get here.
      options={{ placement: "bottom-start", offset: 6, flip: false }}
      shouldShow={({ editor: instance, from, to }) =>
        from === to && instance.isActive("link") && !instance.isActive("codeBlock")
      }
      className="flex items-center gap-0.5 rounded-md border bg-popover p-1 font-sans text-popover-foreground shadow-md"
    >
      {editing ? (
        <>
          <Input
            ref={field}
            value={href}
            placeholder="https://…"
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                apply();
              }
              if (event.key === "Escape") setEditingLink(null);
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
        </>
      ) : (
        <>
          {/* The URL is the popover's subject, so it reads as one — and opens,
              since `openOnClick` is off inside the editor. */}
          <a
            href={current}
            target="_blank"
            rel="noreferrer"
            className="max-w-56 shrink-0 truncate px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {current}
          </a>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={copied ? "Link copied" : "Copy link"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void copy()}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit link"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setHref(current);
              setEditingLink(current);
            }}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove link"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyHref("")}
          >
            <UnlinkIcon />
          </Button>
        </>
      )}
    </BubbleMenu>
  );
}

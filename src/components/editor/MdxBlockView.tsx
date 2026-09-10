"use client";

import { useId, useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { MdxAttribute } from "@/lib/editor/types";
import { editableAttributes, isSelfClosing } from "./mdx-blocks";
import { MediaPreview } from "./MediaPreview";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * An MDX component as it appears in the editor: the frame around it, the form
 * its attributes are edited in — never raw JSX — and, for a component that
 * stands for a picture, the picture itself (see `MediaPreview`). Everything
 * else is a labelled container whose children stay editable rich text.
 */
export function MdxBlockView({
  editor,
  getPos,
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  // Every block on the page renders this same form, so the field index alone
  // repeats across them: with two panels open the labels all point at the first
  // block's fields.
  const formId = useId();
  const name = (node.attrs.name as string | null) ?? "";
  const attributes = (node.attrs.attributes as MdxAttribute[]) ?? [];
  const selfClosing = isSelfClosing(name);
  const value = (attribute: string) =>
    attributes.find((item) => item.name === attribute)?.value ?? "";

  // The two blocks a preview can be drawn for are the two that carry a caption,
  // and that caption is written under the preview instead of in the form.
  const preview = name === "Figure" || name === "Clip" ? name : null;
  // The block may not carry the attribute yet — a caption typed into an image
  // that never had one appends it.
  const captionField = attributes.find((item) => item.name === "caption") ?? {
    name: "caption",
    value: "",
    expression: null,
  };

  // Fields the spec declares but the file left out are appended, so a
  // component written without an optional attribute still offers it. The
  // caption is dropped where the preview already offers it, rather than
  // spelling out the same sentence in two places.
  const fields = editableAttributes(name, attributes).filter(
    (field) => !(preview !== null && field.name === "caption"),
  );

  const setAttribute = (field: MdxAttribute, next: string) => {
    const updated =
      field.expression !== null ? { ...field, expression: next } : { ...field, value: next };
    const index = attributes.indexOf(field);

    updateAttributes({
      attributes:
        index === -1
          ? [...attributes, updated]
          : attributes.map((attribute, position) => (position === index ? updated : attribute)),
    });
  };

  /**
   * Clicking a preview has to select the block *and* leave the editor holding
   * focus.
   *
   * `<video controls>` is a widget the browser focuses in its own right, so a
   * click on a clip left `document.activeElement` on the video — every
   * keystroke after that went to the video element, and Backspace did nothing,
   * however the document was selected. The block could only be removed with the
   * button.
   *
   * The select happens on click rather than pointerdown because ProseMirror's
   * own mousedown handling runs in between and would replace it; the browser has
   * already focused the video by then, on mousedown, so taking focus back here
   * is enough.
   */
  const selectBlock = () => {
    const position = getPos();
    if (position === undefined) return;
    editor.commands.setNodeSelection(position);
    // ProseMirror's own `view.focus()`, not TipTap's `focus` command: with a
    // node selected the command decides the editor is focused enough already
    // and returns without touching the DOM, leaving the keys with the video.
    editor.view.focus();
  };

  return (
    <NodeViewWrapper
      className={cn(
        // `outline` rather than `border`, and the label row is positioned
        // absolutely: neither takes up layout space, so at rest the block
        // occupies exactly the box it will occupy on the published page. The
        // frame is an editing affordance — it may not push the content around.
        "group relative my-6 rounded-lg outline-offset-8 transition-[outline-color]",
        selected
          ? "outline outline-1 outline-blog-accent"
          : "outline outline-1 outline-transparent hover:outline-dashed hover:outline-border",
      )}
    >
      <div
        className={cn(
          "absolute -top-8 left-0 right-0 flex items-center gap-2 font-sans transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setEditing((open) => !open)}>
          {editing ? "done" : "attrs"}
        </Button>
        <Button variant="ghost" size="sm" onClick={deleteNode}>
          remove
        </Button>
      </div>

      {preview !== null && value("src") !== "" && (
        <MediaPreview
          kind={preview}
          src={value("src")}
          poster={value("poster")}
          alt={value("alt")}
          caption={value("caption")}
          offered={selected}
          onCaptionChange={(caption) => setAttribute(captionField, caption)}
          onSelect={selectBlock}
        />
      )}

      {editing && (
        <FieldGroup className="not-prose mt-3 gap-3 rounded-md bg-muted/40 p-3 font-sans">
          {fields.map((attribute, index) => (
            <Field key={attribute.name ?? index} orientation="horizontal">
              <FieldLabel htmlFor={`${formId}-${index}`} className="w-24 shrink-0">
                {attribute.name}
              </FieldLabel>
              <AttributeInput
                id={`${formId}-${index}`}
                value={attribute.value ?? attribute.expression ?? ""}
                onChange={(next) => setAttribute(attribute, next)}
              />
            </Field>
          ))}
        </FieldGroup>
      )}

      <NodeViewContent
        className={cn("prose prose-lg prose-zinc max-w-none", selfClosing && "hidden")}
      />
    </NodeViewWrapper>
  );
}

/**
 * One attribute field.
 *
 * While the field has focus its own draft is what it shows, not the attribute.
 * `updateAttributes` re-renders the node view a beat after the attribute
 * changes — the same lag CodeBlockView computes `liveMeta()` around — so an
 * input bound straight to the attribute is handed its own previous value
 * mid-keystroke. React writes that stale value to the DOM, which drops the
 * caret at the end of the field, and typing anywhere but the end scrambles the
 * text. Blur hands authority back to the document, so an edit from anywhere
 * else still shows up.
 */
function AttributeInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Textarea
      id={id}
      // A caption is a sentence, and `alt` is a description: one line showed a
      // sliver of either. `field-sizing-content` grows the box with the text, so
      // a short attribute like a VideoEmbed's `title` still sits on one line.
      rows={1}
      className="min-h-8 resize-none py-1"
      value={draft ?? value}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(event.target.value);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

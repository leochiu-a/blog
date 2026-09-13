"use client";

import { useId, useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { MdxAttribute } from "@/lib/editor/types";
import { editableAttributes, HERO_ATTRIBUTE, isSelfClosing, supportsHero } from "./mdx-blocks";
import { MediaPreview } from "./MediaPreview";
import { useSetOgImage } from "./og-image";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const setOgImage = useSetOgImage();
  // Controlled, so the handler below can keep a press on the trigger out of it.
  const [explainingHero, setExplainingHero] = useState(false);
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
    (field) =>
      !(preview !== null && field.name === "caption") &&
      // `hero` has the toggle in the label row. Left in the form it would draw
      // an empty textarea — the attribute carries no value — and anything typed
      // into it would serialize as `hero="…"`, which is not what the published
      // component reads.
      field.name !== HERO_ATTRIBUTE,
  );

  const isHero = attributes.some((attribute) => attribute.name === HERO_ATTRIBUTE);

  /**
   * Mark this block as the post's hero, or stop being it.
   *
   * A post has one image above the fold, so turning this on takes the mark off
   * whichever Figure held it. Without that the button would let a writer set
   * three heroes, and the browser would be told to fetch all three eagerly at
   * high priority — which is the same as prioritising none of them.
   *
   * One transaction for all of it, so the swap is a single undo step and the
   * document is never briefly between heroes. Attribute changes leave the
   * document's shape alone, so the positions collected on the way through stay
   * valid as it is applied.
   *
   * No `source` bookkeeping: `serializeBody` decides a block is untouched by
   * re-serializing it and comparing, so changing an attribute invalidates the
   * replay by itself.
   *
   * Naming the hero also aims the share card at it. They are the same claim —
   * this is the picture the post is — pointed once inward and once outward,
   * and a writer who had to make it twice would sooner or later make it once.
   */
  const setHero = (next: boolean) => {
    const position = getPos();
    if (position === undefined) return;

    const { state } = editor;
    const tr = state.tr;

    if (next) {
      state.doc.descendants((child, childPos) => {
        if (child.type.name !== "mdxBlock" || childPos === position) return;
        const others = (child.attrs.attributes as MdxAttribute[]) ?? [];
        if (!others.some((attribute) => attribute.name === HERO_ATTRIBUTE)) return;
        tr.setNodeAttribute(
          childPos,
          "attributes",
          others.filter((attribute) => attribute.name !== HERO_ATTRIBUTE),
        );
      });
    }

    tr.setNodeAttribute(
      position,
      "attributes",
      next
        ? [...attributes, { name: HERO_ATTRIBUTE, value: null, expression: null }]
        : attributes.filter((attribute) => attribute.name !== HERO_ATTRIBUTE),
    );

    editor.view.dispatch(tr);

    // Only on the way on. Turning the hero off says this picture is no longer
    // the one above the fold, which is not the same as saying the post should
    // go back to the site's default card — and clearing a field the writer may
    // have set by hand is the more expensive guess to get wrong.
    if (next) setOgImage(value("src"));
  };

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
        {supportsHero(name) && (
          // Hover explains it, press toggles it — one control, one word.
          // Filtering the reason is what keeps a gesture to a single job:
          // without it a press would open the note too, so every time the
          // writer set the hero a panel would appear under their cursor
          // telling them what they had just done.
          <Popover
            open={explainingHero}
            onOpenChange={(open, details) => {
              if (details.reason === "trigger-press") return;
              setExplainingHero(open);
            }}
          >
            <PopoverTrigger
              openOnHover
              delay={300}
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  // A toggle, not a command: `aria-pressed` is what tells a
                  // screen reader this is a state the button holds rather
                  // than something it does, and it is the only signal a
                  // reader gets — the accent colour says the same thing to
                  // everyone else.
                  aria-pressed={isHero}
                  onClick={() => setHero(!isHero)}
                  className={cn(isHero && "text-blog-accent")}
                />
              }
            >
              hero
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-auto font-sans">
              <PopoverDescription>Loads eagerly at high priority</PopoverDescription>
            </PopoverContent>
          </Popover>
        )}
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

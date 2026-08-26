"use client";

import { useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { MdxAttribute } from "@/lib/editor/types";
import { editableAttributes, isSelfClosing, specFor } from "./mdx-blocks";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * An MDX component as it appears in the editor: the real thing where that is
 * cheap (an image), otherwise a labelled container whose children stay
 * editable rich text. Attributes are edited in a small form, never as raw JSX.
 */
export function MdxBlockView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const name = (node.attrs.name as string | null) ?? "";
  const attributes = (node.attrs.attributes as MdxAttribute[]) ?? [];
  const selfClosing = isSelfClosing(name);
  const value = (attribute: string) =>
    attributes.find((item) => item.name === attribute)?.value ?? "";

  // Fields the spec declares but the file left out are appended, so a
  // component written without an optional attribute still offers it.
  const fields = editableAttributes(name, attributes);

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
        <Badge variant="secondary">{specFor(name)?.label ?? name}</Badge>
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setEditing((open) => !open)}>
          {editing ? "done" : "attrs"}
        </Button>
        <Button variant="ghost" size="sm" onClick={deleteNode}>
          remove
        </Button>
      </div>

      {name === "Figure" &&
        value("src") !== "" && (
          // Deliberately a plain <img>: this preview never ships, and next/image
          // would demand configuration for paths that may not exist yet.
          <figure className="not-prose">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value("src")}
              alt={value("alt")}
              className="mx-auto h-auto w-full rounded-sm"
            />
            {value("caption") !== "" && (
              <figcaption className="mt-3 text-center font-sans text-sm text-muted-foreground">
                {value("caption")}
              </figcaption>
            )}
          </figure>
        )}

      {editing && (
        <FieldGroup className="not-prose mt-3 gap-3 rounded-md bg-muted/40 p-3 font-sans">
          {fields.map((attribute, index) => (
            <Field key={attribute.name ?? index} orientation="horizontal">
              <FieldLabel htmlFor={`mdx-attr-${index}`} className="w-24 shrink-0">
                {attribute.name}
              </FieldLabel>
              <Input
                id={`mdx-attr-${index}`}
                value={attribute.value ?? attribute.expression ?? ""}
                onChange={(event) => setAttribute(attribute, event.target.value)}
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

"use client";

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NO_LANGUAGE, languageOptions } from "@/lib/editor/code-languages";
import { hasLineNumbers, toggleLineNumbers } from "@/lib/editor/code-block-meta";
import { cn } from "@/lib/utils";

/**
 * A code block in the editor, with its own options row — the same shape
 * MdxBlockView uses: a label on the left saying what the block is, actions on
 * the right, the row sitting above the block and appearing on hover.
 *
 * The row lives inside the wrapper on purpose. An overlay positioned next to
 * the block instead of inside it has to track the pointer itself, and then
 * moving the mouse from the block towards the control reads as leaving the
 * block — the control disappears just before the click lands.
 *
 * `pre > code` is kept as the markup so the highlighting decorations
 * (CodeBlockLowlight) and the line-number gutter (`lib/editor/line-numbers.ts`)
 * land where the stylesheets expect them.
 */
export function CodeBlockView({ node, updateAttributes, selected, view, getPos }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? "";
  const meta = (node.attrs.meta as string | null) ?? null;
  const numbered = hasLineNumbers(meta);

  /**
   * The meta as the document has it right now, not as this render saw it.
   *
   * React re-renders a node view a beat after the attribute changes, so two
   * quick clicks would otherwise both compute their next value from the same
   * stale meta and the second would undo nothing.
   */
  const liveMeta = (): string | null => {
    const pos = getPos();
    const current = typeof pos === "number" ? view.state.doc.nodeAt(pos) : null;
    return ((current ?? node).attrs.meta as string | null) ?? null;
  };

  return (
    <NodeViewWrapper
      className={cn(
        // The frame is an editing affordance, so it uses `outline` and an
        // absolutely-positioned row: at rest the block takes up exactly the box
        // it will take up on the published page.
        "group relative my-6 rounded-lg outline-offset-4 transition-[outline-color]",
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
        // The row overlaps the block above it while hidden; don't let it swallow
        // clicks meant for that block.
        contentEditable={false}
      >
        <Select
          value={language}
          onValueChange={(value) =>
            // A bare fence is `null`, not an empty string: that's the
            // attribute's default, and what the serializer writes as ```` ``` ````.
            updateAttributes({ language: value === NO_LANGUAGE ? null : value })
          }
        >
          <SelectTrigger size="sm" aria-label="程式語言">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {languageOptions(language === NO_LANGUAGE ? null : language).map((option) => (
                <SelectItem key={option} value={option}>
                  {option === NO_LANGUAGE ? "無語言" : option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={numbered}
          onClick={() => updateAttributes({ meta: toggleLineNumbers(liveMeta()) })}
        >
          {numbered ? "隱藏行號" : "顯示行號"}
        </Button>
      </div>

      <pre className="my-0">
        {/* The type argument is explicit because `as` is `NoInfer`, so the tag
            can't be inferred from the prop.

            The `language-*` class is set by hand: a node view replaces the
            node's own `renderHTML`, which is where CodeBlockLowlight's
            `languageClassPrefix` would otherwise put it. */}
        <NodeViewContent<"code">
          as="code"
          className={language === NO_LANGUAGE ? undefined : `language-${language}`}
        />
      </pre>
    </NodeViewWrapper>
  );
}

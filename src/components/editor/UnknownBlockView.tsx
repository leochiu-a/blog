"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { FileCodeIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Markdown the editor has no rich representation for — raw HTML, footnotes,
 * MDX expressions. It is shown read-only and written back untouched, so an
 * editing session can never quietly delete something it didn't understand.
 */
export function UnknownBlockView({ node }: NodeViewProps) {
  const mdast = node.attrs.mdast as { type?: string; value?: string } | null;

  return (
    <NodeViewWrapper className="not-prose my-6 font-sans">
      <Alert>
        <FileCodeIcon />
        <AlertTitle>{mdast?.type ?? "raw"} · 保留原樣</AlertTitle>
        {mdast?.value && (
          <AlertDescription>
            <pre className="overflow-x-auto text-xs">{mdast.value}</pre>
          </AlertDescription>
        )}
      </Alert>
    </NodeViewWrapper>
  );
}

"use client";

import { Suspense } from "react";
import { demoElement } from "@/components/mdx/demos";

/**
 * The published demo, live, so a writer can try it where it sits in the post.
 * None of the demos may read the post collection — see `LinkCardView` for
 * what that does to the editor.
 */
export function EditorDemo({ name }: { name: string }) {
  return (
    <Suspense fallback={<div className="my-10 h-40 rounded-xl border border-border bg-muted/40" />}>
      {demoElement(name)}
    </Suspense>
  );
}

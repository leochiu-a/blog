"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import { createExtensions } from "@/lib/editor/extensions";
import type { PmNode, PostDocument } from "@/lib/editor/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { readText, withField } from "@/lib/editor/frontmatter-fields";
import { cn } from "@/lib/utils";
import { BubbleToolbar } from "./BubbleToolbar";
import { HeadingField } from "./HeadingField";
import { CodeBlockView } from "./CodeBlockView";
import { InsertMenu } from "./InsertMenu";
import { MdxBlockView } from "./MdxBlockView";
import { PublishButton } from "./PublishButton";
import { SettingsPanel } from "./SettingsPanel";
import { UnknownBlockView } from "./UnknownBlockView";
import { useAutosave } from "./useAutosave";

const STATUS_LABEL = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
} as const;

async function save(slug: string, document: PostDocument) {
  const response = await fetch(`/api/editor/posts/${slug}/`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ document }),
  });
  if (!response.ok) throw new Error(await response.text());
}

export function PostEditor({
  slug,
  initialDocument,
}: {
  slug: string;
  initialDocument: PostDocument;
}) {
  const [frontmatter, setFrontmatter] = useState(initialDocument.frontmatter);
  const [showSettings, setShowSettings] = useState(false);

  const { status, schedule } = useAutosave((document) => save(slug, document));

  const extensions = useMemo(
    () => [
      ...createExtensions({
        mdxBlock: () => ReactNodeViewRenderer(MdxBlockView),
        unknownBlock: () => ReactNodeViewRenderer(UnknownBlockView),
        codeBlock: () => ReactNodeViewRenderer(CodeBlockView),
      }),
      Placeholder.configure({ placeholder: "開始寫…" }),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: initialDocument.doc,
    immediatelyRender: false,
    editorProps: { attributes: { class: "outline-none" } },
  });

  /** One place that assembles what gets written to disk. */
  const scheduleSave = useCallback(
    (next: Partial<PostDocument>) => {
      if (!editor) return;
      schedule({
        frontmatterSource: initialDocument.frontmatterSource,
        frontmatter,
        doc: editor.getJSON() as PmNode,
        ...next,
      });
    },
    [editor, frontmatter, initialDocument.frontmatterSource, schedule],
  );

  const updateFrontmatter = useCallback(
    (next: Record<string, unknown>) => {
      setFrontmatter(next);
      scheduleSave({ frontmatter: next });
    },
    [scheduleSave],
  );

  const uploadImage = useCallback(
    async (file: File) => {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/editor/images/", { method: "POST", body });
      if (!response.ok || !editor) return;

      const { src } = (await response.json()) as { src: string };
      const bitmap = await createImageBitmap(file);

      editor
        .chain()
        .focus()
        .insertContent({
          type: "mdxBlock",
          attrs: {
            name: "Figure",
            attributes: [
              { name: "src", value: src, expression: null },
              { name: "alt", value: "", expression: null },
              { name: "width", value: null, expression: String(bitmap.width) },
              { name: "height", value: null, expression: String(bitmap.height) },
            ],
          },
        })
        .run();
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => scheduleSave({});
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, scheduleSave]);

  const isProfessional = frontmatter.category === "professional";

  return (
    <div className={cn("min-h-screen", isProfessional && "dark")}>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/90 px-6 py-2 font-sans text-sm backdrop-blur">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/editor" />}>
          ← Posts
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <span className="flex-1 truncate text-muted-foreground">{slug}</span>
        <span
          className={cn(
            "text-xs tabular-nums",
            status === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {STATUS_LABEL[status]}
        </span>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/blog/${slug}/`} target="_blank" />}
        >
          Preview
        </Button>
        <PublishButton frontmatter={frontmatter} onChange={updateFrontmatter} />
        <Button variant="ghost" size="sm" onClick={() => setShowSettings((open) => !open)}>
          Settings
        </Button>
      </header>

      {/* Same column geometry as the reading view: the padding sits on <main>
          and the 728px cap on the track inside it, so a line wraps in the
          editor exactly where it wraps on the published page. */}
      <main className="flex w-full flex-col items-center px-6 pb-32 pt-10 font-garamond sm:px-10">
        <div className="w-full min-w-0 max-w-[45.5rem]">
          <HeadingField
            value={readText(frontmatter, "title")}
            onChange={(title) => updateFrontmatter(withField(frontmatter, "title", title))}
            onEnter={() => editor?.commands.focus("start")}
            placeholder="Title"
            className="font-sans text-4xl font-extrabold leading-tight tracking-tight placeholder:text-muted-foreground md:text-5xl"
          />
          <HeadingField
            value={readText(frontmatter, "subtitle")}
            onChange={(subtitle) => updateFrontmatter(withField(frontmatter, "subtitle", subtitle))}
            onEnter={() => editor?.commands.focus("start")}
            placeholder="Subtitle"
            className="mt-3 font-sans text-xl leading-snug text-muted-foreground placeholder:text-muted-foreground"
          />

          <div className="relative mt-6 border-t border-border pt-6 sm:mt-8 sm:pt-8">
            {editor && <InsertMenu editor={editor} onUploadImage={uploadImage} />}
            {editor && <BubbleToolbar editor={editor} />}
            <EditorContent
              editor={editor}
              className="prose prose-lg prose-zinc max-w-none [&_.is-empty]:before:pointer-events-none [&_.is-empty]:before:float-left [&_.is-empty]:before:h-0 [&_.is-empty]:before:text-muted-foreground [&_.is-empty]:before:content-[attr(data-placeholder)]"
            />
          </div>
        </div>
      </main>

      <SettingsPanel
        slug={slug}
        frontmatter={frontmatter}
        onChange={updateFrontmatter}
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}

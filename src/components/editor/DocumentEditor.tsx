"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import { apiPath, collectionOf, type CollectionName } from "@/lib/editor/collections";
import { createExtensions } from "@/lib/editor/extensions";
import type { Clip, PmNode, EditorDocument } from "@/lib/editor/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { readText, withField } from "@/lib/editor/frontmatter-fields";
import { type UploadProgress as Progress, uploadFile } from "@/lib/editor/upload";
import {
  addPlaceholder,
  insertAtPlaceholder,
  removePlaceholder,
} from "@/lib/editor/upload-placeholder";
import { cn } from "@/lib/utils";
import { BubbleToolbar } from "./BubbleToolbar";
import { HeadingField } from "./HeadingField";
import { LinkPopover } from "./LinkPopover";
import { CodeBlockView } from "./CodeBlockView";
import { EditorToc } from "./EditorToc";
import { InsertMenu } from "./InsertMenu";
import { MdxBlockView } from "./MdxBlockView";
import { PublishButton } from "./PublishButton";
import { SettingsPanel } from "./SettingsPanel";
import { UnknownBlockView } from "./UnknownBlockView";
import { UploadProgress } from "./UploadProgress";
import { useAutosave } from "./useAutosave";

const STATUS_LABEL = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
} as const;

/** The images and clips a paste or a drop carries, if any. */
function mediaFiles(data: DataTransfer | null) {
  return Array.from(data?.files ?? []).filter(
    (file) => file.type.startsWith("image/") || file.type.startsWith("video/"),
  );
}

async function save(collection: CollectionName, slug: string, document: EditorDocument) {
  const response = await fetch(apiPath(collection, slug), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ document }),
  });
  if (!response.ok) throw new Error(await response.text());
}

/** An upload in flight: the file, where it will land, and how far along it is. */
type Upload = {
  id: string;
  element: HTMLElement;
  name: string;
  size: number;
  processing: string;
  progress: Progress;
};

type SetUpload = Dispatch<SetStateAction<Upload | null>>;

/** Placeholder ids only have to be unique within one editing session. */
let placeholders = 0;

/**
 * Where the placeholder goes: beside the paragraph the caret is in, never
 * spliced into the middle of it.
 *
 * A clip is a block, and dropping a block inside a paragraph splits it — which
 * leaves an empty half behind, or, on an empty line, renders the widget
 * underneath that line's "開始寫…" placeholder and the `+` button in the margin.
 * At the start of a line the clip belongs above it, anywhere else below it.
 */
function placeholderPosition(view: EditorView): number {
  const { $from, empty } = view.state.selection;
  if (!empty || !$from.parent.isTextblock) return $from.pos;
  return $from.parentOffset === 0 ? $from.before() : $from.after();
}

/**
 * Starts one upload, drawn as a placeholder at the caret for as long as it
 * runs. `processing` names what the server does once the bytes are in, which is
 * a different wait per endpoint. The id it answers with is what the caller uses
 * to insert the result exactly where the placeholder ended up.
 */
function beginUpload<T>(
  view: EditorView,
  endpoint: string,
  file: File,
  processing: string,
  setUpload: SetUpload,
): { id: string; result: Promise<T> } {
  const id = String((placeholders += 1));
  const element = document.createElement("div");
  view.dispatch(addPlaceholder(view.state.tr, { id, pos: placeholderPosition(view), element }));

  const about = { id, element, name: file.name, size: file.size, processing };
  setUpload({ ...about, progress: { phase: "sending", ratio: 0 } });

  const result = uploadFile<T>(endpoint, file, (progress) =>
    setUpload((current) => (current?.id === id ? { ...about, progress } : current)),
  );
  return { id, result };
}

/** Takes the placeholder down, however the upload ended. */
function endUpload(view: EditorView, id: string, setUpload: SetUpload): void {
  view.dispatch(removePlaceholder(view.state.tr, id));
  setUpload((current) => (current?.id === id ? null : current));
}

/**
 * The writing surface, for either collection. What a Post and an Issue do not
 * share — which API saves it, where it is previewed, which settings it has —
 * comes from the collection; everything about editing prose is the same.
 */
export function DocumentEditor({
  collection,
  slug,
  initialDocument,
}: {
  collection: CollectionName;
  slug: string;
  initialDocument: EditorDocument;
}) {
  const [frontmatter, setFrontmatter] = useState(initialDocument.frontmatter);
  const [showSettings, setShowSettings] = useState(false);
  // A refused upload — an oversized clip, above all — has to say so somewhere;
  // failing in silence looked exactly like a file that had not been picked yet.
  const [uploadError, setUploadError] = useState<string | null>(null);
  // So does an upload still running: a clip is uploaded whole and then
  // transcoded, which takes long enough that an editor showing nothing in the
  // meantime looks exactly like one that swallowed the file.
  const [upload, setUpload] = useState<Upload | null>(null);

  const { status, schedule } = useAutosave((document) => save(collection, slug, document));

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

  // Paste and drop want the very same upload path as the insert menu, but
  // editorProps is built once, before the upload callbacks exist — so they reach
  // them through a ref an effect below keeps pointed at the live closures.
  const uploadFiles = useRef<(files: File[]) => void>(() => {});

  const editor = useEditor({
    extensions,
    content: initialDocument.doc,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "outline-none" },
      handlePaste: (_view, event) => {
        const files = mediaFiles(event.clipboardData);
        if (files.length === 0) return false;
        uploadFiles.current(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        // A drag within the document is ProseMirror's own move; only files
        // arriving from outside are ours to upload.
        if (moved) return false;
        const files = mediaFiles(event.dataTransfer);
        if (files.length === 0) return false;

        // Drop where the cursor landed, not where the selection happened to be.
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (at)
          view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, at.pos)));
        uploadFiles.current(files);
        return true;
      },
    },
  });

  /** One place that assembles what gets written to disk. */
  const scheduleSave = useCallback(
    (next: Partial<EditorDocument>) => {
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
      if (!editor) return;
      const { id, result } = beginUpload<{ src: string }>(
        editor.view,
        "/api/editor/images/",
        file,
        "處理中…",
        setUpload,
      );
      try {
        setUploadError(null);
        const { src } = await result;
        const bitmap = await createImageBitmap(file);

        insertAtPlaceholder(editor, id, {
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
        });
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "圖片上傳失敗");
      } finally {
        endUpload(editor.view, id, setUpload);
      }
    },
    [editor],
  );

  /**
   * A clip is uploaded as it was recorded — a 300MB QuickTime file is fine — and
   * comes back transcoded, with a poster and the size both files share. The one
   * ceiling is on the transcoded clip, which only the server can know, so
   * nothing is pre-checked here; an oversized clip returns 413 and its reason.
   */
  const uploadVideo = useCallback(
    async (file: File) => {
      if (!editor) return;
      const { id, result } = beginUpload<Clip>(
        editor.view,
        "/api/editor/videos/",
        file,
        "轉檔中…",
        setUpload,
      );
      try {
        setUploadError(null);
        const { src, poster, width, height } = await result;

        insertAtPlaceholder(editor, id, {
          type: "mdxBlock",
          attrs: {
            name: "Clip",
            attributes: [
              { name: "src", value: src, expression: null },
              { name: "poster", value: poster, expression: null },
              { name: "width", value: null, expression: String(width) },
              { name: "height", value: null, expression: String(height) },
            ],
          },
        });
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "影片上傳失敗");
      } finally {
        endUpload(editor.view, id, setUpload);
      }
    },
    [editor],
  );

  useEffect(() => {
    uploadFiles.current = (files) => {
      // Sequential: each upload inserts at the cursor, so order matters.
      void files.reduce(
        (previous, file) =>
          previous.then(() =>
            file.type.startsWith("video/") ? uploadVideo(file) : uploadImage(file),
          ),
        Promise.resolve(),
      );
    };
  }, [uploadImage, uploadVideo]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => scheduleSave({});
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, scheduleSave]);

  // The editor reads the way the page it writes reads: a professional Post is
  // dark and a personal one is light, and every newsletter page is dark.
  const isDark = collection === "issues" || frontmatter.category === "professional";

  return (
    <div className={cn("min-h-screen", isDark && "dark")}>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/90 px-6 py-2 font-sans text-sm backdrop-blur">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/editor" />}>
          ← {collectionOf(collection).label}
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
        {uploadError && (
          <button
            type="button"
            onClick={() => setUploadError(null)}
            title="點一下關閉"
            className="max-w-md truncate text-xs text-destructive"
          >
            {uploadError}
          </button>
        )}
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`${collectionOf(collection).previewBase}/${slug}/`} target="_blank" />
          }
        >
          Preview
        </Button>
        <PublishButton
          collection={collection}
          frontmatter={frontmatter}
          onChange={updateFrontmatter}
        />
        <Button variant="ghost" size="sm" onClick={() => setShowSettings((open) => !open)}>
          Settings
        </Button>
      </header>

      {/* Same column geometry as the reading view: the padding sits on <main>
          and the 728px cap on the track inside it, so a line wraps in the
          editor exactly where it wraps on the published page. */}
      {/* Outside <main>, because the rail is fixed to the viewport gutter
          rather than placed in the column — the same footing it has on the
          published page. */}
      {editor && <EditorToc editor={editor} />}

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
            {editor && (
              <InsertMenu editor={editor} onUploadImage={uploadImage} onUploadVideo={uploadVideo} />
            )}
            {editor && <BubbleToolbar editor={editor} />}
            {editor && <LinkPopover editor={editor} />}
            <EditorContent
              editor={editor}
              className="prose prose-lg prose-zinc max-w-none [&_.is-empty]:before:pointer-events-none [&_.is-empty]:before:float-left [&_.is-empty]:before:h-0 [&_.is-empty]:before:text-muted-foreground [&_.is-empty]:before:content-[attr(data-placeholder)]"
            />
          </div>
        </div>
      </main>

      {upload &&
        createPortal(
          <UploadProgress
            name={upload.name}
            size={upload.size}
            processing={upload.processing}
            progress={upload.progress}
          />,
          upload.element,
        )}

      <SettingsPanel
        collection={collection}
        slug={slug}
        frontmatter={frontmatter}
        onChange={updateFrontmatter}
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}

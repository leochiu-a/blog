"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * The form is drawn here rather than with `window.prompt`: browsers suppress
 * native dialogs in enough contexts that the button would silently do nothing.
 * It also lets the slug be shown and corrected before the file is created.
 */
export function NewPostButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const effectiveSlug = slugEdited ? slug : slugify(title);

  const reset = () => {
    setTitle("");
    setSlug("");
    setSlugEdited(false);
    setError(null);
  };

  const create = async () => {
    if (title.trim() === "" || effectiveSlug === "") {
      setError("標題與 slug 都不能空白");
      return;
    }

    setBusy(true);
    const response = await fetch("/api/editor/posts/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: effectiveSlug, title: title.trim() }),
    });
    setBusy(false);

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Could not create the post");
      return;
    }

    setOpen(false);
    reset();
    router.push(`/editor/${effectiveSlug}`);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>New post</PopoverTrigger>

      <PopoverContent align="end" className="w-72">
        <FieldGroup>
          <Field data-invalid={error !== null ? true : undefined}>
            <FieldLabel htmlFor="new-post-title">title</FieldLabel>
            <Input
              id="new-post-title"
              value={title}
              aria-invalid={error !== null ? true : undefined}
              onChange={(event) => {
                setTitle(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => event.key === "Enter" && void create()}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="new-post-slug">slug</FieldLabel>
            <Input
              id="new-post-slug"
              value={effectiveSlug}
              placeholder="my-new-post"
              className="font-mono text-xs"
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => event.key === "Enter" && void create()}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button size="sm" disabled={busy} onClick={() => void create()}>
              建立
            </Button>
          </div>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}

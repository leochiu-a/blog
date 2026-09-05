"use client";

import { useState } from "react";
import { collectionOf, type CollectionName } from "@/lib/editor/collections";
import { readFlag, type FrontmatterValues } from "@/lib/editor/frontmatter-fields";
import { SITE_URL } from "@/lib/site";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

/** How long the button reports its outcome before offering the copy again. */
const OUTCOME_FOR = 2000;

const LABEL = {
  idle: "Copy",
  copied: "Copied",
  failed: "Failed",
} as const;

/**
 * The deployed URL of a draft Post, ready to be sent to whoever should read it
 * before it is published.
 *
 * It sits in the settings panel, as a field showing the URL itself, because
 * that is where both of the products this editor is modelled on put it and
 * neither spends a toolbar button on it: Substack calls it the secret draft
 * link and keeps it in the post's settings, and Medium files "Share draft
 * link" under the editor's "…" menu. The toolbar is for what you do to the
 * document — preview it, publish it — and this is a fact about the document
 * you come looking for once.
 *
 * Showing the URL rather than only offering a copy is Substack's part of that:
 * it is what lets you see where the link points, and what to fall back on when
 * the browser refuses the clipboard.
 *
 * `SITE_URL` rather than `window.location.origin`: the link has to be worth
 * something on a machine that is not this one, so it points at the deployed
 * site, and the draft has to be committed and deployed for it to answer.
 *
 * Posts only. An Issue's draft stays invisible on the archive page: it is
 * written to be mailed, and the thing worth reviewing before a send is the
 * email, not the web copy of it.
 */
export function DraftLinkField({
  collection,
  slug,
  frontmatter,
}: {
  collection: CollectionName;
  slug: string;
  frontmatter: FrontmatterValues;
}) {
  const [state, setState] = useState<keyof typeof LABEL>("idle");

  if (collection !== "posts" || !readFlag(frontmatter, "draft")) return null;

  const url = `${SITE_URL}${collectionOf(collection).previewBase}/${slug}/`;

  // "failed" is a real state rather than a swallowed rejection: `writeText` is
  // refused outside a secure context, and a button that silently does nothing
  // leaves you with no idea whether the click landed. The URL is on screen
  // either way, so a refusal costs a manual selection rather than the link.
  const copy = async () => {
    await navigator.clipboard.writeText(url).then(
      () => setState("copied"),
      () => setState("failed"),
    );
    setTimeout(() => setState("idle"), OUTCOME_FOR);
  };

  return (
    <Field>
      <FieldLabel htmlFor="draft-link">draft link</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="draft-link"
          readOnly
          value={url}
          // Selects on focus, so keyboard copying is one shortcut rather than
          // a drag across a truncated field.
          onFocus={(event) => event.target.select()}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={copy}>{LABEL[state]}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>還沒發佈，deploy 之後拿到這條連結的人就讀得到。</FieldDescription>
    </Field>
  );
}

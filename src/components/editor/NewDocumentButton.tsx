"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPath, editorPath, type CollectionName } from "@/lib/editor/collections";
import { Button } from "@/components/ui/button";

/**
 * One click, one draft. The title is typed in place at the top of the editor,
 * so there is nothing to ask for here — the server names the file and we go
 * straight to it.
 *
 * The one thing that cannot be left for later is the category, because a
 * defaulted one reads as chosen and stays wrong. So a button belongs to the
 * list it adds to, and files the draft under that list's category: the choice
 * is made by where you clicked, without a question being asked.
 */
export function NewDocumentButton({
  collection,
  category,
  label,
}: {
  collection: CollectionName;
  category?: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const response = await fetch(apiPath(collection), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category }),
    });

    if (!response.ok) {
      setBusy(false);
      const body = (await response.json()) as { error?: string };
      window.alert(body.error ?? "Could not create the draft");
      return;
    }

    const { slug } = (await response.json()) as { slug: string };
    // Left busy on purpose: the navigation is what ends this state, so the
    // button can't be clicked into creating a second draft on the way out.
    router.push(editorPath(collection, slug));
  };

  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={() => void create()}>
      {label}
    </Button>
  );
}

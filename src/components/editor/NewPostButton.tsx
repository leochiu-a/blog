"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * One click, one draft. The title is typed in place at the top of the editor,
 * so there is nothing to ask for here — the server names the file and we go
 * straight to it.
 */
export function NewPostButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const response = await fetch("/api/editor/posts/", { method: "POST" });

    if (!response.ok) {
      setBusy(false);
      const body = (await response.json()) as { error?: string };
      window.alert(body.error ?? "Could not create the post");
      return;
    }

    const { slug } = (await response.json()) as { slug: string };
    // Left busy on purpose: the navigation is what ends this state, so the
    // button can't be clicked into creating a second draft on the way out.
    router.push(`/editor/${slug}`);
  };

  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={() => void create()}>
      New post
    </Button>
  );
}

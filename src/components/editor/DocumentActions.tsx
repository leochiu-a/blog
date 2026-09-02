"use client";

import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiPath, collectionOf, type CollectionName } from "@/lib/editor/collections";
import { Button } from "@/components/ui/button";

/**
 * The row's own actions, behind a "…" that is always on screen — a control you
 * have to find by hovering is a control you forget the list has.
 *
 * Deleting removes the file from disk, so it asks first: the confirmation is
 * the whole safety net here, there is no trash to restore from.
 */
export function DocumentActions({
  collection,
  slug,
  title,
}: {
  collection: CollectionName;
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    const response = await fetch(apiPath(collection, slug), { method: "DELETE" });
    setBusy(false);

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      window.alert(body.error ?? "Could not delete it");
      return;
    }

    setConfirming(false);
    router.refresh();
  };

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${title || slug}`}
              className="text-muted-foreground hover:text-foreground"
            />
          }
        >
          <MoreHorizontal />
        </Menu.Trigger>

        <Menu.Portal>
          {/* Portaled out of the editor's wrapper, so it asks for the sans stack itself. */}
          <Menu.Positioner align="end" side="bottom" sideOffset={4} className="isolate z-50">
            <Menu.Popup className="min-w-40 origin-(--transform-origin) rounded-lg bg-popover p-1 font-sans text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              <Menu.Item
                onClick={() => setConfirming(true)}
                className="flex cursor-default items-center rounded-md px-2 py-1.5 text-destructive outline-none select-none data-highlighted:bg-destructive/10"
              >
                Delete
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this?</AlertDialogTitle>
            <AlertDialogDescription>
              {title || slug} will be removed from {collectionOf(collection).directory}. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={busy} onClick={() => void remove()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

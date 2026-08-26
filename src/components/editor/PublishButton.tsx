"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  frontmatter: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
};

/**
 * Publishing lives in the toolbar, not in post settings: it is the one action
 * here with consequences outside the repo, and it is what you reach for when
 * the writing is done — the same place Medium and Substack put it.
 */
export function PublishButton({ frontmatter, onChange }: Props) {
  const isDraft = frontmatter.draft === true;

  const setDraft = (draft: boolean) => {
    const next = { ...frontmatter };
    // Removing the key is how a published post is written.
    if (draft) next.draft = true;
    else delete next.draft;
    onChange(next);
  };

  return (
    <>
      {isDraft && <Badge variant="secondary">Draft</Badge>}

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant={isDraft ? "default" : "outline"} size="sm" />}>
          {isDraft ? "Publish" : "Unpublish"}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isDraft ? "發佈這篇文章？" : "收回成草稿？"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isDraft
                ? "它會出現在首頁、文章頁與 RSS。"
                : "線上就看不到它了，只剩 next dev 看得到。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDraft(!isDraft)}>
              {isDraft ? "發佈" : "收回"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

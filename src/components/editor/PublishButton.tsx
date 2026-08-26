"use client";

import {
  readFlag,
  withField,
  without,
  type FrontmatterValues,
} from "@/lib/editor/frontmatter-fields";
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
  frontmatter: FrontmatterValues;
  onChange: (next: FrontmatterValues) => void;
};

/**
 * Publishing lives in the toolbar, not in post settings: it is the one action
 * here with consequences outside the repo, and it is what you reach for when
 * the writing is done — the same place Medium and Substack put it.
 */
export function PublishButton({ frontmatter, onChange }: Props) {
  const isDraft = readFlag(frontmatter, "draft");

  // Removing the key is how a published post is written.
  const setDraft = (draft: boolean) =>
    onChange(draft ? withField(frontmatter, "draft", true) : without(frontmatter, "draft"));

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

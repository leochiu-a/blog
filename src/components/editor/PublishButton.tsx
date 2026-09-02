"use client";

import { collectionOf, type CollectionName } from "@/lib/editor/collections";
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
  collection: CollectionName;
  frontmatter: FrontmatterValues;
  onChange: (next: FrontmatterValues) => void;
};

/**
 * What publishing means, per collection. A Post goes live on the site; an
 * Issue only becomes something the send script is willing to mail. Two
 * different promises, told in one sentence shape — what appears where, and
 * what stops appearing — so the dialog reads the same whichever you are in.
 */
const COPY = {
  posts: {
    publish: { title: "發佈這篇文章？", body: "它會出現在首頁、文章頁與 RSS。" },
    retract: { title: "收回成草稿？", body: "線上就看不到它了，只剩 next dev 看得到。" },
  },
  issues: {
    publish: { title: "發佈這一期？", body: "它會出現在電子報封存頁，也才寄得出去。" },
    retract: { title: "收回成草稿？", body: "封存頁就看不到它了，送信腳本也會拒絕寄出。" },
  },
} as const;

/**
 * Publishing lives in the toolbar, not in the settings panel: it is the one
 * action here with consequences outside the repo, and it is what you reach for
 * when the writing is done — the same place Medium and Substack put it.
 */
export function PublishButton({ collection, frontmatter, onChange }: Props) {
  const isDraft = readFlag(frontmatter, "draft");
  const copy = isDraft ? COPY[collection].publish : COPY[collection].retract;

  // Removing the key is how a published document is written.
  const setDraft = (draft: boolean) =>
    onChange(
      draft
        ? withField(frontmatter, "draft", true)
        : without(frontmatter, "draft", collectionOf(collection).requiredKeys),
    );

  return (
    <>
      {isDraft && <Badge variant="secondary">Draft</Badge>}

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant={isDraft ? "default" : "outline"} size="sm" />}>
          {isDraft ? "Publish" : "Unpublish"}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.body}</AlertDialogDescription>
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

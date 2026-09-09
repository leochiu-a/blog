"use client";

import { useState } from "react";
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
 *
 * English, like the rest of the editor's chrome: the buttons around it say
 * Preview, Publish, Settings, and the delete confirmation in `DocumentActions`
 * asks in English too. Only the writing inside a document is Chinese.
 */
const COPY = {
  posts: {
    publish: {
      title: "Publish this post?",
      body: "It appears on the home page, in the listing, and in the RSS feed.",
    },
    retract: {
      title: "Unpublish this post?",
      body: "It leaves the live site — only `next dev` can still see it.",
    },
  },
  issues: {
    publish: {
      title: "Publish this Issue?",
      body: "It joins the newsletter archive, and the send script will mail it.",
    },
    retract: {
      title: "Unpublish this Issue?",
      body: "It leaves the archive, and the send script will refuse to send it.",
    },
  },
} as const;

/**
 * Publishing lives in the toolbar, not in the settings panel: it is the one
 * action here with consequences outside the repo, and it is what you reach for
 * when the writing is done — the same place Medium and Substack put it.
 */
export function PublishButton({ collection, frontmatter, onChange }: Props) {
  // Controlled, because the confirm button has to close what it answered.
  // `AlertDialogAction` is a plain button rather than a Close, so an
  // uncontrolled dialog stayed open over a document it had already changed —
  // and the question it was still asking now had the wrong answer in it.
  const [confirming, setConfirming] = useState(false);
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

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogTrigger render={<Button variant={isDraft ? "default" : "outline"} size="sm" />}>
          {isDraft ? "Publish" : "Unpublish"}
        </AlertDialogTrigger>
        {/* `font-sans`, like the delete confirmation and the upload notice:
            the dialog is portalled to <body>, which is set in garamond for
            reading, and chrome asking a question there came out in the same
            face as the prose behind it. */}
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDraft(!isDraft);
                setConfirming(false);
              }}
            >
              {isDraft ? "Publish" : "Unpublish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

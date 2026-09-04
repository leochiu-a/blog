"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { CheckIcon, LinkIcon, MoreHorizontalIcon, Share2Icon } from "lucide-react";
import { FacebookMark, ThreadsMark, XMark } from "@/components/icons";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SITE_URL } from "@/lib/site";

interface SharePostProps {
  title: string;
  /** Absolute URL of the post — what every share target and the clipboard get. */
  url: string;
  /** The post's social card, already resolved to a path that exists. */
  image: string;
}

/** How long the copy tile reports its outcome before offering the copy again. */
const OUTCOME_FOR = 2000;

/**
 * What the copy tile is currently saying.
 *
 * "failed" is a real state rather than a swallowed rejection: `writeText`
 * refuses outside a secure context and can be denied outright, and a tile that
 * silently does nothing leaves the reader with no idea the click landed.
 */
type CopyState = "idle" | "copied" | "failed";

const COPY_TILE: Record<CopyState, string> = {
  idle: "複製連結",
  copied: "已複製",
  failed: "複製失敗",
};

/**
 * One tile in the share row: a round icon with its label under it.
 *
 * Every tile gets the same outlined disc and the same foreground glyph, so the
 * row reads as one set. Brand colour on the networks and not on the page's own
 * actions read as three designs sharing a row — and a brand palette cannot be
 * held to one contrast across a light post and a dark one anyway.
 *
 * Renders as a link when it has an `href` and a button otherwise, so copy and
 * the OS share sheet sit in the same row without being links to nowhere.
 */
function ShareTile({
  label,
  icon,
  href,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-full border border-muted-foreground/40 text-foreground transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-3 group-focus-visible:ring-ring/50 sm:size-14"
      >
        {icon}
      </span>
      <span className="font-sans text-[0.6875rem] text-muted-foreground sm:text-xs">{label}</span>
    </>
  );
  // `min-w-0` is what lets `flex-1` actually shrink: without it each column's
  // `min-width: auto` floors at its own content, and five fixed-width tiles
  // overflow the panel on a phone instead of dividing it.
  const className =
    "group flex min-w-0 flex-1 basis-0 cursor-pointer flex-col items-center gap-2 outline-none";

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/**
 * `navigator.share` is a capability, not state — it is whatever the browser
 * supports and never changes while the page is open. `useSyncExternalStore` is
 * how a client-only value like that is read without a mount effect: nothing to
 * subscribe to, and a server snapshot that keeps the first render honest.
 */
const subscribeToNothing = () => () => {};
const hasNativeShare = () => "share" in navigator;

/**
 * The share affordance on a post, and the panel it opens.
 *
 * A reader who wants to pass a post on already has the URL in the address bar,
 * so this exists for the two cases where that is awkward: a phone, where the
 * bar is hidden and the OS has a share sheet worth deferring to, and a network
 * that wants a pre-filled intent rather than a pasted link.
 *
 * The trigger is a text link rather than a button-shaped control, so it carries
 * the same weight as the byline it sits in. A pill there would be the heaviest
 * thing on the line and leave the row lopsided.
 *
 * Every network here is reached through its documented sharer URL, which needs
 * no SDK, script tag, or app id. That is the whole reason to prefer them over
 * each network's embedded share button.
 */
export function SharePost({ title, url, image }: SharePostProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const canShareNatively = useSyncExternalStore(
    subscribeToNothing,
    hasNativeShare,
    // The server has no `navigator`, and neither does the first client render:
    // both say "no", so the tile only appears once React is driving the DOM and
    // the markup can never disagree with the HTML that was sent.
    () => false,
  );

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = setTimeout(() => setCopyState("idle"), OUTCOME_FOR);
    return () => clearTimeout(timer);
  }, [copyState]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <Dialog>
      <DialogTrigger className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-sm text-muted-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-colors outline-none hover:text-foreground hover:decoration-foreground focus-visible:text-foreground">
        <Share2Icon className="size-4" />
        分享
      </DialogTrigger>

      <DialogContent className="gap-5 p-5">
        <DialogTitle className="text-center font-sans text-lg font-bold">分享這篇文章</DialogTitle>

        {/* The post as the sharer is about to send it. 1.91:1 with
            `object-cover`, because that is the crop the receiving network
            applies to `og:image` — showing the image at its own aspect would
            preview something nobody will see. The band under it carries the two
            lines every network shows: where it is from, and what it is called.
            Bordered because the fallback social card is pale and would
            otherwise melt into the panel on a light post. */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="relative aspect-[1200/630] w-full">
            <Image
              src={image}
              alt=""
              fill
              loading="lazy"
              sizes="(min-width: 640px) 26rem, 100vw"
              className="object-cover"
            />
          </div>
          <div className="border-t border-border bg-muted/50 px-4 py-3">
            <p className="font-sans text-xs text-muted-foreground">
              {SITE_URL.replace(/^https?:\/\//, "")}
            </p>
            <p className="mt-0.5 font-sans text-base font-semibold leading-snug">{title}</p>
          </div>
        </div>

        {/* Equal, non-wrapping columns. The count varies — four here, five
            where the OS offers a share sheet — and a wrapping row strands the
            last tile centred under the others. */}
        <div className="flex gap-x-1 sm:gap-x-3">
          <ShareTile
            label="Facebook"
            icon={<FacebookMark className="size-5 sm:size-6" />}
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          />
          <ShareTile
            label={COPY_TILE[copyState]}
            icon={
              copyState === "copied" ? (
                <CheckIcon className="size-5 sm:size-6" />
              ) : (
                <LinkIcon className="size-5 sm:size-6" />
              )
            }
            onClick={() => {
              navigator.clipboard.writeText(url).then(
                () => setCopyState("copied"),
                () => setCopyState("failed"),
              );
            }}
          />
          <ShareTile
            label="Threads"
            icon={<ThreadsMark className="size-5 sm:size-6" />}
            // Threads' intent takes only `text`, with no separate `url`
            // parameter, so the link goes inside the text or it does not
            // travel with the post at all.
            href={`https://www.threads.com/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`}
          />
          <ShareTile
            label="X"
            icon={<XMark className="size-5 sm:size-6" />}
            href={`https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`}
          />
          {canShareNatively && (
            <ShareTile
              label="更多"
              icon={<MoreHorizontalIcon className="size-5 sm:size-6" />}
              // A reader backing out of the OS sheet rejects the promise. That
              // is not an error worth surfacing anywhere.
              onClick={() => void navigator.share({ title, url }).catch(() => {})}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { generateStoryImage } from "@/lib/shareTemplate";

interface ShareToStoryButtonProps {
  title: string;
  subtitle?: string;
  date?: string;
  url: string;
}

/** Mobile-only share trigger — renders the post as a templated Story image
 * and hands it to the OS share sheet so the reader can post straight to
 * Instagram/Facebook Stories. `sm:hidden` because `navigator.share` with
 * files is a mobile-browser capability; desktop browsers don't support it. */
export function ShareToStoryButton({ title, subtitle, date, url }: ShareToStoryButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleShare() {
    setPending(true);
    try {
      const blob = await generateStoryImage({ title, subtitle, date, url });
      const file = new File([blob], "story.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, url });
      } else if (navigator.share) {
        // Browser can share text/links but not files — still lets the
        // reader pick Stories from the share sheet, just without the image.
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      // AbortError just means the reader dismissed the share sheet.
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed", error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={pending}
      aria-label="Share to story"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-gold disabled:opacity-50 sm:hidden"
    >
      <Share2 aria-hidden="true" size={18} strokeWidth={1.75} />
    </button>
  );
}

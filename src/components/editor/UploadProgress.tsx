import type { UploadProgress as Progress } from "@/lib/editor/upload";
import { cn } from "@/lib/utils";

/** A file size a person can read at a glance. */
function megabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * An upload in flight, drawn where the file is going to land.
 *
 * It holds the space the clip will take, so the document does not jump when the
 * clip arrives, and it borrows the geometry of what replaces it — same radius,
 * same full-column width — so the swap reads as one thing resolving rather than
 * two different boxes.
 *
 * Shape: a quiet tile with the state at its centre and the progress hairline
 * full-bleed along the bottom edge, which is how every video player on the web
 * says "loading". A dashed outline would say something else — dashed means
 * *missing* (a drop target), and this file is not missing, it is on its way.
 *
 * Hierarchy is the wait, then the file: the percentage — or, once the bytes are
 * in, the server's own step — is the one thing worth reading at a glance, so it
 * is the only line at full contrast.
 */
export function UploadProgress({
  name,
  size,
  processing,
  progress,
}: {
  name: string;
  size: number;
  processing: string;
  progress: Progress;
}) {
  const sending = progress.phase === "sending";
  const percent = sending ? Math.round(progress.ratio * 100) : 100;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-sm border bg-muted/60">
      <div className="flex min-h-32 flex-col items-center justify-center gap-1.5 px-6 py-8 font-sans">
        <span className="text-sm font-medium tabular-nums">
          {sending ? `${percent}%` : processing}
        </span>
        <span className="max-w-full truncate text-[0.6875rem] text-muted-foreground">
          {name} · {megabytes(size)}
        </span>
      </div>

      {/* 3px rather than 1px: at a hairline the accent reads as a stray border
          on the tile it sits inside. The track is the border colour, so the
          only saturated pixels in the block are the ones carrying progress. */}
      <div className="h-[3px] bg-border">
        <div
          className={cn(
            "h-full bg-blog-accent",
            sending ? "transition-[width] duration-150 ease-out" : "upload-stripe",
          )}
          style={sending ? { width: `${percent}%` } : undefined}
        />
      </div>
    </div>
  );
}

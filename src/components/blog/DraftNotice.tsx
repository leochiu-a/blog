/**
 * What a reader who followed a Draft Link needs to know before the first
 * paragraph: this is not published, and they are seeing it because someone
 * sent them the link (see lib/posts.ts).
 *
 * Rendered on the page rather than only in the editor, because the person it
 * is for is the one reading — a reviewer who has no way to tell an unfinished
 * post from a finished one otherwise, and who might quote it as published.
 */
export function DraftNotice() {
  return (
    <p className="mb-6 rounded-md border border-dashed border-border px-4 py-3 font-sans text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">Draft.</span> This post is not published yet —
      it is listed nowhere and only people with this link can read it.
    </p>
  );
}

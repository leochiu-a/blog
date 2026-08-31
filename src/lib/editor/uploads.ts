/**
 * The rules a clip upload has to satisfy, shared by the editor UI and the API
 * that receives the file — so the file picker offers exactly what the server
 * accepts, and both sides say the same thing about a clip that is too heavy.
 */

/** What a clip may arrive as. Everything is transcoded to mp4 on the way in. */
export const VIDEO_EXTENSIONS = new Set(["mov", "mp4", "webm"]);

/** What the file picker offers. Mirrors `VIDEO_EXTENSIONS`. */
export const VIDEO_ACCEPT = "video/quicktime,video/mp4,video/webm";

/**
 * The ceiling is on what lands in the repository, not on what you upload: a
 * screen recording straight off a Mac is hundreds of megabytes, and transcoding
 * is exactly the step that makes it publishable. Past this, the clip is simply
 * too long — git keeps every byte of every version of a binary forever.
 */
export const MAX_CLIP_BYTES = 5 * 1024 * 1024;

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

/**
 * Why a transcoded clip cannot be kept, or `null` when it fits. Returning the
 * sentence rather than throwing keeps the rule testable on its own, and leaves
 * the HTTP status to the caller.
 */
export function clipTooLarge(bytes: number): string | null {
  if (bytes <= MAX_CLIP_BYTES) return null;
  return `轉檔後仍有 ${megabytes(bytes)}，超過 ${megabytes(MAX_CLIP_BYTES)} 上限——片子太長了，剪短一點，或改用 VideoEmbed 引用外部影片`;
}

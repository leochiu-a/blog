/**
 * What a clip upload may be, shared by the editor UI and the API that receives
 * the file — so the file picker offers exactly what the server accepts.
 */

/** What a clip may arrive as. Everything is transcoded to mp4 on the way in. */
export const VIDEO_EXTENSIONS = new Set(["mov", "mp4", "webm"]);

/** What the file picker offers, derived from the extensions above. */
export const VIDEO_ACCEPT = [...VIDEO_EXTENSIONS].map((extension) => `.${extension}`).join(",");

/**
 * The ceiling is on what lands in the repository, not on what you upload: a
 * screen recording straight off a Mac is hundreds of megabytes, and transcoding
 * is exactly the step that makes it publishable. Past this, the clip is simply
 * too long — git keeps every byte of every version of a binary forever.
 */
export const MAX_CLIP_BYTES = 5 * 1024 * 1024;

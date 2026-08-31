import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * The published shape of every clip, whatever was uploaded.
 *
 * 1280 wide is twice the reading column, which is as much detail as a retina
 * screen can show there; 30fps and no audio because `Clip` plays muted and on a
 * loop, so a soundtrack is bytes nobody will ever hear. `+faststart` puts the
 * moov atom first, so playback can begin before the whole file has arrived.
 */
const VIDEO_ARGS = [
  "-an",
  "-vf",
  "scale='min(1280,iw)':-2:flags=lanczos,fps=30",
  "-c:v",
  "libx264",
  "-profile:v",
  "high",
  "-crf",
  "28",
  "-preset",
  "slow",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
];

/** Long enough for any clip worth embedding; short enough to notice a runaway. */
const TIMEOUT_MS = 120_000;

export class TranscodeError extends Error {}

async function ffmpeg(args: string[]): Promise<void> {
  try {
    await run("ffmpeg", ["-y", "-loglevel", "error", ...args], { timeout: TIMEOUT_MS });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENOENT") {
      throw new TranscodeError("找不到 ffmpeg，請先 `brew install ffmpeg`");
    }
    throw new TranscodeError("讀不到這支影片，可能是 ffmpeg 不認得的編碼");
  }
}

/**
 * Everything a clip needs, cut from the uploaded file by ffmpeg: an H.264 mp4,
 * and frame one of that mp4 as a PNG poster.
 *
 * ffmpeg works on files rather than pipes here — a QuickTime recording is not
 * seekable as a stream, and the poster pass has to read the mp4 back anyway.
 * The poster comes from the transcoded file, not the source, so it is already
 * the right size and nothing has to be scaled twice.
 */
export async function transcodeClip(
  extension: string,
  bytes: Uint8Array,
): Promise<{ video: Uint8Array; poster: Uint8Array }> {
  const directory = await mkdtemp(join(tmpdir(), "editor-clip-"));
  const source = join(directory, `source.${extension}`);
  const video = join(directory, "clip.mp4");
  const poster = join(directory, "poster.png");

  try {
    await writeFile(source, bytes);
    await ffmpeg(["-i", source, ...VIDEO_ARGS, video]);
    await ffmpeg(["-i", video, "-frames:v", "1", poster]);
    return { video: await readFile(video), poster: await readFile(poster) };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

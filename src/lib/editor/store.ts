import { constants } from "node:fs";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { stringify as stringifyYaml } from "yaml";
import { TranscodeError, transcodeClip } from "./transcode";
import { VIDEO_EXTENSIONS, clipTooLarge } from "./uploads";

/**
 * Every file operation the dev-only editor is allowed to perform, bound to a
 * project root. Nothing here takes a path from the client — only a slug or a
 * filename, both validated against a strict pattern — so a request can't reach
 * outside the two directories the editor owns.
 */

const POSTS_DIR = "src/content/blog";
const IMAGES_DIR = "public/blog-images";
const IMAGES_PUBLIC_PATH = "/blog-images";
const VIDEOS_DIR = "public/blog-videos";
const VIDEOS_PUBLIC_PATH = "/blog-videos";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"]);

/** What the editor needs to write a `<Clip>` block: both files, and their size. */
export type Clip = {
  src: string;
  poster: string;
  width: number;
  height: number;
};

export class EditorError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "EditorError";
  }
}

function assertSlug(slug: string): string {
  if (!SLUG.test(slug)) {
    throw new EditorError(`Invalid slug: ${JSON.stringify(slug)}`, 400);
  }
  return slug;
}

/**
 * The name an upload is allowed to land on disk under: slugified, extension
 * kept, and checked against the one set of types this kind of asset permits.
 */
function assetFilename(name: string, extensions: Set<string>, kind: string): string {
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    throw new EditorError(`Invalid filename: ${JSON.stringify(name)}`, 400);
  }

  const dot = name.lastIndexOf(".");
  const extension = dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
  if (!extensions.has(extension)) {
    throw new EditorError(`Unsupported ${kind} type: ${JSON.stringify(name)}`, 400);
  }

  const base = name
    .slice(0, dot)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // A name written entirely in Chinese slugifies to nothing, and refusing it
  // would mean refusing most files on this machine. Falling back to the kind
  // keeps the upload; `writeAsset` numbers the second one.
  return `${base === "" ? kind : base}.${extension}`;
}

/**
 * Re-encodes an upload as WebP, so a screenshot pasted into the editor lands in
 * the repository at a fraction of its PNG size. `animated` keeps every frame of
 * an animated GIF; SVG stays vector, and a WebP is already what we want, so
 * both pass straight through.
 */
async function toWebp(
  filename: string,
  bytes: Uint8Array,
): Promise<{ filename: string; contents: Uint8Array }> {
  const dot = filename.lastIndexOf(".");
  const extension = filename.slice(dot + 1);
  if (extension === "svg" || extension === "webp") return { filename, contents: bytes };

  try {
    const contents = await sharp(bytes, { animated: true }).webp().toBuffer();
    return { filename: `${filename.slice(0, dot)}.webp`, contents };
  } catch {
    throw new EditorError(`Could not read the image: ${JSON.stringify(filename)}`, 400);
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function createPostStore(root: string) {
  const postPath = (slug: string) => join(root, POSTS_DIR, `${assertSlug(slug)}.md`);

  async function read(slug: string): Promise<string> {
    const path = postPath(slug);
    if (!(await exists(path))) throw new EditorError(`Post not found: ${slug}`, 404);
    return readFile(path, "utf8");
  }

  async function write(slug: string, contents: string): Promise<void> {
    const path = postPath(slug);
    // Saving only ever updates a post that exists; new posts go through
    // `create`, which is the one place a file is allowed to appear.
    if (!(await exists(path))) throw new EditorError(`Post not found: ${slug}`, 404);
    await writeFile(path, contents, "utf8");
  }

  async function remove(slug: string): Promise<void> {
    const path = postPath(slug);
    if (!(await exists(path))) throw new EditorError(`Post not found: ${slug}`, 404);
    await rm(path);
  }

  async function listSlugs(): Promise<string[]> {
    const names = await readdir(join(root, POSTS_DIR));
    return names
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -3))
      .sort();
  }

  /**
   * New posts are created empty and unnamed: the title is typed in place at the
   * top of the editor, so asking for one up front only got in the way. That
   * makes the slug ours to pick — dated, with a suffix when a day gets a
   * second draft — and it is what the post lives at, since nothing renames it.
   */
  async function createDraft(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    let slug = `untitled-${today}`;
    for (let suffix = 2; await exists(postPath(slug)); suffix += 1) {
      slug = `untitled-${today}-${suffix}`;
    }

    // Every field content-collections requires, so the new post compiles the
    // moment it lands on disk. `draft` keeps it out of production until ready.
    const values = {
      title: "",
      datetime: today,
      readTime: "1 min",
      category: "professional",
      draft: true,
    };

    const yaml = stringifyYaml(values, {
      defaultStringType: "QUOTE_DOUBLE",
      defaultKeyType: "PLAIN",
      lineWidth: 0,
      flowCollectionPadding: false,
    }).replace(/\n$/, "");

    await writeFile(postPath(slug), `---\n${yaml}\n---\n\n`, "utf8");
    return slug;
  }

  /** Writes an asset under a name nothing else has taken, and reports its URL. */
  async function writeAsset(
    dir: string,
    publicPath: string,
    filename: string,
    contents: Uint8Array,
  ): Promise<string> {
    const directory = join(root, dir);
    await mkdir(directory, { recursive: true });

    const dot = filename.lastIndexOf(".");
    const base = filename.slice(0, dot);
    const extension = filename.slice(dot);

    let candidate = filename;
    for (let suffix = 1; await exists(join(directory, candidate)); suffix += 1) {
      candidate = `${base}-${suffix}${extension}`;
    }

    await writeFile(join(directory, candidate), contents);
    return `${publicPath}/${candidate}`;
  }

  async function saveImage(name: string, bytes: Uint8Array): Promise<string> {
    const { filename, contents } = await toWebp(
      assetFilename(name, IMAGE_EXTENSIONS, "image"),
      bytes,
    );
    return writeAsset(IMAGES_DIR, IMAGES_PUBLIC_PATH, filename, contents);
  }

  /**
   * A clip is transcoded on the way in, the way an image is re-encoded to WebP:
   * whatever was uploaded, what lands in the repository is an H.264 mp4 with a
   * poster cut from its first frame. The poster goes through `saveImage`, so it
   * ends up a WebP alongside every other image the editor has saved.
   *
   * The size ceiling is checked against the transcoded file, since that is the
   * one the repository has to carry.
   */
  async function saveVideo(name: string, bytes: Uint8Array): Promise<Clip> {
    const filename = assetFilename(name, VIDEO_EXTENSIONS, "video");
    const dot = filename.lastIndexOf(".");
    const base = filename.slice(0, dot);

    let clip: Awaited<ReturnType<typeof transcodeClip>>;
    try {
      clip = await transcodeClip(filename.slice(dot + 1), bytes);
    } catch (error) {
      if (error instanceof TranscodeError) throw new EditorError(error.message, 400);
      throw error;
    }

    const tooLarge = clipTooLarge(clip.video.byteLength);
    if (tooLarge) throw new EditorError(tooLarge, 413);

    // The poster is a frame of the transcoded clip, so its dimensions are the
    // clip's own — no need to ask ffprobe for what sharp can already see.
    const { width, height } = await sharp(clip.poster).metadata();
    return {
      src: await writeAsset(VIDEOS_DIR, VIDEOS_PUBLIC_PATH, `${base}.mp4`, clip.video),
      poster: await saveImage(`${base}-poster.png`, clip.poster),
      width,
      height,
    };
  }

  return { read, write, remove, listSlugs, createDraft, saveImage, saveVideo };
}

export const postStore = createPostStore(process.cwd());

import { constants } from "node:fs";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { stringify as stringifyYaml } from "yaml";
import { TranscodeError, transcodeClip } from "./transcode";
import { MAX_CLIP_BYTES, VIDEO_EXTENSIONS } from "./uploads";
import { COLLECTIONS, type Collection } from "./collections";
import type { Clip } from "./types";

/**
 * Every file operation the dev-only editor is allowed to perform, bound to a
 * project root. Nothing here takes a path from the client — only a slug or a
 * filename, both validated against a strict pattern — so a request can't reach
 * outside the directories the editor owns.
 */

const IMAGES_DIR = "public/blog-images";
const IMAGES_PUBLIC_PATH = "/blog-images";
const VIDEOS_DIR = "public/blog-videos";
const VIDEOS_PUBLIC_PATH = "/blog-videos";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"]);

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

  const stem = name.slice(0, dot);
  if (stem === "") {
    throw new EditorError(`Invalid filename: ${JSON.stringify(name)}`, 400);
  }

  const base = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // A stem written entirely in Chinese slugifies to nothing, and refusing it
  // would mean refusing most recordings on this machine. Falling back to the
  // kind keeps the upload; `writeAsset` numbers the second one. A name that is
  // nothing but an extension has no stem at all, and is still refused above.
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

/**
 * The documents of one collection — Posts or Issues. Which directory it reads
 * and writes, and what a new draft starts as, is the collection's to say; the
 * file handling is the same either way.
 */
export function createContentStore(root: string, collection: Collection) {
  const documentPath = (slug: string) => join(root, collection.directory, `${assertSlug(slug)}.md`);

  async function read(slug: string): Promise<string> {
    const path = documentPath(slug);
    if (!(await exists(path))) throw new EditorError(`Document not found: ${slug}`, 404);
    return readFile(path, "utf8");
  }

  async function write(slug: string, contents: string): Promise<void> {
    const path = documentPath(slug);
    // Saving only ever updates a document that exists; new ones go through
    // `create`, which is the one place a file is allowed to appear.
    if (!(await exists(path))) throw new EditorError(`Document not found: ${slug}`, 404);
    await writeFile(path, contents, "utf8");
  }

  async function remove(slug: string): Promise<void> {
    const path = documentPath(slug);
    if (!(await exists(path))) throw new EditorError(`Document not found: ${slug}`, 404);
    await rm(path);
  }

  async function listSlugs(): Promise<string[]> {
    const names = await readdir(join(root, collection.directory));
    return names
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -3))
      .sort();
  }

  /**
   * New documents are created empty and unnamed: the title is typed in place at
   * the top of the editor, so asking for one up front only got in the way. That
   * makes the slug ours to pick — dated, with a suffix when a day gets a second
   * draft — and it is what the document lives at, since nothing renames it.
   */
  async function createDraft(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    let slug = `untitled-${today}`;
    for (let suffix = 2; await exists(documentPath(slug)); suffix += 1) {
      slug = `untitled-${today}-${suffix}`;
    }

    const yaml = stringifyYaml(collection.newDraft(today), {
      defaultStringType: "QUOTE_DOUBLE",
      defaultKeyType: "PLAIN",
      lineWidth: 0,
      flowCollectionPadding: false,
    }).replace(/\n$/, "");

    await writeFile(documentPath(slug), `---\n${yaml}\n---\n\n`, "utf8");
    return slug;
  }

  return { read, write, remove, listSlugs, createDraft };
}

/**
 * Images and clips, which belong to the repository rather than to one
 * collection: a Post and an Issue drop the same file into the same directory.
 */
export function createAssetStore(root: string) {
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

    if (clip.video.byteLength > MAX_CLIP_BYTES) {
      throw new EditorError(
        `Clip is ${megabytes(clip.video.byteLength)} after transcoding, over the ` +
          `${megabytes(MAX_CLIP_BYTES)} ceiling: it is too long to keep in the repository`,
        413,
      );
    }

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

  return { saveImage, saveVideo };
}

export const postStore = createContentStore(process.cwd(), COLLECTIONS.posts);
export const issueStore = createContentStore(process.cwd(), COLLECTIONS.issues);
export const assetStore = createAssetStore(process.cwd());

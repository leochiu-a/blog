import { constants } from "node:fs";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stringify as stringifyYaml } from "yaml";

/**
 * Every file operation the dev-only editor is allowed to perform, bound to a
 * project root. Nothing here takes a path from the client — only a slug or a
 * filename, both validated against a strict pattern — so a request can't reach
 * outside the two directories the editor owns.
 */

const POSTS_DIR = "src/content/blog";
const IMAGES_DIR = "public/blog-images";
const IMAGES_PUBLIC_PATH = "/blog-images";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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

function imageFilename(name: string): string {
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    throw new EditorError(`Invalid filename: ${JSON.stringify(name)}`, 400);
  }

  const dot = name.lastIndexOf(".");
  const extension = dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) {
    throw new EditorError(`Unsupported image type: ${JSON.stringify(name)}`, 400);
  }

  const base = name
    .slice(0, dot)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base === "") {
    throw new EditorError(`Invalid filename: ${JSON.stringify(name)}`, 400);
  }

  return `${base}.${extension}`;
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

  async function listSlugs(): Promise<string[]> {
    const names = await readdir(join(root, POSTS_DIR));
    return names
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -3))
      .sort();
  }

  async function create(slug: string, frontmatter: { title: string }): Promise<string> {
    const path = postPath(slug);
    if (await exists(path)) throw new EditorError(`Post already exists: ${slug}`, 409);

    // Every field content-collections requires, so the new post compiles the
    // moment it lands on disk. `draft` keeps it out of production until ready.
    const values = {
      title: frontmatter.title,
      datetime: new Date().toISOString().slice(0, 10),
      readTime: "1 min",
      font: "newsreader",
      category: "personal",
      draft: true,
    };

    const yaml = stringifyYaml(values, {
      defaultStringType: "QUOTE_DOUBLE",
      defaultKeyType: "PLAIN",
      lineWidth: 0,
      flowCollectionPadding: false,
    }).replace(/\n$/, "");

    const contents = `---\n${yaml}\n---\n\n`;
    await writeFile(path, contents, "utf8");
    return contents;
  }

  async function saveImage(name: string, bytes: Uint8Array): Promise<string> {
    const filename = imageFilename(name);
    const directory = join(root, IMAGES_DIR);
    await mkdir(directory, { recursive: true });

    const dot = filename.lastIndexOf(".");
    const base = filename.slice(0, dot);
    const extension = filename.slice(dot);

    let candidate = filename;
    for (let suffix = 1; await exists(join(directory, candidate)); suffix += 1) {
      candidate = `${base}-${suffix}${extension}`;
    }

    await writeFile(join(directory, candidate), bytes);
    return `${IMAGES_PUBLIC_PATH}/${candidate}`;
  }

  return { read, write, listSlugs, create, saveImage };
}

export const postStore = createPostStore(process.cwd());

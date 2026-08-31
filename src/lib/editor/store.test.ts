import { execFile } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { createPostStore } from "./store";

let root: string;
let store: ReturnType<typeof createPostStore>;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "editor-store-"));
  mkdirSync(join(root, "src/content/blog"), { recursive: true });
  mkdirSync(join(root, "public/blog-images"), { recursive: true });
  writeFileSync(
    join(root, "src/content/blog/hello.md"),
    `---\ntitle: "Hello"\ndatetime: "2026-01-01"\n---\n\nBody.\n`,
  );
  store = createPostStore(root);
});

const TRAVERSAL = ["../secret", "../../etc/passwd", "a/b", "Hello", "hello.md", "", "hello world"];

describe("reading and writing posts", () => {
  it("lists the posts on disk", async () => {
    await expect(store.listSlugs()).resolves.toEqual(["hello"]);
  });

  it("reads a post by slug", async () => {
    await expect(store.read("hello")).resolves.toContain("Body.");
  });

  it("writes a post back to its own file", async () => {
    await store.write("hello", "changed\n");
    expect(readFileSync(join(root, "src/content/blog/hello.md"), "utf8")).toBe("changed\n");
  });

  it.each(TRAVERSAL)("refuses to write to %o", async (slug) => {
    await expect(store.write(slug, "pwned")).rejects.toThrow(/slug/i);
  });

  it.each(TRAVERSAL)("refuses to read %o", async (slug) => {
    await expect(store.read(slug)).rejects.toThrow(/slug/i);
  });

  it("reports a missing post rather than inventing one", async () => {
    await expect(store.read("nope")).rejects.toThrow(/not found/i);
  });

  it("refuses to write to a slug that has no post yet", async () => {
    await expect(store.write("never-existed", "pwned")).rejects.toThrow(/not found/i);
    await expect(store.listSlugs()).resolves.toEqual(["hello"]);
  });
});

describe("deleting posts", () => {
  it("removes the file from disk", async () => {
    await store.remove("hello");

    expect(existsSync(join(root, "src/content/blog/hello.md"))).toBe(false);
    await expect(store.listSlugs()).resolves.toEqual([]);
  });

  it("reports a missing post rather than passing silently", async () => {
    await expect(store.remove("nope")).rejects.toThrow(/not found/i);
  });

  it.each(TRAVERSAL)("refuses to delete %o", async (slug) => {
    await expect(store.remove(slug)).rejects.toThrow(/slug/i);
  });
});

describe("creating posts", () => {
  it("writes a dated, untitled file with valid frontmatter", async () => {
    const slug = await store.createDraft();

    expect(slug).toMatch(/^untitled-\d{4}-\d{2}-\d{2}$/);
    const created = readFileSync(join(root, `src/content/blog/${slug}.md`), "utf8");
    expect(created).toMatch(/^---\n/);
    expect(created).toContain(`title: ""`);
    expect(created).toContain(`draft: true`);
    expect(await store.listSlugs()).toContain(slug);
  });

  it("suffixes the slug rather than overwriting an existing draft", async () => {
    const first = await store.createDraft();
    const second = await store.createDraft();

    expect(second).toBe(`${first}-2`);
    expect(await store.listSlugs()).toEqual(expect.arrayContaining([first, second]));
  });
});

const PNG = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#ff0000" } })
  .png()
  .toBuffer();

/**
 * A real clip, because `saveVideo` runs the bytes through ffmpeg — there is no
 * shape a stub could take that ffmpeg would accept. Small and short, so the
 * encode costs a fraction of a second.
 */
const CLIP = await (async () => {
  const directory = mkdtempSync(join(tmpdir(), "editor-clip-fixture-"));
  const path = join(directory, "fixture.mp4");
  await promisify(execFile)("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=320x240:rate=10:duration=1",
    "-pix_fmt",
    "yuv420p",
    path,
  ]);
  const bytes = readFileSync(path);
  rmSync(directory, { recursive: true, force: true });
  return bytes;
})();

describe("saving images", () => {
  it("re-encodes as WebP and returns the public path", async () => {
    const path = await store.saveImage("Photo Of A Cat.PNG", PNG);

    expect(path).toBe("/blog-images/photo-of-a-cat.webp");
    const written = readFileSync(join(root, "public/blog-images/photo-of-a-cat.webp"));
    await expect(sharp(written).metadata()).resolves.toMatchObject({ format: "webp" });
  });

  it("leaves an SVG as it is", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" />');
    const path = await store.saveImage("logo.svg", svg);

    expect(path).toBe("/blog-images/logo.svg");
    expect(readFileSync(join(root, "public/blog-images/logo.svg"))).toEqual(svg);
  });

  it("never overwrites an existing image", async () => {
    const first = await store.saveImage("cat.png", PNG);
    const second = await store.saveImage("cat.png", PNG);

    expect(first).toBe("/blog-images/cat.webp");
    expect(second).toBe("/blog-images/cat-1.webp");
  });

  it("refuses bytes that are not an image", async () => {
    await expect(store.saveImage("cat.png", new Uint8Array([1, 2, 3]))).rejects.toThrow(
      /could not read/i,
    );
  });

  it.each(["../evil.png", "a/b.png", "notes.txt", ""])("refuses the filename %o", async (name) => {
    await expect(store.saveImage(name, PNG)).rejects.toThrow(/filename|type/i);
  });

  it.each(["螢幕截圖.png", ".png"])(
    "names %o after its kind rather than refusing it",
    async (name) => {
      await expect(store.saveImage(name, PNG)).resolves.toBe("/blog-images/image.webp");
    },
  );
});

describe("saving videos", () => {
  it("transcodes to mp4 and saves a poster beside it", async () => {
    const clip = await store.saveVideo("Demo Reel.MOV", CLIP);

    expect(clip).toEqual({
      src: "/blog-videos/demo-reel.mp4",
      poster: "/blog-images/demo-reel-poster.webp",
      width: 320,
      height: 240,
    });

    const written = readFileSync(join(root, "public/blog-videos/demo-reel.mp4"));
    expect(written.subarray(4, 8).toString("latin1")).toBe("ftyp");
    await expect(
      sharp(readFileSync(join(root, "public/blog-images/demo-reel-poster.webp"))).metadata(),
    ).resolves.toMatchObject({ format: "webp", width: 320, height: 240 });
  });

  it("never overwrites an existing clip", async () => {
    await expect(store.saveVideo("demo.mp4", CLIP)).resolves.toMatchObject({
      src: "/blog-videos/demo.mp4",
    });
    await expect(store.saveVideo("demo.mp4", CLIP)).resolves.toMatchObject({
      src: "/blog-videos/demo-1.mp4",
    });
  });

  it("refuses bytes that are not a video", async () => {
    await expect(store.saveVideo("clip.mp4", new Uint8Array([1, 2, 3]))).rejects.toThrow(
      /讀不到這支影片/,
    );
  });

  it.each(["../evil.mp4", "a/b.mp4", "clip.avi", "clip.png", ""])(
    "refuses the filename %o",
    async (name) => {
      await expect(store.saveVideo(name, CLIP)).rejects.toThrow(/filename|type/i);
    },
  );

  it("names an all-Chinese recording after its kind rather than refusing it", async () => {
    await expect(store.saveVideo("螢幕錄影.mov", CLIP)).resolves.toMatchObject({
      src: "/blog-videos/video.mp4",
      poster: "/blog-images/video-poster.webp",
    });
  });
});

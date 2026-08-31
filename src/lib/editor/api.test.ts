import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPostStore } from "./store";
import { transcodeClip } from "./transcode";
import { MAX_CLIP_BYTES } from "./uploads";

// Only the oversized-clip test stubs ffmpeg; the rest run the real encoder.
vi.mock("./transcode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./transcode")>();
  return { ...actual, transcodeClip: vi.fn(actual.transcodeClip) };
});
import { createPost, deletePost, getPost, savePost, uploadImage, uploadVideo } from "./api";
import { parsePost } from "./document";

const SOURCE = `---\ntitle: "Hello"\ndatetime: "2026-01-01"\n---\n\nBody.\n`;

let root: string;
let store: ReturnType<typeof createPostStore>;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "editor-api-"));
  mkdirSync(join(root, "src/content/blog"), { recursive: true });
  store = createPostStore(root);
  writeFileSync(join(root, "src/content/blog/hello.md"), SOURCE);
});

const json = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("GET a post", () => {
  it("returns the parsed document", async () => {
    const response = await getPost("hello", store);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      frontmatter: { title: "Hello", datetime: "2026-01-01" },
      frontmatterSource: `title: "Hello"\ndatetime: "2026-01-01"`,
      doc: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { source: "Body." },
            content: [{ type: "text", text: "Body." }],
          },
        ],
      },
    });
  });

  it("404s an unknown slug", async () => {
    expect((await getPost("nope", store)).status).toBe(404);
  });

  it("400s a slug that tries to escape the posts directory", async () => {
    expect((await getPost("../secret", store)).status).toBe(400);
  });
});

describe("saving a post", () => {
  it("writes the serialized document back to disk", async () => {
    const document = parsePost(SOURCE);
    document.frontmatter.title = "Renamed";

    const response = await savePost("hello", json({ document }), store);

    expect(response.status).toBe(200);
    expect(readFileSync(join(root, "src/content/blog/hello.md"), "utf8")).toBe(
      SOURCE.replace(`"Hello"`, `"Renamed"`),
    );
  });

  it("400s a body that is not a document", async () => {
    expect((await savePost("hello", json({ document: null }), store)).status).toBe(400);
  });

  it("400s a slug that tries to escape the posts directory", async () => {
    const response = await savePost("../secret", json({ document: parsePost(SOURCE) }), store);
    expect(response.status).toBe(400);
  });

  it("404s a slug with no post behind it, rather than creating one", async () => {
    const response = await savePost("never-existed", json({ document: parsePost(SOURCE) }), store);

    expect(response.status).toBe(404);
    await expect(store.listSlugs()).resolves.toEqual(["hello"]);
  });
});

describe("creating a post", () => {
  it("creates a dated draft and returns its slug", async () => {
    const response = await createPost(store);

    expect(response.status).toBe(201);
    const { slug } = (await response.json()) as { slug: string };
    expect(slug).toMatch(/^untitled-\d{4}-\d{2}-\d{2}$/);
    expect(await store.listSlugs()).toContain(slug);
  });

  it("gives a second draft on the same day its own slug", async () => {
    const first = (await (await createPost(store)).json()) as { slug: string };
    const second = (await (await createPost(store)).json()) as { slug: string };

    expect(second.slug).toBe(`${first.slug}-2`);
  });
});

const PNG = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#ff0000" } })
  .png()
  .toBuffer();

/** A real clip: the upload runs through ffmpeg. See store.test.ts. */
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

describe("uploading an image", () => {
  const form = (name: string) => {
    const data = new FormData();
    data.set("file", new File([PNG], name, { type: "image/png" }));
    return new Request("http://localhost/api", { method: "POST", body: data });
  };

  it("returns the public path of the saved image, re-encoded as WebP", async () => {
    const response = await uploadImage(form("Cat.png"), store);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ src: "/blog-images/cat.webp" });
  });

  it("400s a file that is not an image", async () => {
    expect((await uploadImage(form("notes.txt"), store)).status).toBe(400);
  });

  it("400s a request with no file", async () => {
    const response = await uploadImage(
      new Request("http://localhost/api", { method: "POST", body: new FormData() }),
      store,
    );
    expect(response.status).toBe(400);
  });
});

describe("uploading a video", () => {
  it("returns the transcoded clip, its poster and its size", async () => {
    const data = new FormData();
    data.set("file", new File([CLIP], "Demo Reel.mov", { type: "video/quicktime" }));
    const response = await uploadVideo(
      new Request("http://localhost/api", { method: "POST", body: data }),
      store,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      src: "/blog-videos/demo-reel.mp4",
      poster: "/blog-images/demo-reel-poster.webp",
      width: 320,
      height: 240,
    });
  });

  it("413s a clip that is still over the ceiling after transcoding", async () => {
    vi.mocked(transcodeClip).mockResolvedValueOnce({
      video: new Uint8Array(MAX_CLIP_BYTES + 1),
      poster: PNG,
    });
    const data = new FormData();
    data.set("file", new File([CLIP], "long.mp4", { type: "video/mp4" }));
    const response = await uploadVideo(
      new Request("http://localhost/api", { method: "POST", body: data }),
      store,
    );

    // Distinct from the 400 below: the file was readable, it is just too long.
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/ceiling/i),
    });
  });

  it("400s a file ffmpeg cannot read", async () => {
    const data = new FormData();
    data.set("file", new File([new Uint8Array([1, 2, 3])], "clip.mp4", { type: "video/mp4" }));
    const response = await uploadVideo(
      new Request("http://localhost/api", { method: "POST", body: data }),
      store,
    );

    expect(response.status).toBe(400);
  });
});

describe("deleting a post", () => {
  it("removes the file and reports the slug", async () => {
    const response = await deletePost("hello", store);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ slug: "hello" });
    await expect(store.listSlugs()).resolves.toEqual([]);
  });

  it("404s an unknown slug", async () => {
    expect((await deletePost("nope", store)).status).toBe(404);
  });

  it("400s a slug that tries to escape the posts directory", async () => {
    expect((await deletePost("../secret", store)).status).toBe(400);
  });
});

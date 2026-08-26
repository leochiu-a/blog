import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

describe("creating posts", () => {
  it("writes a new file with valid frontmatter", async () => {
    await store.create("my-new-post", { title: "My New Post" });

    const created = readFileSync(join(root, "src/content/blog/my-new-post.md"), "utf8");
    expect(created).toMatch(/^---\n/);
    expect(created).toContain(`title: "My New Post"`);
    expect(created).toContain(`draft: true`);
    expect(await store.listSlugs()).toContain("my-new-post");
  });

  it("refuses a slug that already exists", async () => {
    await expect(store.create("hello", { title: "Clash" })).rejects.toThrow(/exists/i);
  });

  it.each(TRAVERSAL)("refuses to create %o", async (slug) => {
    await expect(store.create(slug, { title: "x" })).rejects.toThrow(/slug/i);
  });
});

describe("saving images", () => {
  const bytes = new Uint8Array([1, 2, 3]);

  it("writes into public/blog-images and returns the public path", async () => {
    const path = await store.saveImage("Photo Of A Cat.PNG", bytes);

    expect(path).toBe("/blog-images/photo-of-a-cat.png");
    expect(readFileSync(join(root, "public/blog-images/photo-of-a-cat.png"))).toEqual(
      Buffer.from(bytes),
    );
  });

  it("never overwrites an existing image", async () => {
    await store.saveImage("cat.png", bytes);
    const second = await store.saveImage("cat.png", new Uint8Array([4]));

    expect(second).toBe("/blog-images/cat-1.png");
    expect(readFileSync(join(root, "public/blog-images/cat.png"))).toEqual(Buffer.from(bytes));
  });

  it.each(["../evil.png", "a/b.png", "notes.txt", ".png", ""])(
    "refuses the filename %o",
    async (name) => {
      await expect(store.saveImage(name, bytes)).rejects.toThrow(/filename|type/i);
    },
  );
});

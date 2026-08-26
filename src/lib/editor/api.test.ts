import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createPostStore } from "./store";
import { createPost, getPost, savePost, uploadImage } from "./api";
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
  it("creates the file and returns its slug", async () => {
    const response = await createPost(json({ slug: "brand-new", title: "Brand New" }), store);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ slug: "brand-new" });
    expect(await store.listSlugs()).toContain("brand-new");
  });

  it("409s a slug that already exists", async () => {
    expect((await createPost(json({ slug: "hello", title: "x" }), store)).status).toBe(409);
  });

  it("400s a missing title", async () => {
    expect((await createPost(json({ slug: "no-title" }), store)).status).toBe(400);
  });
});

describe("uploading an image", () => {
  const form = (name: string) => {
    const data = new FormData();
    data.set("file", new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" }));
    return new Request("http://localhost/api", { method: "POST", body: data });
  };

  it("returns the public path of the saved image", async () => {
    const response = await uploadImage(form("Cat.png"), store);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ src: "/blog-images/cat.png" });
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

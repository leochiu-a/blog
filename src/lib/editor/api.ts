import { parseDocument, serializeDocument } from "./document";
import { EditorError, type createAssetStore, type createContentStore } from "./store";
import type { EditorDocument } from "./types";

/**
 * Request handlers for the dev-only editor. They take the store explicitly so
 * the route files stay one-liners and the behaviour is testable without a
 * running server.
 */
type ContentStore = ReturnType<typeof createContentStore>;
type AssetStore = ReturnType<typeof createAssetStore>;

async function respond(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof EditorError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

function badRequest(message: string): never {
  throw new EditorError(message, 400);
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null) badRequest("Expected a JSON object body");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof EditorError) throw error;
    return badRequest("Expected a JSON object body");
  }
}

function asDocument(value: unknown): EditorDocument {
  const document = value as EditorDocument | null;
  if (
    typeof document !== "object" ||
    document === null ||
    typeof document.frontmatterSource !== "string" ||
    typeof document.frontmatter !== "object" ||
    document.frontmatter === null ||
    document.doc?.type !== "doc"
  ) {
    badRequest("Expected a document");
  }
  return document;
}

export function getDocument(slug: string, store: ContentStore): Promise<Response> {
  return respond(async () => Response.json(parseDocument(await store.read(slug))));
}

export function saveDocument(
  slug: string,
  request: Request,
  store: ContentStore,
): Promise<Response> {
  return respond(async () => {
    const body = await readJson(request);
    const contents = serializeDocument(asDocument(body.document));
    await store.write(slug, contents);
    return Response.json({ slug });
  });
}

export function deleteDocument(slug: string, store: ContentStore): Promise<Response> {
  return respond(async () => {
    await store.remove(slug);
    return Response.json({ slug });
  });
}

export function createDocument(store: ContentStore): Promise<Response> {
  return respond(async () => {
    const slug = await store.createDraft();
    return Response.json({ slug }, { status: 201 });
  });
}

async function uploadedFile(request: Request): Promise<File> {
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) badRequest("Expected a file");
  return file;
}

export function uploadImage(request: Request, store: AssetStore): Promise<Response> {
  return respond(async () => {
    const file = await uploadedFile(request);
    const src = await store.saveImage(file.name, new Uint8Array(await file.arrayBuffer()));
    return Response.json({ src }, { status: 201 });
  });
}

/** Answers with the whole clip — both files and their size — not just a path. */
export function uploadVideo(request: Request, store: AssetStore): Promise<Response> {
  return respond(async () => {
    const file = await uploadedFile(request);
    const clip = await store.saveVideo(file.name, new Uint8Array(await file.arrayBuffer()));
    return Response.json(clip, { status: 201 });
  });
}

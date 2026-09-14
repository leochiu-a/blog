import { EditorError, type createAssetStore } from "./store";
import { parseLinkMetadata, type LinkMetadata } from "./link-metadata";

/**
 * Reading a link once, at insert time, so the post carries the card instead of
 * fetching it.
 *
 * The alternative — resolving the metadata when the page renders — would make
 * a post's appearance depend on somebody else's server being up, and would put
 * a third-party round trip in front of a reader on a Worker with a 10ms CPU
 * budget. Worse, it would make the same `.md` file render differently on
 * different days. Everything this returns is written into the document as
 * attributes, and is a writer's to correct afterwards.
 *
 * The share image is copied into the repository for the same reason, through
 * the same store every other editor image goes through: hotlinking it would
 * need `remotePatterns` opened to the whole web, and would leave a hole in a
 * two-year-old post the day someone reorganises their CDN.
 */

type AssetStore = ReturnType<typeof createAssetStore>;

export type LinkCard = LinkMetadata & { href: string };

/** Long enough for a slow blog, short enough that a dead host is not a hang. */
const TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Sites serve different markup to a bare script than to a browser — some serve
 * none at all — and the metadata is the part that differs most.
 */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/124.0 Safari/537.36";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function assertHttpUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new EditorError(`不是有效的網址：${JSON.stringify(url)}`, 400);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new EditorError("只接受 http 或 https 的網址", 400);
  }
  return parsed;
}

async function get(url: string, accept: string): Promise<Response> {
  return fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT, accept },
  });
}

/** Refuses a body over the ceiling instead of buffering it. */
async function bytesOf(response: Response, limit: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > limit) {
    throw new EditorError("檔案太大", 413);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > limit) throw new EditorError("檔案太大", 413);
  return bytes;
}

/**
 * The name the share image lands in the repository under. It is derived from
 * the linked site rather than taken from the remote path, which is routinely
 * `og.png`, a hash, or nothing at all — `saveImage` numbers the collisions,
 * and re-encodes whatever arrives as WebP.
 */
function imageFilename(page: URL, contentType: string): string | null {
  const extension = IMAGE_EXTENSIONS[contentType.split(";")[0]!.trim().toLowerCase()];
  if (extension === undefined) return null;
  return `og-${page.hostname.replace(/^www\./, "")}.${extension}`;
}

/**
 * Copies the share image in, or answers `""`.
 *
 * A card reads perfectly well without a picture, so nothing here is worth
 * failing the insert over: a host that refuses the image, serves an HTML error
 * page as one, or is simply slow costs the card its thumbnail and nothing else.
 */
async function copyImage(image: string, page: URL, store: AssetStore): Promise<string> {
  if (image === "") return "";

  try {
    const response = await get(image, "image/*");
    if (!response.ok) return "";

    const filename = imageFilename(page, response.headers.get("content-type") ?? "");
    if (filename === null) return "";

    return await store.saveImage(filename, await bytesOf(response, MAX_IMAGE_BYTES));
  } catch {
    return "";
  }
}

/**
 * What a `<LinkCard>` needs, read off the page at `url`.
 *
 * The canonical URL the response settled on is what the card links to, so a
 * shortener or a tracking redirect is resolved once here rather than being
 * followed by every reader.
 */
export async function readLinkCard(url: string, store: AssetStore): Promise<LinkCard> {
  const requested = assertHttpUrl(url);

  let response: Response;
  try {
    response = await get(requested.href, "text/html,application/xhtml+xml");
  } catch (error) {
    const detail = error instanceof Error && error.name === "TimeoutError" ? "逾時" : "連不上";
    throw new EditorError(`讀取失敗（${detail}）：${requested.hostname}`, 502);
  }

  if (!response.ok) {
    throw new EditorError(`讀取失敗（HTTP ${response.status}）：${requested.hostname}`, 502);
  }

  const html = new TextDecoder().decode(await bytesOf(response, MAX_HTML_BYTES));
  // `response.url` is where the redirects ended up; it is "" on a response that
  // did not come from the network, in which case what was asked for stands.
  const href = response.url === "" ? requested.href : response.url;
  const metadata = parseLinkMetadata(html, href);

  // Named after the site being linked, not after wherever its image is hosted:
  // GitHub's share images come off `repository-images.githubusercontent.com`,
  // which says nothing about what the file in the repository is a picture of.
  return { ...metadata, href, image: await copyImage(metadata.image, new URL(href), store) };
}

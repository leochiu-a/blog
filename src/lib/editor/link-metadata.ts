/**
 * What a page says about itself, read off its own `<head>`.
 *
 * Every field is optional because every field is missing somewhere: plenty of
 * pages ship `og:title` and nothing else, and a few ship nothing at all. The
 * card is written to survive that — what is absent is left out rather than
 * filled with a guess — so the parser's job is to report what is there, not to
 * manufacture a complete record.
 *
 * Pure, and separate from the fetch, because this is the half worth testing:
 * it is where real pages disagree with each other.
 */
export type LinkMetadata = {
  title: string;
  description: string;
  /** The publication's own name, falling back to the bare hostname. */
  site: string;
  /** Absolute URL of the share image, or "" when the page offers none. */
  image: string;
};

/**
 * Only the head. Some sites quote an `<meta>` tag inside body copy — an
 * article about Open Graph, say — and reading the whole document lets that
 * example win over the page's real one.
 *
 * A page with no `</head>` is read whole rather than not at all.
 */
function head(html: string): string {
  const end = html.search(/<\/head>/i);
  return end === -1 ? html : html.slice(0, end);
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Attribute values arrive escaped, and they are about to be written into a
 * `.md` file as plain text: a title left as `Vue &amp; React` would publish
 * with the entity showing.
 */
function decode(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    }
    if (body.startsWith("#")) return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    return ENTITIES[body.toLowerCase()] ?? entity;
  });
}

const ATTRIBUTE = (name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");

function attribute(tag: string, name: string): string | null {
  const match = ATTRIBUTE(name).exec(tag);
  if (!match) return null;
  return decode(match[2] ?? match[3] ?? match[4] ?? "");
}

/**
 * Every `<meta>` in the head, keyed by whichever of `property` and `name` it
 * used. Open Graph specifies `property` and Twitter specifies `name`, but
 * plenty of pages (and more than one popular CMS) use the other one, so both
 * are read into the same map.
 *
 * First writer wins: a page that repeats `og:title` means the first one.
 */
function metaTags(html: string): Map<string, string> {
  const tags = new Map<string, string>();

  for (const [tag] of head(html).matchAll(/<meta\b[^>]*>/gi)) {
    const content = attribute(tag, "content");
    if (content === null || content.trim() === "") continue;

    const key = attribute(tag, "property") ?? attribute(tag, "name");
    if (key === null) continue;

    const lower = key.toLowerCase();
    if (!tags.has(lower)) tags.set(lower, content.trim());
  }

  return tags;
}

/** The first of these keys the page actually carries. */
function pick(tags: Map<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = tags.get(key);
    if (value !== undefined) return value;
  }
  return "";
}

function documentTitle(html: string): string {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head(html));
  return match ? decode(match[1]!).replace(/\s+/g, " ").trim() : "";
}

/**
 * The hostname a reader would recognise, used when the page never names
 * itself. `www.` carries no information and is dropped the way every browser
 * address bar drops it.
 */
function hostname(url: URL): string {
  return url.hostname.replace(/^www\./, "");
}

/**
 * A share image given as a path (`/og/cover.png`) is resolved against the page
 * it was found on. Anything that will not resolve — or resolves to something
 * that is not http — is treated as no image rather than written into the post
 * as a broken one.
 */
function imageUrl(candidate: string, base: URL): string {
  if (candidate === "") return "";
  try {
    const resolved = new URL(candidate, base);
    return resolved.protocol === "http:" || resolved.protocol === "https:" ? resolved.href : "";
  } catch {
    return "";
  }
}

export function parseLinkMetadata(html: string, url: string): LinkMetadata {
  const base = new URL(url);
  const tags = metaTags(html);

  return {
    // `<title>` last: it is the tab label, which on a lot of sites carries the
    // publication's name as a suffix that the card already shows separately.
    title: pick(tags, "og:title", "twitter:title") || documentTitle(html),
    description: pick(tags, "og:description", "twitter:description", "description"),
    site: pick(tags, "og:site_name", "application-name") || hostname(base),
    image: imageUrl(pick(tags, "og:image", "og:image:url", "twitter:image"), base),
  };
}

import { describe, expect, it } from "vitest";
import { parseLinkMetadata } from "./link-metadata";

const page = (head: string) => `<!doctype html><html><head>${head}</head><body></body></html>`;

describe("parseLinkMetadata", () => {
  it("reads the Open Graph tags a well-behaved page ships", () => {
    const html = page(`
      <title>Modern Engineering Values | cpojer.net</title>
      <meta property="og:title" content="Modern Engineering Values" />
      <meta property="og:description" content="What engineers are for." />
      <meta property="og:site_name" content="Christoph Nakazawa" />
      <meta property="og:image" content="https://cpojer.net/og/values.png" />
    `);

    expect(parseLinkMetadata(html, "https://cpojer.net/posts/modern-engineering-values")).toEqual({
      title: "Modern Engineering Values",
      description: "What engineers are for.",
      site: "Christoph Nakazawa",
      image: "https://cpojer.net/og/values.png",
    });
  });

  it("falls back to Twitter tags, then to the document's own title", () => {
    const withTwitter = page(`
      <title>Ignored</title>
      <meta name="twitter:title" content="From Twitter" />
      <meta name="twitter:description" content="Also from Twitter" />
      <meta name="twitter:image" content="https://example.com/t.png" />
    `);
    expect(parseLinkMetadata(withTwitter, "https://example.com/p")).toMatchObject({
      title: "From Twitter",
      description: "Also from Twitter",
      image: "https://example.com/t.png",
    });

    const bare = page(`<title>  Just   a title </title>`);
    expect(parseLinkMetadata(bare, "https://example.com/p")).toMatchObject({
      title: "Just a title",
      description: "",
      image: "",
    });
  });

  it("names the site after its hostname when the page does not name itself", () => {
    const html = page(`<meta property="og:title" content="T" />`);

    expect(parseLinkMetadata(html, "https://www.example.com/p").site).toBe("example.com");
  });

  /** A `.md` file holds text, not markup: an escaped title would publish as-is. */
  it("decodes entities, named and numeric", () => {
    const html = page(`
      <meta property="og:title" content="Vue &amp; React &#8212; a &quot;comparison&quot;" />
      <meta property="og:description" content="It&#x27;s fine" />
    `);

    expect(parseLinkMetadata(html, "https://example.com/p")).toMatchObject({
      title: 'Vue & React — a "comparison"',
      description: "It's fine",
    });
  });

  it("resolves a relative share image against the page it was found on", () => {
    const html = page(`<meta property="og:image" content="/og/cover.png" />`);

    expect(parseLinkMetadata(html, "https://example.com/blog/post/").image).toBe(
      "https://example.com/og/cover.png",
    );
  });

  it("reports no image rather than an unusable one", () => {
    const html = page(`<meta property="og:image" content="data:image/png;base64,AAAA" />`);

    expect(parseLinkMetadata(html, "https://example.com/p").image).toBe("");
  });

  /**
   * A page *about* Open Graph quotes meta tags in its body. Reading the whole
   * document lets the example win over the page's own head.
   */
  it("ignores meta tags quoted in the body", () => {
    const html = `<html><head><meta property="og:title" content="Real" /></head>
      <body><meta property="og:title" content="Example from the article" /></body></html>`;

    expect(parseLinkMetadata(html, "https://example.com/p").title).toBe("Real");
  });

  it("reads single-quoted attributes and either attribute name", () => {
    const html = page(`
      <meta name='og:title' content='Single quoted'>
      <meta content="Reversed order" property="og:description">
    `);

    expect(parseLinkMetadata(html, "https://example.com/p")).toMatchObject({
      title: "Single quoted",
      description: "Reversed order",
    });
  });

  it("survives a page with nothing in its head", () => {
    expect(parseLinkMetadata(page(""), "https://example.com/p")).toEqual({
      title: "",
      description: "",
      site: "example.com",
      image: "",
    });
  });
});

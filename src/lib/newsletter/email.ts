import type { BlockContent, DefinitionContent, PhrasingContent, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

/**
 * Turns an Issue's Markdown into the two bodies an email needs: inline-styled
 * HTML and a plain-text equivalent.
 *
 * Email is why this is hand-rolled rather than a rehype pipeline. Stylesheets
 * and `<style>` blocks are unreliable across clients, so every rule has to ride
 * on the element as a `style` attribute — and the set of constructs an Issue
 * uses is small enough that owning the mapping is cheaper than bending a
 * general-purpose renderer into producing it.
 *
 * The alternative was priced before this was written, and again since: mdast to
 * inline-styled HTML needs `remark-rehype` and `rehype-stringify` plus a style
 * inliner, none of which this project has — `rehype-pretty-code` and
 * `rehype-slug` are plugins inside Next's MDX build and give nothing here. That
 * is three dependencies to replace the HTML half, and the plain-text half has
 * no rehype answer at all: the layout-aware text below is not something a
 * stringifier produces. Revisit if an Issue ever needs constructs this does not
 * cover, not to shorten the file.
 *
 * An Issue is prose and links: images and fenced code are not part of what the
 * format supports. Neither is dropped, because silently losing something an
 * author wrote is worse than rendering it plainly — an image becomes a link,
 * and a fence gets a monospace block with wrapping so a long line cannot break
 * the layout. Neither is a reason to start putting code in an Issue.
 */

interface RenderOptions {
  markdown: string;
  /** Absolute origin used to resolve relative links. */
  siteUrl: string;
}

export interface RenderedIssue {
  html: string;
  text: string;
}

const STYLE = {
  h1: "margin:0 0 0.6em;font-size:24px;font-weight:700;line-height:1.3;",
  h2: "margin:1.8em 0 0.6em;font-size:20px;font-weight:700;line-height:1.35;",
  h3: "margin:1.6em 0 0.5em;font-size:17px;font-weight:700;line-height:1.4;",
  paragraph: "margin:0 0 1.2em;font-size:16px;line-height:1.75;",
  list: "margin:0 0 1.2em;padding-left:1.4em;font-size:16px;line-height:1.75;",
  listItem: "margin:0 0 0.4em;",
  blockquote:
    "margin:0 0 1.2em;padding:0.2em 0 0.2em 1em;border-left:3px solid #d4d4d4;color:#525252;font-size:16px;line-height:1.75;",
  link: "color:#0f62fe;text-decoration:underline;",
  code: "padding:0.15em 0.35em;background:#f4f4f4;border-radius:3px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;",
  pre: "margin:0 0 1.2em;padding:0.9em 1em;background:#f4f4f4;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;",
  hr: "margin:2em 0;border:0;border-top:1px solid #e5e5e5;",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * A link in an inbox has no page to be relative to, so everything is resolved
 * against the site origin before it goes out.
 */
function absoluteUrl(href: string, siteUrl: string): string {
  try {
    return new URL(href, siteUrl).toString();
  } catch {
    return href;
  }
}

type AnyContent = RootContent | BlockContent | DefinitionContent;

function inlineHtml(nodes: PhrasingContent[], siteUrl: string): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
          return escapeHtml(node.value);
        case "strong":
          return `<strong style="font-weight:700;">${inlineHtml(node.children, siteUrl)}</strong>`;
        case "emphasis":
          return `<em>${inlineHtml(node.children, siteUrl)}</em>`;
        case "delete":
          return `<del>${inlineHtml(node.children, siteUrl)}</del>`;
        case "inlineCode":
          return `<code style="${STYLE.code}">${escapeHtml(node.value)}</code>`;
        case "link":
          return `<a href="${escapeHtml(absoluteUrl(node.url, siteUrl))}" style="${STYLE.link}">${inlineHtml(node.children, siteUrl)}</a>`;
        // Images are not displayed, but the author put something there — keep it
        // reachable as a link rather than dropping it.
        case "image":
          return `<a href="${escapeHtml(absoluteUrl(node.url, siteUrl))}" style="${STYLE.link}">${escapeHtml(node.alt || node.url)}</a>`;
        case "break":
          return "<br />";
        default:
          return "children" in node ? inlineHtml(node.children as PhrasingContent[], siteUrl) : "";
      }
    })
    .join("");
}

function blockHtml(nodes: AnyContent[], siteUrl: string): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "heading": {
          const tag = node.depth === 1 ? "h1" : node.depth === 2 ? "h2" : "h3";
          const style = tag === "h1" ? STYLE.h1 : tag === "h2" ? STYLE.h2 : STYLE.h3;
          return `<${tag} style="${style}">${inlineHtml(node.children, siteUrl)}</${tag}>`;
        }
        case "paragraph":
          return `<p style="${STYLE.paragraph}">${inlineHtml(node.children, siteUrl)}</p>`;
        case "list": {
          const tag = node.ordered ? "ol" : "ul";
          const items = node.children
            .map(
              (item) =>
                `<li style="${STYLE.listItem}">${blockHtml(item.children, siteUrl).replace(
                  /^<p style="[^"]*">|<\/p>$/g,
                  "",
                )}</li>`,
            )
            .join("");
          return `<${tag} style="${STYLE.list}">${items}</${tag}>`;
        }
        case "blockquote":
          return `<blockquote style="${STYLE.blockquote}">${blockHtml(node.children, siteUrl)}</blockquote>`;
        case "code":
          return `<pre style="${STYLE.pre}">${escapeHtml(node.value)}</pre>`;
        case "thematicBreak":
          return `<hr style="${STYLE.hr}" />`;
        default:
          return "children" in node ? blockHtml(node.children as AnyContent[], siteUrl) : "";
      }
    })
    .join("\n");
}

function inlineText(nodes: PhrasingContent[], siteUrl: string): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
        case "inlineCode":
          return node.value;
        case "link":
          return `${inlineText(node.children, siteUrl)} (${absoluteUrl(node.url, siteUrl)})`;
        case "image":
          return `${node.alt || "圖片"} (${absoluteUrl(node.url, siteUrl)})`;
        case "break":
          return "\n";
        default:
          return "children" in node ? inlineText(node.children as PhrasingContent[], siteUrl) : "";
      }
    })
    .join("");
}

function blockText(nodes: AnyContent[], siteUrl: string): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "heading":
        case "paragraph":
          return inlineText(node.children, siteUrl);
        case "list":
          return node.children
            .map((item, index) => {
              const marker = node.ordered ? `${(node.start ?? 1) + index}.` : "-";
              return `${marker} ${blockText(item.children, siteUrl).replaceAll("\n\n", "\n  ")}`;
            })
            .join("\n");
        case "blockquote":
          return blockText(node.children, siteUrl)
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n");
        case "code":
          return node.value;
        case "thematicBreak":
          return "---";
        default:
          return "children" in node ? blockText(node.children as AnyContent[], siteUrl) : "";
      }
    })
    .filter((block) => block !== "")
    .join("\n\n");
}

export function renderIssueEmail({ markdown, siteUrl }: RenderOptions): RenderedIssue {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const origin = siteUrl.replace(/\/$/, "");

  return {
    html: blockHtml(tree.children, origin),
    text: blockText(tree.children, origin),
  };
}

import { describe, expect, it } from "vitest";
import { renderIssueEmail } from "./email";

const render = (markdown: string) => renderIssueEmail({ markdown, siteUrl: "https://leochiu.com" });

describe("rendering an issue for email", () => {
  it("carries every style inline, because email clients drop stylesheets", () => {
    const { html } = render("## 這一期\n\n一段話。");

    expect(html).toContain("這一期");
    expect(html).toContain("一段話。");
    expect(html).toContain("style=");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("<style");
  });

  it("makes a relative link absolute, since a relative link is dead in an inbox", () => {
    const { html, text } = render("[那篇文章](/blog/hello/)");

    expect(html).toContain('href="https://leochiu.com/blog/hello/"');
    expect(text).toContain("https://leochiu.com/blog/hello/");
  });

  it("leaves a link that is already absolute alone", () => {
    const { html } = render("[Cloudflare](https://developers.cloudflare.com/d1/)");

    expect(html).toContain('href="https://developers.cloudflare.com/d1/"');
  });

  it("renders a bullet list as a list", () => {
    const { html } = render("- 第一點\n- 第二點");

    expect(html).toContain("<ul");
    expect(html).toContain("第一點");
    expect(html).toContain("第二點");
  });

  it("renders emphasis and quotes", () => {
    const { html } = render("**很重要**\n\n> 有人說過的話");

    expect(html).toContain("<strong");
    expect(html).toContain("很重要");
    expect(html).toContain("<blockquote");
    expect(html).toContain("有人說過的話");
  });

  it("escapes markup in the prose so content cannot break the email", () => {
    const { html } = render("a < b & c");

    expect(html).toContain("a &lt; b &amp; c");
  });

  it("keeps the words and the link targets in the plain-text version", () => {
    const { text } = render("## 標題\n\n看 [這裡](/blog/x/) 就懂了。");

    expect(text).toContain("標題");
    expect(text).toContain("看 這裡 (https://leochiu.com/blog/x/) 就懂了。");
  });

  it("leaves no markup in the plain-text version", () => {
    const { text } = render("## 標題\n\n**粗的** 和 [連結](/a/)\n\n- 一\n- 二");

    expect(text).not.toContain("<");
    expect(text).not.toContain("**");
  });

  it("renders a bullet list as lines in the plain-text version", () => {
    const { text } = render("- 一\n- 二");

    expect(text).toContain("- 一");
    expect(text).toContain("- 二");
  });
});

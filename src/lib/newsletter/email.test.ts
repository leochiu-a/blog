import { describe, expect, it } from "vitest";
import { renderIssueEmail, renderPostExcerpt } from "./email";

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

  it("renders an image as an img with an absolute src and its alt text", () => {
    const { html, text } = render("![架構圖](/blog-images/arch.webp)");

    expect(html).toContain('<img src="https://leochiu.com/blog-images/arch.webp" alt="架構圖"');
    expect(html).toContain("max-width:100%");
    expect(text).toContain("架構圖 (https://leochiu.com/blog-images/arch.webp)");
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

  it("sets an item's byline apart from the prose under it", () => {
    const { html } = render("### [那篇](/blog/x/)\n\n*Leo Chiu · 9 分鐘*\n\n講了什麼。");

    // The italics are dropped along with the paragraph styling: CJK has no
    // italic, and a client that slants the glyphs itself makes 分鐘 unreadable.
    expect(html).toContain("Leo Chiu · 9 分鐘");
    expect(html).not.toContain("<em>Leo Chiu");
    expect(html).toContain("font-style:normal");
  });

  it("leaves italics alone where they are not a byline", () => {
    const { html } = render("這句話有 *重點* 在裡面。");

    expect(html).toContain("<em>重點</em>");
  });

  it("does not underline an item title, the way the site does not", () => {
    const { html } = render("### [那篇](/blog/x/)\n\n看 [這裡](/blog/y/)。");

    expect(html).toContain(
      '<a href="https://leochiu.com/blog/x/" style="color:#ff6719;text-decoration:none;"',
    );
    expect(html).toContain(
      '<a href="https://leochiu.com/blog/y/" style="color:#ff6719;text-decoration:underline;"',
    );
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

describe("rendering the opening of a Post for email", () => {
  const excerpt = (markdown: string) =>
    renderPostExcerpt({
      markdown,
      siteUrl: "https://leochiu.com",
      postUrl: "https://leochiu.com/blog/hello/",
    });
  const paragraph = (n: number) => `${"字".repeat(300)}${n}\n\n`;

  it("carries a Figure as an image, and leaves demos out", () => {
    const { html } = excerpt(
      [
        '<Figure src="/blog-images/hero.webp" alt="封面" width={100} height={50} hero />',
        "<Demo />",
        "開頭一段。",
      ].join("\n\n"),
    );

    expect(html).toContain('<img src="https://leochiu.com/blog-images/hero.webp" alt="封面"');
    expect(html).toContain("開頭一段。");
    expect(html).not.toContain("Demo");
  });

  it("carries a Clip as its poster, linked to the post", () => {
    const { html, text } = excerpt(
      '<Clip src="/blog-videos/a.mp4" poster="/blog-images/a-poster.webp" width={1280} height={760} />\n\n文字。',
    );

    expect(html).toContain(
      '<a href="https://leochiu.com/blog/hello/"><img src="https://leochiu.com/blog-images/a-poster.webp"',
    );
    expect(html).not.toContain("<video");
    expect(text).toContain("到網站上看影片 (https://leochiu.com/blog/hello/)");
  });

  it("carries a YouTube embed as its thumbnail, linked to the video", () => {
    const { html } = excerpt(
      '<VideoEmbed src="https://www.youtube.com/embed/Ie6jQPVFerE" title="介紹影片" />\n\n文字。',
    );

    expect(html).toContain('href="https://www.youtube.com/watch?v=Ie6jQPVFerE"');
    expect(html).toContain('src="https://img.youtube.com/vi/Ie6jQPVFerE/hqdefault.jpg"');
    expect(html).toContain("介紹影片");
    expect(html).not.toContain("<iframe");
  });

  it("carries a LinkCard as a card of its title, summary and site", () => {
    const { html, text } = excerpt(
      '<LinkCard href="https://github.com/a/b" title="a/b" description="一個工具" site="GitHub" image="/x.webp" />\n\n文字。',
    );

    expect(html).toContain("<table");
    expect(html).toContain('<a href="https://github.com/a/b"');
    expect(html).toContain("一個工具");
    expect(html).toContain("GitHub");
    expect(html).not.toContain("x.webp");
    expect(text).toContain("a/b — GitHub (https://github.com/a/b)");
  });

  it("reads a Figure whose tag spans several lines", () => {
    const { html } = excerpt('<Figure\n  src="/blog-images/a.webp"\n  alt="圖"\n/>\n\n文字。');

    expect(html).toContain("https://leochiu.com/blog-images/a.webp");
  });

  it("drops imports and exports rather than printing them", () => {
    const { html, text } = excerpt('import Demo from "@/components/Demo";\n\n文字。');

    expect(html).not.toContain("import");
    expect(text).toBe("文字。");
  });

  it("stops after about 500 characters, on a block boundary", () => {
    const { text } = excerpt(paragraph(1) + paragraph(2) + paragraph(3));

    // Two paragraphs reach the budget; the third is the site's to show.
    expect(text).toContain("字1");
    expect(text).toContain("字2");
    expect(text).not.toContain("字3");
  });

  it("never ends on a heading with nothing under it", () => {
    const { html } = excerpt(`${paragraph(1)}${paragraph(2)}## 下一節\n\n${paragraph(3)}`);

    expect(html).not.toContain("下一節");
  });
});

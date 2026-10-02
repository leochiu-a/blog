import { describe, expect, it } from "vitest";
import { issueEmail, postEmail } from "./templates";

const issue = {
  title: "第一期",
  markdown: "哈囉。\n",
  siteUrl: "https://leochiu.com",
  issueUrl: "https://leochiu.com/newsletter/first/",
  unsubscribeUrl: "https://leochiu.com/newsletter/unsubscribe/",
};

/**
 * The two links used to sit on one line, separated by a `·`: the way back into
 * this edition and the way out of the newsletter, one click apart and in the
 * same grey. Reading on the web is part of the Issue; leaving is housekeeping.
 */
describe("an Issue's closing links", () => {
  it("keeps reading online and unsubscribing on separate lines", () => {
    const lines = issueEmail(issue).html.split("\n");

    const together = lines.filter(
      (line) => line.includes(issue.issueUrl) && line.includes(issue.unsubscribeUrl),
    );
    expect(together).toEqual([]);
  });

  it("offers the web version with the Issue, above the footer rule", () => {
    const { html } = issueEmail(issue);

    expect(html.indexOf(issue.issueUrl)).toBeLessThan(html.indexOf("border-top"));
  });

  it("leaves unsubscribing as the last thing said, in both bodies", () => {
    const { html, text } = issueEmail(issue);

    expect(html.lastIndexOf(issue.unsubscribeUrl)).toBeGreaterThan(
      html.lastIndexOf(issue.issueUrl),
    );
    expect(text.trimEnd().endsWith(issue.unsubscribeUrl)).toBe(true);
  });
});

describe("a Post's email", () => {
  const post = {
    title: "你好",
    subtitle: "副標",
    markdown: "開頭一段。\n",
    siteUrl: "https://leochiu.com",
    postUrl: "https://leochiu.com/blog/hello/",
    unsubscribeUrl: "https://leochiu.com/newsletter/unsubscribe/",
  };

  it("sends the title, the opening, and a link to the whole Post", () => {
    const { subject, html, text } = postEmail(post);

    expect(subject).toBe("你好");
    expect(html).toContain("開頭一段。");
    expect(html).toContain(`href="${post.postUrl}"`);
    expect(text).toContain(`閱讀全文：${post.postUrl}`);
  });

  it("closes with the unsubscribe link, as every email to the list does", () => {
    const { text } = postEmail(post);

    expect(text.trimEnd().endsWith(post.unsubscribeUrl)).toBe(true);
  });

  it("refuses a Post whose opening has nothing to show in an inbox", () => {
    expect(() =>
      postEmail({ ...post, markdown: 'import Demo from "@/components/Demo";\n\n<Demo />\n' }),
    ).toThrow(/沒有文字/);
  });

  it("carries only the opening of a long Post", () => {
    const long = Array.from({ length: 6 }, (_, i) => `${"字".repeat(300)}${i}`).join("\n\n");

    const { text } = postEmail({ ...post, markdown: long });

    expect(text).toContain("字0");
    expect(text).not.toContain("字5");
  });
});

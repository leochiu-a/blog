import { describe, expect, it } from "vitest";
import { issueEmail } from "./templates";

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

import { describe, expect, it } from "vitest";
import { SITE_URL } from "../site";
import { testIssueEmail } from "./test-send";

const issue = {
  slug: "first",
  frontmatter: { title: "第一期", datetime: "2026-09-01T00:00:00+08:00" },
  markdown: "哈囉。\n",
};

describe("testIssueEmail", () => {
  it("marks the subject, so a test is never mistaken for the Issue itself", () => {
    expect(testIssueEmail(issue).subject).toBe("[測試] 第一期");
  });

  it("marks the subject line an Issue overrode the title with", () => {
    const email = testIssueEmail({
      ...issue,
      frontmatter: { ...issue.frontmatter, subject: "本週：三件事" },
    });

    expect(email.subject).toBe("[測試] 本週：三件事");
  });

  /**
   * A broadcast carries `{{{RESEND_UNSUBSCRIBE_URL}}}` for Resend to swap per
   * contact. A test send is not a broadcast, so nothing would replace it — the
   * placeholder would arrive verbatim as a dead link.
   */
  it("links the unsubscribe page rather than a placeholder Resend never sees", () => {
    const { html, text } = testIssueEmail(issue);

    for (const body of [html, text]) {
      expect(body).toContain(`${SITE_URL}/newsletter/unsubscribe/`);
      expect(body).not.toContain("RESEND_UNSUBSCRIBE_URL");
    }
  });

  it("still points at where the Issue will live on the web", () => {
    expect(testIssueEmail(issue).html).toContain(`${SITE_URL}/newsletter/first/`);
  });
});

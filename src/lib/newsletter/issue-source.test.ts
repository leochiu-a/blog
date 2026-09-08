import { describe, expect, it } from "vitest";
import { parseIssueSource } from "./issue-source";

const FRONTMATTER = `---
title: 第一期
datetime: 2026-09-01T00:00:00+08:00
---
`;

describe("parseIssueSource", () => {
  it("splits validated frontmatter from the body", () => {
    const issue = parseIssueSource("first", `${FRONTMATTER}\n哈囉。\n`);

    expect(issue).toMatchObject({ ok: true, markdown: "哈囉。\n" });
    if (issue.ok) expect(issue.frontmatter.title).toBe("第一期");
  });

  it("reads a draft rather than refusing it — who may send one is not its call", () => {
    const source = `---
title: 還在寫
datetime: 2026-09-01T00:00:00+08:00
draft: true
---

一段。
`;

    const issue = parseIssueSource("wip", source);

    expect(issue.ok).toBe(true);
    if (issue.ok) expect(issue.frontmatter.draft).toBe(true);
  });

  it("names the file when there is no frontmatter at all", () => {
    const issue = parseIssueSource("bare", "沒有 frontmatter 的檔案\n");

    expect(issue).toEqual({ ok: false, error: "bare.md 沒有 frontmatter" });
  });

  it("reports a frontmatter block that does not typecheck", () => {
    const issue = parseIssueSource("broken", "---\ntitle: 沒有日期\n---\n\n內文\n");

    expect(issue.ok).toBe(false);
    if (!issue.ok) expect(issue.error).toContain("broken.md 的 frontmatter 有問題");
  });
});

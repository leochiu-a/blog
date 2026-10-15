---
name: agy-summarize
description: Have the Antigravity CLI (`agy`, Gemini) read a set of articles and write the Traditional Chinese blurbs for them, then verify its facts before anything lands. Use when Leo says things like "請 agy 幫忙摘要", "叫 gemini 讀這幾篇", "用 agy 生這期電子報的摘要", "讓 gemini 改一下語氣", or hands over a list of links and asks for another model's version. Pairs with the newsletter-digest skill, which owns the GitHub issue; this one owns the drafting. Requires `~/.local/bin/agy`.
---

# Summarising with agy (Antigravity CLI / Gemini)

Leo keeps the Antigravity CLI around as a second writer. It is better than us at
one specific thing — an even, warm Traditional Chinese register that does not
read like a report — and worse at one specific thing: it invents precision when
it has none. So the division of labour is fixed:

**agy writes the prose. You own the facts.** Nothing it produces reaches a file
until the numbers, links and structure have been checked here.

## The binary

`agy` is **not on PATH** — always call it by full path:

```bash
~/.local/bin/agy --version
```

The older `~/Library/pnpm/gemini` shim is broken (its package is gone from the
pnpm store); Antigravity replaced it. `/Applications/Antigravity.app` is the GUI
and has no CLI entry point.

Non-interactive form, and the model Leo prefers:

```bash
~/.local/bin/agy -p "$(cat prompt.txt)" --model gemini-3.8-flash-high --print-timeout 8m
```

`agy models` lists the rest (Gemini 3.1 Pro, Codex, GPT-OSS). Ask for a
different one only if Leo names it — Flash 3.8 High is the default here because
it is the register he picked.

A run over ~10 URLs takes several minutes, so send it to the background rather
than blocking a foreground call.

## Permissions — the part that wastes an hour if you get it wrong

Headless mode cannot prompt, so any tool needing approval is **auto-denied** and
you get an empty output file plus a one-line stderr notice. Two rules:

1. The file that governs the CLI is **`~/.gemini/antigravity-cli/settings.json`**.
   It is *not* `~/.gemini/settings.json` — editing that one changes nothing and
   touches Leo's shared Antigravity settings for no reason.
2. Never reach for `--dangerously-skip-permissions`. It approves *every* tool,
   shell commands included.

To let it fetch URLs, add host-scoped `read_url` rules, then put the file back.
`scripts/with-read-url.sh` in this skill directory does exactly that, restoring
the settings file even if the run fails:

```bash
.Codex/skills/agy-summarize/scripts/with-read-url.sh prompt.txt out.md \
  cpojer.net pnpm.io github.com
```

The rule form that works is `read_url(https://<host>/*)`. A bare `read_url` and
`read_url(*)` are both silently ignored.

**Do not grant the `command` permission.** It asks for that when it wants to
`cat` a local file — inline the file's text into the prompt instead. Local posts
are usually the two or three Markdown files under `src/content/blog/`, and
40 KB of prompt is not a problem.

## Two stages, never one

Asking for facts and prose in the same turn is what makes it slide into
consultant register ("這篇建立了…框架", "劃分出…架構邊界", "敲響了管理警鐘"). Split it:

**Stage 1 — reading.** Give it the URLs and ask only for a fact list: every
number and claim it intends to use, each with the section of the source it came
from. Ask for the two halves behind `===MARKDOWN===` / `===FACTS===` markers so
they split cleanly.

**Stage 2 — writing.** Feed back *its own* fact list from stage 1, plus a
sample of the register Leo already approved, plus the length cap. Tell it
explicitly which facts from stage 1 were wrong. It respects corrections.

Stage 2's prompt needs, every time:

- **A hard character cap per item**, stated as a hard limit ("每一則不能超過 200 字，寧可少寫也不要超過"). Without it, items run 250+ characters. It honours the cap.
- **The skeleton** — the `##`, `###` (title *and* URL) and `*meta*` lines
  verbatim, with "一個字都不能改，只重寫介紹段落".
- **Structure per item**: 第一句給框架 → 最強的那一個事實 → 判斷. And that at a
  200-character budget it must pick one fact, not squeeze in all of them.
- **Uneven heat**: "十一則的熱度不要一樣，最推薦的要說出來，可以跳過的就說可以跳過."
  Left alone it gives every item the same enthusiasm, which is what kills a
  curated letter.
- **The ban list** (it invents new ones each round, so keep extending it):
  本文探討、本文解析、快速導覽、深入淺出、大幅、無痛、極佳、寶貴、釋放潛能、
  鉅細靡遺、耐人尋味、觸動人心、認知重塑.
- 繁體中文（台灣用語）, and "只輸出 Markdown，不要前言後語".

## Verify before it lands

Mechanical checks first — they are cheap and catch the worst failure:

```python
# 連結必須逐一相同（它最嚴重的一次失誤是把 11 個連結全部換成同一個網址）
# 標題行、meta 行必須一字不差
# 數字集合不能有新增或消失
# 每則字數不能超過上限
```

Then read it. Its recurring failure modes, all observed:

| Tell | Example seen |
|---|---|
| Invented reading times | 標了 `2 min`，但那個頁面根本沒有標閱讀時間 |
| Invented precision | 「單日最高 1,200 行」加上了原文沒有的「每週約一次」 |
| Overclaims that flip a fact | pnpm 12「完全不需要改動工作習慣」——它有破壞性變更 |
| Category drift | Cloudflare 的「體積上限」寫成「計費政策」 |
| Dropping the substance to fit the cap | 把一篇文章的六項價值清單整個拿掉，只留一個數字 |
| Fresh inflation adjectives | 每一輪都會長出新的，逐一刪掉 |

One more tell, specific to Leo's own posts: it refers to him as 「作者」. Under
the 「我自己寫的」 heading that reads wrong — switch those to first person.

Before calling something invented, find the line. A claim we flagged as
fabricated ("模型已能自己撐完兩個多小時") turned out to be sitting at line 73 of
the post; we had only read line 163, which says 「數小時」 about the same change.
Both were in the text, and its version was the sourced one.

Spot-verify any specific it produced that you have not seen yourself — a
maintainer's name, a quoted phrase, a clock time — with WebFetch against the
source. Its stage-1 reading is more reliable than it looks: in practice the
specifics that seemed too precise to be real (`4:12 p.m.`, `ninety-two. rank
three.`, README authorship) all checked out, while the fabrications were the
*rounded* ones. Do not dismiss a detail for being oddly specific; check it.

It is also worth taking its corrections seriously. It has caught real errors in
our own drafts — a values list we counted as five when the article lists six,
and a quote we had only half of.

## Reporting back

Tell Leo exactly which words are whose: what came from agy verbatim, what you
edited, and what you took only as a fact. He asks, and the answer should not
need reconstructing.

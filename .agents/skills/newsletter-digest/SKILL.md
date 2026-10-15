---
name: newsletter-digest
description: Add an article link to this week's running "RD#N" curated-links issue on the leochiu-a/blog GitHub repo, reading the article and writing a short Traditional Chinese blurb for it automatically, which Leo later turns into his weekly newsletter. Trigger this whenever Leo says things like "把這篇加到本週電子報", "這篇不錯，記錄到 blog issue", "加到電子報清單/週報", or shares an article link saying it's good/worth keeping for the newsletter — even if he doesn't name the skill explicitly, and even if he doesn't say anything about what the article is about (that's your job to figure out). Requires the `gh` CLI authenticated with write access to leochiu-a/blog.
---

# Newsletter Digest

Leo curates articles he likes throughout the week into a running GitHub issue
on `leochiu-a/blog`. Each issue is one week's worth of links, titled
`RD#<N> <標題>` — a sequential number saying which newsletter issue this will
go out as (RD#1, RD#2, RD#3...), plus a short title for that week. Each week
he later turns the issue's contents into an actual newsletter post. Your job
is just to add one entry to the current week's issue — find it if it's open,
or start a new one if the last week's has already been closed out.

## Entry format

Every entry in the issue body follows this exact pattern (this is the
existing convention in the repo — match it precisely):

```
<N>. **<Title>**
<URL>
   <閱讀時間> · <作者>

   <一段 3–4 句的摘要>
```

The model for this layout is React Digest (reactdigest.net) — Leo pointed
at it as the feel he wants. Each item there is a title, a short meta line
(`9 minutes by Jules Blom`), then one compact paragraph of plain prose.
So: title on its own line, URL on the next, then the meta line indented
three spaces, a blank line, and the summary as one indented paragraph.

- Don't cram the summary onto the title line with ` — ` (an older
  convention here), and don't break it into sub-bullets — flowing prose is
  the point.
- The meta line is `<閱讀時間> · <作者>`, e.g. `9 分鐘 · Leo Chiu`. Only state
  a reading time the page itself gives you; if it doesn't, either estimate
  and mark it (`約 10 分鐘 · <作者>`) or drop it. For something with no
  author or reading time at all — a repo, a docs page — use a short source
  label instead (`Vercel 官方文件`) or omit the meta line entirely.

- `<N>` is the entry's position in *this issue* (1, 2, 3...), not the RD
  number.
- The title is bold. Keep it short — usually just the article's own title,
  translated or paraphrased into natural Traditional Chinese if the source
  is in English and Leo is describing it in Chinese, but keep an English
  proper noun (library name, product name) as-is rather than forcing a
  translation.
- **Write the blurb yourself by actually reading the article — don't wait
  for Leo to describe it.** This is the main value you add here: he's
  handing you a link because he liked it, not because he wants to write
  the summary too. Read the page (see below), then write **one paragraph
  of 3–4 sentences** in Traditional Chinese. One sentence naming the
  subject is too thin; a run-on wall of clauses is too dense. React
  Digest's own entries are the length to match.
  - Structure the paragraph the way React Digest does: open with what the
    thing actually is or claims, then the specifics that back it — the
    number, the tradeoff, the named concept, the surprise — and close on
    the part worth remembering. "拆解了 Yahoo 的個案" is a topic label, not a
    summary; "選 built-in AI 是為了成本與隱私，費用曲線被拉平才敢開放給所有賣家" is a
    sentence that carries something.
  - The depth to aim for is the depth of the newsletter itself. Leo's
    published issues summarize each item with the reasoning attached —
    e.g. "身體機能是因為不用而退化，不是一夕之間消失，所以要刻意增加走路、伸展、下跪、攀爬等
    不同姿勢的活動" carries the *why*, not just the advice. Match that.
  - Plain, direct register — describe, don't sell. React Digest writes
    "Small animation fixes made a blog feel much more polished", not
    "本文深入探討...". A little opinionated is fine.
  - If Leo *did* say something about the article himself (why he liked it,
    what stood out), work it into the paragraph — his take is worth
    keeping, even alongside your own read of the content.
  - Skip the summary (bare title + link) only when the link
    itself basically *is* the content and a summary would be redundant —
    e.g. a one-line tool announcement, a changelog, a repo whose README
    title says it all. Use your judgment; when in doubt, include the
    blurb.
- The URL goes on its own line right after the title line, with a blank
  line separating it from the next numbered entry.

## Workflow

1. **Find this week's issue.** There is at most one open `RD#` issue at a
   time (Leo closes each one out when he's turned it into an actual
   newsletter post):

   ```
   gh issue list --repo leochiu-a/blog --state open --json number,title,body --limit 20
   ```

   Pick the open issue whose title starts with `RD#` — that's this week's
   issue; go to step 3. List and filter locally rather than passing
   `--search "RD# in:title"`: GitHub's title search does not reliably match
   `RD#`, and it silently returns nothing, which reads exactly like "no open
   issue" and will send you off to create a duplicate.

2. **No open `RD#` issue found — start a new one.** Work out the next
   number from *all* issues, open and closed, so the count doesn't reset:

   ```
   gh issue list --repo leochiu-a/blog --state all --json number,title --limit 200
   ```

   Take the highest `RD#<N>` you can see and use `N+1`; if there is no `RD#`
   issue at all, start at `RD#1`. Sanity-check it against the newsletters
   that have actually gone out — `src/content/newsletter/*.md` in the blog
   repo, ignoring any with `draft: true` — since the number says which issue
   this will be sent as. For the `<標題>` part, ask Leo what he wants to call
   the week if it isn't obvious from what he's sent you; a short one is
   fine, and he can always rename the issue afterwards.

   Create it with the first entry already in the body:

   ```
   gh issue create --repo leochiu-a/blog \
     --title "RD#<N> <標題>" \
     --body "1. **<Title>**
<URL>
   <閱讀時間> · <作者>

   <摘要>"
   ```

   Report the new issue's URL back to Leo and stop here — no need to also
   do step 3 for this entry.

3. **Append to the existing issue.** Read the current body's numbered
   entries to find the next number, then write the *entire* new body
   (existing entries + the new one) to a temp file and push it with
   `gh issue edit` — `gh issue edit --body` replaces the whole body, it does
   not append, so you must include everything:

   ```
   gh issue edit <issue-number> --repo leochiu-a/blog --body-file /tmp/digest-body.md
   ```

   Build that file from the issue's own body rather than retyping it, so
   the earlier entries can't drift:

   ```
   gh issue view <issue-number> --repo leochiu-a/blog --json body -q .body > /tmp/digest-old.md
   printf '%s\n\n<N>. **<Title>**\n<URL>\n   <閱讀時間> · <作者>\n\n   <摘要>\n' "$(cat /tmp/digest-old.md)" > /tmp/digest-body.md
   ```

   Note that the existing body often starts with blank lines and may have
   entries that don't match the format perfectly (a missing bold, a
   trailing space). Leave all of it exactly as-is — don't reformat or
   "clean up" earlier entries, just add yours at the end. Verify the old
   body survived byte-for-byte before pushing, then confirm to Leo with the
   issue's URL and which entry number you added.

## Reading the article

Fetch the URL and actually read it before writing the entry — every time,
not just when Leo gives you nothing to go on. You need the real title
(don't guess it from the URL slug), the author's name and the page's
own stated reading time for the meta line, and enough of the content to write an
accurate one-sentence blurb, per the entry format above. For a long piece,
you don't need to read every word — skim for the core argument or finding,
the same way you would when summarizing an article for a newsletter
digest elsewhere. If the page fails to load or is paywalled/behind a
login, fall back to whatever title and context Leo gave you and say so
when you confirm the entry, rather than inventing a blurb for content you
never actually saw.

## If `gh` isn't authenticated for this repo

This only works where `gh auth status` shows a valid token with access to
`leochiu-a/blog` (Leo said he'll run this where `gh` is set up, e.g. via his
own machine through the desktop bridge, or a session with repo access
configured). If `gh api repos/leochiu-a/blog/...` or `gh issue list`
fails with an auth/permission error, don't try to work around it with
scraping or the public web page — tell Leo plainly that this environment
doesn't have write access to the repo yet, and that he needs to run this
where `gh` is authenticated for it.

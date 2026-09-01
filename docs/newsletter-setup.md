# Newsletter: one-time setup

Everything below has to happen once, in a Cloudflare and a Resend account, and
none of it is in this repo. The code is complete without it, and will refuse to
run with a clear error until it is done.

## 1. The database

```bash
pnpm wrangler d1 create blog-newsletter
```

Put the printed `database_id` into both `wrangler.jsonc` and
`wrangler.send.jsonc`, then apply the schema. Local first, so `next dev` has a
table:

```bash
pnpm wrangler d1 migrations apply blog-newsletter --local
pnpm wrangler d1 migrations apply blog-newsletter --remote
```

## 2. The sending domain

Add `news.leochiu.com` as a domain in Resend and create the DKIM, SPF and DMARC
records it asks for. Do not send from the apex domain: `leochiu.com` will
eventually carry real correspondence, and a newsletter's complaint rate must not
be able to put those messages in a spam folder.

Replies go to `hi@leochiu.com`, which needs Cloudflare Email Routing (free, and
already generally available) pointed at a real inbox. `news.leochiu.com` has no
MX record, so without this a subscriber who hits Reply gets a bounce.

## 3. Resend

Create a Segment for the confirmed addresses and note its id. Local secrets go
in `.dev.vars` (gitignored), which is where both `next dev` and the send script
read them from — Wrangler hands the same values to each:

```
NEWSLETTER_TOKEN_SECRET=any-long-random-string
RESEND_API_KEY=re_...
RESEND_SEGMENT_ID=...
TURNSTILE_SECRET_KEY=0x4...
```

## 4. Turnstile

Create a widget for `leochiu.com` (free, unlimited verifications) and set the
site key in `.env.local` as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — that one is a
Next.js public variable rather than a Worker secret, so it belongs there and not
in `.dev.vars`. Add `localhost` to the widget's allowed domains while you are
there: the same real pair is used in development, and without that entry the
widget refuses to run on `next dev` with `Turnstile Error: 600010`. Cloudflare's
always-passing test keys are not an alternative here — see "Rehearsing the whole
thing" for why they fail this endpoint's checks.

## 5. Worker secrets

The deployed Worker reads these from `wrangler secret`, not from `.dev.vars`:

```bash
pnpm wrangler secret put NEWSLETTER_TOKEN_SECRET   # any long random string
pnpm wrangler secret put RESEND_API_KEY
pnpm wrangler secret put RESEND_SEGMENT_ID
pnpm wrangler secret put TURNSTILE_SECRET_KEY
```

`NEWSLETTER_TOKEN_SECRET` signs every confirmation and unsubscribe link.
Rotating it invalidates the links already sitting in people's inboxes, so treat
it as permanent unless it leaks.

## 6. Rate limiting

Add one WAF rate limiting rule for path `/api/newsletter/subscribe`. The free
plan allows a single rule with a ten-second window and a ten-second block, which
is enough to blunt a burst and not enough to stop a slow flood — the cooldown,
the daily cap and Turnstile are what actually carry that load.

## Writing and sending

Write an Issue as a file in `src/content/newsletter/`, using
`hello-newsletter.md` as the shape. The dev editor at `/editor` still only
knows about posts — `src/lib/editor/store.ts` is fixed to `src/content/blog` —
so teaching it about Issues is a separate change.

Keep `draft: true` until the Issue is finished: a draft is hidden from the
archive and the send script refuses to mail it. Then:

```bash
pnpm newsletter:send hello-newsletter --dry-run
```

which prints the subject, the recipient count, what reconciliation would do,
and the first lines of the plain text version. `--dry-run` writes nothing to
either store — not to D1 and not to the Resend segment — so it is safe to run
against the deployed list. Drop it and type `yes` to send.

## Rehearsing the whole thing

Everything below runs against the local database and Resend's simulator
addresses, so no real subscriber is involved.

Keep the real key pair and start `next dev`. Cloudflare's always-passing test
keys look like the obvious choice here and cannot work: `verifyTurnstile`
checks three things, and a dummy token fails two of them. Siteverify answers a
dummy token with no `action` field at all, where the code requires `subscribe`,
and with `hostname` set to `example.com`, which is not a hostname this site
serves. Both checks are the reason that function exists rather than incidental
to it, so the answer is not to relax them for local work.

What the real widget needs instead is `localhost` among its allowed domains,
added once in the Turnstile dashboard. `allowedHostnames()` already admits
`localhost` and `127.0.0.1` when `NODE_ENV` is `development`, so that one
dashboard change is the whole distance between the real keys and a working
local subscribe. Until it is made, the browser console reports `Turnstile
Error: 600010`, the hidden `cf-turnstile-response` field stays empty, and the
endpoint answers 400 — which is indistinguishable from a failed challenge from
the outside, and easy to misread as a mistyped key.

To watch the endpoint reject a challenge, post a bogus token straight at it
rather than swapping the keys over:

```bash
curl -i -X POST http://localhost:7788/api/newsletter/subscribe/ \
  -H 'content-type: application/json' \
  -d '{"email":"delivered@resend.dev","turnstileToken":"not-a-token"}'
```

Subscribe at `/newsletter/` using one of Resend's simulator addresses —
`delivered@resend.dev` behaves like a normal recipient, `bounced@resend.dev`
and `complained@resend.dev` simulate the failures. They support `+` labels, so
`delivered+first@resend.dev` and `delivered+second@resend.dev` give you two
distinct subscribers. Note that simulator sends still count against the
account's quota.

The confirmation email is real mail sent to a simulated inbox, so you will not
see it. Read the link out of the local database instead:

```bash
pnpm wrangler d1 execute blog-newsletter --local   --command "SELECT email, status, confirmation_sent_at FROM subscribers"
```

then confirm by visiting `/newsletter/confirm/?token=...` with a token you sign
yourself, or — simpler — mark the row confirmed directly and get on with testing
the send:

```bash
pnpm wrangler d1 execute blog-newsletter --local   --command "UPDATE subscribers SET status = 'confirmed' WHERE email LIKE 'delivered%'"
```

Then rehearse the send against the local list:

```bash
pnpm newsletter:send hello-newsletter --local --dry-run
```

Drop `--dry-run` when you want to watch a real Issue go out to the
simulator addresses. `--local` only redirects the database — it passes
`remoteBindings: false` to Wrangler's platform proxy — while Resend is always
the real Resend, which is the point: the parts worth rehearsing are its
responses.

Without `--local` the script reads the deployed database. That works because it
loads `wrangler.send.jsonc` instead of `wrangler.jsonc`, and only that file
marks the D1 binding `remote`. The main config is deliberately left local — it
is the one `next dev` uses, and development must never write to the real list.
The script prints which database it is on before anything is sent; check that
line.

The two configs mean the database id is written twice. That is the cost of the
split, and it was chosen over a named environment: a named environment inherits
no bindings, so it has to mirror every binding the Worker declares or Wrangler
warns one is missing — and that mirror falls silently out of date the next time
a binding is added.

What this rehearsal does **not** cover: deliverability. Nothing about how the
real Gmail treats your domain can be learned from `delivered@resend.dev`. Before
the first genuine Issue, send one to your own address on a few different
providers and look at where it lands and what the headers say.

Things worth deliberately breaking once, because each has a code path you are
trusting: subscribe twice inside fifteen minutes (the second must send nothing),
subscribe with an address that already confirmed (identical response, no mail),
run the same send twice (the second must refuse on `issue_sends`), and submit
the form with the always-failing Turnstile keys (400, and nothing written to the
list).

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
in `.dev.vars` (gitignored), which is where `next dev` reads them from — the
editor's test send and real send included:

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
in `.dev.vars`. The widget is bound to `leochiu.com`, so it will not run on
`next dev` — the console reports `Turnstile Error: 600010` and no token is
produced. Local work uses Cloudflare's testing keys instead; see "Rehearsing the
whole thing".

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

Write an Issue in the dev editor: `pnpm dev`, then `/editor`, then **New issue**
under Newsletter. It is the same writing surface posts use, saving to
`src/content/newsletter/` — its settings are the ones an Issue has (a
description, a date, and a subject line for when it should read differently
from the title). Writing the file by hand works just as well; use
`hello-newsletter.md` as the shape.

Keep `draft: true` until the Issue is finished: a draft is hidden from the
archive, and the send refuses to mail it to the list.

While it is still a draft, mail it to yourself as often as you like. In the
editor, **Test email** sits next to Preview: type an address, press Enter, and
that address gets the Issue. It saves the document first, so what lands in the
inbox is the paragraph you were just looking at.

It is one ordinary email to one address — not a broadcast — so the subscriber
list is neither read nor written, no contact is created in Resend, and nothing
is recorded as sent. The subject arrives prefixed with `[測試]` so a test can
never be mistaken for the real Issue in an inbox, and the unsubscribe link
points at the bare `/newsletter/unsubscribe/` page, because a test recipient has
no per-subscriber token. This is also the only path that will mail a draft.

Use it on the providers that matter — a Gmail address, an Outlook one, your
phone — because how an Issue renders and where it lands is the one thing no
amount of local rehearsal answers.

When the Issue is finished, **Publish** it and then press **Send**, one along in
the same toolbar. The dialog is a review before an act, not a yes/no: the
subject line that will land in an inbox, and how many confirmed subscribers are
on the deployed list. Typing the slug arms the button; nothing before that goes
anywhere.

Both buttons are `.dev.ts` routes, so they exist only while `pnpm dev` is
running and the deployed app has no endpoint that sends mail on request. They
read `RESEND_API_KEY` and `RESEND_SEGMENT_ID` from `.dev.vars` like everything
else here; a Resend refusal — an invalid key, an unverified domain — comes back
into the dialog in its own words.

The send asks Resend whether it already holds a broadcast for this Issue,
reconciles both stores (unsubscribes at Resend written back to D1, confirmed
addresses missing from the segment pushed up), creates the broadcast, sends it,
and records it in `issue_sends`. Then the dialog turns into a receipt — the
count that went out, the Resend broadcast id, and what reconciliation moved —
and once dismissed the toolbar shows a **Sent** badge with the date instead of
a button.

To deliberately re-send, delete the row and the broadcast:

```bash
pnpm db:remote "DELETE FROM issue_sends WHERE issue_slug = 'hello-newsletter'"
```

The row alone is not enough, because the broadcast Resend still holds under the
same name is the second guard — see "Did it actually go out" below.

See docs/adr/0003-issues-are-sent-by-hand.md for why the trigger is a person in
the editor rather than a workflow.

## Did it actually go out

Three places, answering different questions.

**The receipt**, in the dialog, right after the send. Everything this system
knows: the subject that went out, how many addresses, the broadcast id as a
link, and the reconciliation figures. It is the only moment those are together
— the badge afterwards can only say the date.

**Resend → Broadcasts** is the only place that knows whether mail reached
anybody. The send names each broadcast `<date> <slug>`, so RD#1 appears as
`2026-09-01 rd-1-when-agents-take-over-code`; the broadcast carries a status
(`draft`, `queued`, `sent`) and per-recipient events — delivered, opened,
bounced, complained, unsubscribed. **Sent** in the editor means Resend accepted
the broadcast, never that it was delivered. Delivery is Resend's to report and
this system does not pretend to know it.

**`issue_sends`** is our own record of what has gone out:

```bash
pnpm db:remote "SELECT issue_slug, resend_broadcast_id, recipient_count, datetime(sent_at/1000, 'unixepoch', '+8 hours') AS sent FROM issue_sends"
```

The one failure worth understanding is a send Resend accepted followed by a
dropped write to that table: the mail is gone, the row is missing, and the
toolbar offers the button again. Pressing it does not send a second time —
the Resend lookup finds the broadcast under this Issue's name, writes the row
from Resend's own timestamp, and the receipt says so ("Resend 已經寄過了"). The
recipient count is recorded as 0 in that case, because Resend's list does not
carry one and a wrong number in an audit record is worse than an obvious gap;
the broadcast id is how the real figure is looked up.

A broadcast sitting at `draft` under the same name is the other half of that
window — created, never sent — and the send refuses it rather than guessing.
Send it or delete it in Resend, then come back.

## Rehearsing the whole thing

Everything below runs against the local database and Resend's simulator
addresses, so no real subscriber is involved.

Use Cloudflare's always-passing testing keys — the site key as
`NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` in `.env.local`, the
secret as `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` in
`.dev.vars`. **Restart `next dev` afterwards**: `.dev.vars` is read once, by
`getPlatformProxy()` at startup, so an edited secret is invisible to a server
that is already running and every subscribe answers 400 as though the challenge
had failed.

Siteverify answers a testing key with no `action` and a fixed `example.com`
hostname, neither of which `verifyTurnstile` would otherwise accept. It makes a
single exception for them, and only when siteverify has set
`metadata.result_with_testing_key` on a development build — a production
response never carries that flag, so both checks stay whole where they matter.
`src/lib/newsletter/turnstile.test.ts` holds the line.

The real key pair cannot be used here at all: the widget is bound to
`leochiu.com`, so on `localhost` it fails with `Turnstile Error: 600010` and
never mints a token. Adding `localhost` to the widget's allowed domains is the
alternative if you would rather rehearse against the real thing.

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

That rehearses everything up to the send. The send itself has no local mode:
the editor's **Send** reads and writes the deployed list, because that is the
list it is about — `src/lib/newsletter/remote-env.ts` loads
`wrangler.send.jsonc` instead of `wrangler.jsonc`, and only that file marks the
D1 binding `remote`. The main config is deliberately left local, since it is
the one the subscribe and confirm routes run on and development must never write
to the real list.

So a real broadcast is rehearsed the way it is reviewed: **Test email** to your
own inboxes, then the dialog's own figures — the subject and the recipient
count — before the one send that counts. Resend is always the real Resend
either way, which is the point: the parts worth rehearsing are its responses.

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
delete an `issue_sends` row and re-send the same Issue (the toolbar offers the
button again, which is the only way back to one), and submit
the form with the always-failing Turnstile keys (400, and nothing written to the
list).

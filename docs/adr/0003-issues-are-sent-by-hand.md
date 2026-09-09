# Issues are sent by hand, never by CI

The send lives in the editor: an Issue's toolbar has a **Send** button, which
opens a review — the subject line, how many confirmed subscribers it would
reach — and arms only once the Issue's slug is typed back. There is no workflow
that mails an Issue when it merges, and adding one would be a mistake rather
than an improvement.

Sending is the only irreversible action in the system. Everything else here can
be corrected by editing a file and deploying again; an Issue in five thousand
inboxes cannot be recalled, only apologised for, and an apology costs
subscribers. Automating the trigger removes the last point at which a typo, a
wrong link, or an Issue that was not finished can still be caught — and the
failure mode it introduces (forgetting `draft: true`, re-deploying after a
one-character fix) sends mail rather than merely breaking a build.

"By hand" is about who decides, not about which surface they decide on. The
button is a `.dev.ts` route, so it exists only while `next dev` is running on
the machine the Issue is being written on — the same laptop, the same Wrangler
login, and the same person as the `pnpm newsletter:send` command it replaced.
What the terminal had over a button was the typed `yes`, so the dialog asks for
the slug: a control that cannot be reached with one stray click, in the one
place the Issue is already being read.

An earlier version of this decision said the opposite — that a test send was
allowed a button while the real send was not. Two paths that render the same
Issue and mail it can disagree, and the one that could not be checked in an
inbox first was the terminal's. Keeping both would have meant maintaining a
second way to do the irreversible thing; the editor now does it, and
`src/lib/newsletter/send-issue.ts` is the only code that mails an Issue to the
list.

`issue_sends` has `issue_slug` as its primary key, so a second send of the same
Issue fails on the constraint rather than on someone remembering. It is also
what the editor reads to draw the toolbar: an Issue that has gone out shows a
**Sent** badge with the date and no send button at all, so "did I already send
this?" is answered by looking rather than by pressing. The constraint stays
underneath that as the guard it always was, because the human step will
occasionally be run twice.

What that row cannot guard is the moment it does not exist yet: mail accepted
by Resend, and then a dropped write. So Resend is asked first, by the name the
send derives rather than one a person types — `<date> <slug>`, which makes its
own broadcast list an idempotency key. A broadcast already sent under this
Issue's name turns the second press into the repair of a missing row instead of
a duplicate send. That check is the only reason a person can press Send twice
in good faith and not regret it, which is the same reason the typed slug is
there: this path has to survive being run by someone who is not sure what
happened.

A test send is not an exception to any of this — neither the **Test email**
button in the toolbar nor `sendTestIssue` behind it. It mails the Issue to one
address a person just typed, through `emails.send` rather than a broadcast, and
reads and writes nothing: closer to opening the file than to sending, and with
nothing about it worth guarding. It exists so that the send which *is*
irreversible is the second time you have seen the Issue in an inbox, not the
first.

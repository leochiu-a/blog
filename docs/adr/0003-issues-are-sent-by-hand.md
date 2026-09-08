# Issues are sent by hand, never by CI

`pnpm newsletter:send <slug>` prints a summary, asks for `yes`, and only then
sends. There is no workflow that mails an Issue when it merges, and adding one
would be a mistake rather than an improvement.

Sending is the only irreversible action in the system. Everything else here can
be corrected by editing a file and deploying again; an Issue in five thousand
inboxes cannot be recalled, only apologised for, and an apology costs
subscribers. Automating the trigger removes the last point at which a typo, a
wrong link, or an Issue that was not finished can still be caught — and the
failure mode it introduces (forgetting `draft: true`, re-deploying after a
one-character fix) sends mail rather than merely breaking a build.

`issue_sends` has `issue_slug` as its primary key, so a second send of the same
Issue fails on the constraint rather than on someone remembering. That guard
exists because the human step will occasionally be run twice, not because it is
expected to be replaced.

A test send is not an exception to any of this — neither the `--test <email>`
flag nor the editor's **Send test** button, which share one code path. It mails
the Issue to one address a person just typed, through `emails.send` rather than
a broadcast, and reads and writes nothing: closer to opening the file than to
sending, and with nothing about it worth guarding. That is also why it is
allowed a button while the real send is not. It exists so that the run which
*is* irreversible is the second time you have seen the Issue in an inbox, not
the first.

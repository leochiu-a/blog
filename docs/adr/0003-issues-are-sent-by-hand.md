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

# A Draft Link is unlisted, not secret

A draft Post is built and served at its real URL on the deployed site, kept out
of every listing, and told to search engines as `noindex`. There is no token in
the link, no shared password in front of it, and nothing to revoke.

The obvious build is a signed token — an HMAC of the slug, or rows in D1 that
can expire. What that would protect is the text of a draft, and the text of a
draft is already public: this blog is an open-source repository, so the file
lands on GitHub the moment it is committed, and it has to be committed to be
deployed at all. A token would be a lock on a door standing on its own in a
field.

So the link is the whole mechanism. Nothing on the site links to a draft, the
sitemap and the feed do not carry it, and `robots: noindex` keeps a crawler
that finds the URL anyway from publishing it on the day it passes. Someone who
guesses the slug can read the draft; that was true of the repository first.

The URL is the published one, not a separate preview path, so the link a
reviewer was sent keeps working after the post goes live, and the page they
reviewed is the page that ships.

Issues are deliberately not included. An Issue is written to be mailed, what is
worth reviewing before a send is the email rather than the web copy of it, and
`draft: true` is what the send script refuses on — see
docs/adr/0003-issues-are-sent-by-hand.md.

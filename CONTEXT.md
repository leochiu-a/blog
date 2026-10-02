# leochiu.com

A personal blog with an email newsletter. Posts are written in Markdown and
compiled at build time; the newsletter is written separately and sent to people
who asked to receive it.

## Language

**Post**:
An article published on the blog, with its own URL.
_Avoid_: Article, entry, blog

**Issue**:
One edition of the newsletter. Written for email, and independent of any Post —
an Issue may link to several Posts, or to none. It is the part written for the
people who subscribed, so it is modelled as its own document rather than as a
Post in an envelope.
_Avoid_: Newsletter (that is the publication, not one edition), campaign,
broadcast

**Post Mailing**:
A Post sent to the Subscribers as an excerpt — its title, its opening, and a
link to the full page. It is a send of a Post, not a second kind of Issue: it
has no document of its own, and it is recorded in `post_sends` rather than
`issue_sends`. See docs/adr/0005-a-post-is-mailed-as-an-excerpt.md.
_Avoid_: Post newsletter, article email

**Subscriber**:
A person who has asked to receive Issues by email, together with the record of
that request and its current state.
_Avoid_: Contact, member, reader, audience

**Confirmation**:
The step where a Subscriber proves they own the email address they signed up
with, by acting on a link sent to it. A Subscriber only receives Issues after
Confirmation.
_Avoid_: Verification, activation, double opt-in (that names the practice, not
the step)

**Draft Link**:
The URL of a Post that has not been published. It is the Post's ordinary URL,
serving an unlisted page — no token, and no separate preview address. Sending
it is how a draft gets read before it goes live. See
docs/adr/0004-a-draft-link-is-unlisted-not-secret.md.
_Avoid_: Preview link, share link, secret link (it is none of those — see the
ADR)

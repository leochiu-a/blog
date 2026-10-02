# A Post is mailed as an excerpt, by the same hand

A Post can be sent to the list, from the same toolbar and under the same rules
as an Issue — see docs/adr/0003-issues-are-sent-by-hand.md, which this extends
rather than relaxes. The button is typed-slug armed, the route is a `.dev.ts`
one, and nothing mails a Post when it merges.

What goes out is the Post's title, its opening and a link, not the Post. A Post
is written for the site: components, demos, highlighted code. An inbox can show
none of that, and rendering what it can while silently dropping the rest would
put a worse version of the article in front of the people who asked for it. The
email is the invitation and the page is the article — which is also why the
link is the point of the message, and why the send refuses a Post whose page
does not answer on the live site yet. A published-but-undeployed Post would go
to everyone with a 404 behind its only call to action, and a send cannot be
recalled.

The excerpt carries each component that has something to show without the
site's JavaScript in a form an inbox can hold: `<Figure>` as an image, `<Clip>`
as its poster linked to the post, a YouTube `<VideoEmbed>` as its thumbnail
linked to the video, and `<LinkCard>` as a bordered card without its picture.
Dropping them left the sentence that introduced them ending on a colon over
nothing. Demos and every other component are still left out. It
stops at a block boundary after about 500 characters of text, and never leaves a
heading hanging over nothing. It reuses the Issue renderer for everything it
does keep, so the two cannot drift on what a paragraph looks like.

Sends are recorded in `post_sends`, a twin of `issue_sends` keyed by slug, so
the constraint that stops a second send is the same one. The Resend broadcast is
named `post <date> <slug>`: the prefix keeps a Post from ever answering for an
Issue's broadcast, which is how a dropped write is repaired instead of mailed
twice.

This is not a reason to mail every Post. An Issue is the thing written for
subscribers, and mailing a Post is for the occasional one worth interrupting
someone's inbox for.

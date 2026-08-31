# The subscriber list lives in D1, not in Resend

Resend's own Audiences/Segments would hold the list for us, and that is the
obvious way to build this. We keep the list in D1 instead and treat the Resend
segment as a projection of the confirmed rows, pushed at Confirmation and
reconciled before every send.

Three reasons, in order of weight. The consent record — when an address
confirmed, and from which page — is the part that matters legally and the part
Resend does not keep: its contacts carry an `unsubscribed` boolean and a created
date, no timeline and no source. Billing crosses over: Resend charges for
marketing by contact and for sending by email, so a list of 1,000 is free on the
contact model and 5,000 costs $40/month against $20 for the same volume sent as
email — the crossover is around 1,000 subscribers, and this blog expects to pass
it. And owning the list makes changing provider a change to one function rather
than a migration.

The cost is real and was accepted: between roughly 100 and 1,000 subscribers,
the contact-based free tier would have been cheaper than what we will pay, and
we write the confirmation flow, the unsubscribe endpoint and the reconciliation
ourselves.

Reconciliation is a pull, not a webhook: the send script lists contacts and
writes any Resend-side unsubscribes back to D1 before sending. At one or two
Issues a month that is often enough, and a pull is idempotent — a missed run
corrects itself next time, where a missed webhook is silent and permanent.

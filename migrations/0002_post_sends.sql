-- The record of which Posts have been mailed to the list.
--
-- The twin of `issue_sends`, and for the same reason: one row per Post, keyed by
-- slug, so a second send of the same Post fails on the key rather than on
-- anyone remembering not to press the button twice.

CREATE TABLE post_sends (
  post_slug TEXT PRIMARY KEY,
  -- Resend's own id for the send, kept for auditing what went out.
  resend_broadcast_id TEXT NOT NULL,
  recipient_count INTEGER NOT NULL,
  -- Epoch milliseconds, to match Date.now() in the Worker.
  sent_at INTEGER NOT NULL
);

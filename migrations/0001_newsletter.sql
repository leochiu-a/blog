-- The subscriber list, and the record of which Issues have gone out.
--
-- One row per address for its whole life: `pending` before Confirmation,
-- `confirmed` once the address is proven, `unsubscribed` after someone leaves,
-- `bounced` when delivery hard-failed. Rows are never deleted once past
-- `pending`, because "this address asked not to be mailed" is exactly the fact
-- that must survive a future list import or a change of email provider.

CREATE TABLE subscribers (
  email TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'bounced')),
  -- Epoch milliseconds throughout, to match Date.now() in the Worker.
  created_at INTEGER NOT NULL,
  confirmation_sent_at INTEGER,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  -- Where the request came from, e.g. the path of the page holding the form.
  -- Part of the consent record, and Resend does not keep it for us.
  source TEXT
);

-- Sending reads only confirmed addresses; pruning reads only stale pending ones.
CREATE INDEX subscribers_status_idx ON subscribers (status);

-- Confirmation emails sent per day, as a counter rather than as a count over
-- `subscribers`. The daily ceiling has to bound *emails*, and a column on the
-- subscriber only ever holds their most recent send — so counting rows would
-- let one address be mailed every cooldown all day and register as one.
CREATE TABLE confirmation_sends (
  -- Midnight UTC in epoch milliseconds.
  day INTEGER PRIMARY KEY,
  sent INTEGER NOT NULL
);

CREATE TABLE issue_sends (
  -- One row per Issue, so a second send of the same Issue fails on the key
  -- rather than on anyone remembering not to run the script twice.
  issue_slug TEXT PRIMARY KEY,
  -- Resend's own id for the send, kept for auditing what went out.
  resend_broadcast_id TEXT NOT NULL,
  recipient_count INTEGER NOT NULL,
  sent_at INTEGER NOT NULL
);

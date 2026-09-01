import {
  type ConfirmationDecision,
  type ExistingSubscriber,
  type SubscriberStatus,
  decideConfirmation,
} from "./subscription.ts";

/**
 * Every read and write of the subscriber list.
 *
 * Deliberately thin: the rules about what a request should cause live in
 * `subscription.ts` as pure functions, so they can be pinned down by tests
 * without a database standing in the way. What is left here is SQL.
 */

interface SubscriberRow {
  status: SubscriberStatus;
  confirmation_sent_at: number | null;
}

export async function findSubscriber(
  db: D1Database,
  email: string,
): Promise<ExistingSubscriber | null> {
  const row = await db
    .prepare("SELECT status, confirmation_sent_at FROM subscribers WHERE email = ?")
    .bind(email)
    .first<SubscriberRow>();

  if (!row) return null;
  return { status: row.status, confirmationSentAt: row.confirmation_sent_at };
}

/**
 * How many confirmation emails have gone out on the given day.
 *
 * Read from the counter, not from `subscribers`: that table records only each
 * address's most recent confirmation, so counting it would let one address be
 * mailed once per cooldown all day long and still register as a single send.
 */
export async function countConfirmationsOnDay(db: D1Database, day: number): Promise<number> {
  const row = await db
    .prepare("SELECT sent FROM confirmation_sends WHERE day = ?")
    .bind(day)
    .first<{ sent: number }>();

  return row?.sent ?? 0;
}

/**
 * Puts the address back into `pending` and stamps the send. Used for a new
 * address, for a stale pending one, and for someone who left and came back —
 * all three are the same write.
 */
export async function recordConfirmationSent(
  db: D1Database,
  { email, now, day, source }: { email: string; now: number; day: number; source: string | null },
): Promise<void> {
  await db.batch([
    db
      .prepare(
        `INSERT INTO subscribers (email, status, created_at, confirmation_sent_at, source)
       VALUES (?, 'pending', ?, ?, ?)
       ON CONFLICT (email) DO UPDATE SET
         status = 'pending',
         confirmation_sent_at = excluded.confirmation_sent_at`,
      )
      .bind(email, now, now, source),
    db
      .prepare(
        `INSERT INTO confirmation_sends (day, sent) VALUES (?, 1)
         ON CONFLICT (day) DO UPDATE SET sent = sent + 1`,
      )
      .bind(day),
  ]);
}

/**
 * Applies a confirmation to the list. The rule about what a link is allowed to
 * do lives in `decideConfirmation`; this only carries it out.
 */
export async function confirmSubscriber(
  db: D1Database,
  email: string,
  now: number,
): Promise<ConfirmationDecision> {
  const decision = decideConfirmation(await findSubscriber(db, email));
  if (decision !== "confirm") return decision;

  await db
    .prepare(
      `INSERT INTO subscribers (email, status, created_at, confirmed_at)
       VALUES (?, 'confirmed', ?, ?)
       ON CONFLICT (email) DO UPDATE SET status = 'confirmed', confirmed_at = excluded.confirmed_at`,
    )
    .bind(email, now, now)
    .run();

  return "confirm";
}

/**
 * Records that an address left. Writes a row even for an address that is not on
 * the list, so that "do not mail this person" survives regardless of how they
 * got the link.
 */
export async function unsubscribeSubscriber(
  db: D1Database,
  email: string,
  now: number,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO subscribers (email, status, created_at, unsubscribed_at)
       VALUES (?, 'unsubscribed', ?, ?)
       ON CONFLICT (email) DO UPDATE SET
         status = 'unsubscribed',
         unsubscribed_at = excluded.unsubscribed_at`,
    )
    .bind(email, now, now)
    .run();
}

/**
 * Drops abandoned signup attempts, so an address nobody confirmed can start
 * over and the table does not fill with them.
 *
 * Only rows that have never been anything but pending are touched. An address
 * that once confirmed or once unsubscribed keeps its row forever even while it
 * sits at `pending` again, because "this person asked not to be mailed" is the
 * one fact here that must outlive everything else, and `unsubscribed_at` is
 * where it lives.
 *
 * What the guard does not do is hold the refusal in place. `decideConfirmation`
 * reads `status`, and a fresh request has already moved that to `pending` — by
 * then they have asked again, so confirming is right. The refusal applies to a
 * row still sitting at `unsubscribed`, which this statement cannot reach
 * anyway. Both halves are pinned in `subscribers.d1.test.ts`.
 *
 * Runs on the subscribe path rather than on a schedule, because at the current
 * volume a schedule would have nothing to do between signups. That is a choice,
 * not a platform limit: the generated OpenNext worker default-exports
 * `{ fetch }`, so a custom entry can re-export it next to a `scheduled` handler
 * and hang a Cron Trigger off it — module init is billed against the separate
 * startup budget, not against the invocation's CPU.
 *
 * So the deletion has no deadline, and the privacy page is worded to match: it
 * promises the confirmation link's own expiry, which `verifyToken` guarantees
 * without any of this, and offers a manual route for deleting sooner.
 */
export async function prunePending(db: D1Database, olderThan: number): Promise<void> {
  await db
    .prepare(
      `DELETE FROM subscribers
       WHERE status = 'pending' AND confirmation_sent_at < ?
         AND confirmed_at IS NULL AND unsubscribed_at IS NULL`,
    )
    .bind(olderThan)
    .run();
}

/**
 * Everything below is used by the send script as well as by the Worker. Both
 * reach the same database through the same binding — the script gets one from
 * `getPlatformProxy()` — so there is one set of queries rather than a second
 * copy written against a command line.
 */

export async function confirmedEmails(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT email FROM subscribers WHERE status = 'confirmed' ORDER BY email")
    .all<{ email: string }>();

  return results.map((row) => row.email);
}

/** Records unsubscribes that happened at Resend rather than through our own page. */
export async function markUnsubscribedInBulk(
  db: D1Database,
  emails: string[],
  now: number,
): Promise<number> {
  if (emails.length === 0) return 0;

  const results = await db.batch(
    emails.map((email) =>
      db
        .prepare(
          `UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ?
           WHERE email = ? AND status = 'confirmed'`,
        )
        .bind(now, email),
    ),
  );

  return results.reduce((changed, result) => changed + (result.meta.changes ?? 0), 0);
}

export async function issueSentAt(db: D1Database, issueSlug: string): Promise<number | null> {
  const row = await db
    .prepare("SELECT sent_at FROM issue_sends WHERE issue_slug = ?")
    .bind(issueSlug)
    .first<{ sent_at: number }>();

  return row?.sent_at ?? null;
}

export async function recordIssueSend(
  db: D1Database,
  {
    issueSlug,
    resendBroadcastId,
    recipientCount,
    now,
  }: { issueSlug: string; resendBroadcastId: string; recipientCount: number; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO issue_sends (issue_slug, resend_broadcast_id, recipient_count, sent_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(issueSlug, resendBroadcastId, recipientCount, now)
    .run();
}

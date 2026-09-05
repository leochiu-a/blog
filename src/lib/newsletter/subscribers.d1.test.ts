import { applyD1Migrations, env, reset } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { startOfUtcDay } from "./subscription.ts";
import {
  confirmSubscriber,
  confirmedEmails,
  countConfirmationsOnDay,
  findSubscriber,
  markUnsubscribedInBulk,
  prunePending,
  recordConfirmationSent,
  subscriberCounts,
  unsubscribeSubscriber,
} from "./subscribers.ts";

/**
 * The SQL, against a real SQLite with the deployed schema.
 *
 * `subscribers.ts` is thin on purpose — the decisions live in `subscription.ts`
 * and are tested there without a database. What is left is statements whose
 * comments make claims the rest of the suite cannot check: that the daily
 * ceiling counts emails rather than addresses, and that a row which has ever
 * confirmed or ever unsubscribed survives pruning. Both are only true if the
 * SQL says so.
 */

const db = env.NEWSLETTER_DB;
const NOW = Date.UTC(2026, 7, 31, 12, 0, 0);
const DAY = startOfUtcDay(NOW);
const HOUR = 60 * 60 * 1000;
const PENDING_TTL = 24 * HOUR;

beforeEach(async () => {
  // `reset` first: `applyD1Migrations` only runs migrations that have not been
  // applied, so on its own it would hand each test the previous one's rows.
  await reset();
  await applyD1Migrations(db, env.TEST_MIGRATIONS);
});

describe("the daily confirmation ceiling", () => {
  it("counts emails, not addresses", async () => {
    // The regression the counter exists to prevent: `subscribers` holds only an
    // address's most recent send, so counting rows there would report 1 and let
    // the same inbox be mailed once per cooldown all day inside a cap of one.
    await recordConfirmationSent(db, { email: "a@example.com", now: NOW, day: DAY, source: null });
    await recordConfirmationSent(db, {
      email: "a@example.com",
      now: NOW + 20 * 60 * 1000,
      day: DAY,
      source: null,
    });

    expect(await countConfirmationsOnDay(db, DAY)).toBe(2);

    const rows = await db.prepare("SELECT COUNT(*) AS n FROM subscribers").first<{ n: number }>();
    expect(rows?.n).toBe(1);
  });

  it("keeps each day's count to itself", async () => {
    await recordConfirmationSent(db, { email: "a@example.com", now: NOW, day: DAY, source: null });

    expect(await countConfirmationsOnDay(db, DAY + 86_400_000)).toBe(0);
  });

  it("reports zero for a day nothing was sent on", async () => {
    expect(await countConfirmationsOnDay(db, DAY)).toBe(0);
  });
});

describe("pruning abandoned signups", () => {
  const stale = NOW - PENDING_TTL - HOUR;
  const olderThan = NOW - PENDING_TTL;

  it("drops a pending row that has never been anything else", async () => {
    await recordConfirmationSent(db, {
      email: "a@example.com",
      now: stale,
      day: DAY,
      source: null,
    });

    await prunePending(db, olderThan);

    expect(await findSubscriber(db, "a@example.com")).toBeNull();
  });

  it("keeps a pending row that is still inside its window", async () => {
    await recordConfirmationSent(db, { email: "a@example.com", now: NOW, day: DAY, source: null });

    await prunePending(db, olderThan);

    expect(await findSubscriber(db, "a@example.com")).not.toBeNull();
  });

  it("keeps a stale pending row belonging to an address that once confirmed", async () => {
    await recordConfirmationSent(db, {
      email: "a@example.com",
      now: stale,
      day: DAY,
      source: null,
    });
    await confirmSubscriber(db, "a@example.com", stale);
    // Back to pending: they asked again later, and that request went stale too.
    await recordConfirmationSent(db, {
      email: "a@example.com",
      now: stale,
      day: DAY,
      source: null,
    });

    await prunePending(db, olderThan);

    expect(await findSubscriber(db, "a@example.com")).toEqual({
      status: "pending",
      confirmationSentAt: stale,
    });
  });

  it("keeps the record that a stale pending address once unsubscribed", async () => {
    // The fact that must outlive everything else. They left, asked again later,
    // and abandoned that request — without the `unsubscribed_at IS NULL` guard
    // the row goes, and with it the evidence they ever asked not to be mailed.
    await unsubscribeSubscriber(db, "a@example.com", stale);
    await recordConfirmationSent(db, {
      email: "a@example.com",
      now: stale,
      day: DAY,
      source: null,
    });

    await prunePending(db, olderThan);

    const row = await db
      .prepare("SELECT status, unsubscribed_at FROM subscribers WHERE email = ?")
      .bind("a@example.com")
      .first<{ status: string; unsubscribed_at: number | null }>();
    expect(row).toEqual({ status: "pending", unsubscribed_at: stale });
  });

  it("still refuses a confirmation for an address sitting at unsubscribed", async () => {
    // Pruning cannot reach this row — its status is not `pending` — and this is
    // the state in which the refusal actually applies: an old link replayed by
    // someone who left, with no fresh request in between.
    await unsubscribeSubscriber(db, "a@example.com", stale);

    await prunePending(db, olderThan);

    expect(await confirmSubscriber(db, "a@example.com", NOW)).toBe("refused");
  });

  it("leaves confirmed and unsubscribed rows alone", async () => {
    await confirmSubscriber(db, "confirmed@example.com", stale);
    await unsubscribeSubscriber(db, "gone@example.com", stale);

    await prunePending(db, olderThan);

    expect(await findSubscriber(db, "confirmed@example.com")).not.toBeNull();
    expect(await findSubscriber(db, "gone@example.com")).not.toBeNull();
  });
});

describe("what pulling Resend's unsubscribes reports", () => {
  it("counts exactly the confirmed addresses that left", async () => {
    // The send script's `--dry-run` reports this number without performing the
    // write, by taking the difference between the confirmed list and the part
    // of it that is staying. That only holds because the UPDATE is restricted
    // to rows at `confirmed`: the two addresses below that are also gone
    // remotely must not be counted, one being pending and the other already
    // unsubscribed.
    await confirmSubscriber(db, "left@example.com", NOW);
    await confirmSubscriber(db, "staying@example.com", NOW);
    await recordConfirmationSent(db, {
      email: "pending@example.com",
      now: NOW,
      day: DAY,
      source: null,
    });
    await unsubscribeSubscriber(db, "already-gone@example.com", NOW);

    const goneRemotely = ["left@example.com", "pending@example.com", "already-gone@example.com"];
    const gone = new Set(goneRemotely);

    const confirmed = await confirmedEmails(db);
    const staying = confirmed.filter((email) => !gone.has(email));
    const predicted = confirmed.length - staying.length;

    expect(await markUnsubscribedInBulk(db, goneRemotely, NOW)).toBe(predicted);
    expect(predicted).toBe(1);
  });
});

describe("the dashboard figures", () => {
  it("reports every status, including the ones nobody is in", async () => {
    // A status with no rows is absent from a `GROUP BY`, and a dashboard that
    // dropped it would render a hole rather than a zero.
    await recordConfirmationSent(db, { email: "a@example.com", now: NOW, day: DAY, source: null });
    await recordConfirmationSent(db, { email: "b@example.com", now: NOW, day: DAY, source: null });
    await confirmSubscriber(db, "b@example.com", NOW);
    await recordConfirmationSent(db, { email: "c@example.com", now: NOW, day: DAY, source: null });
    await confirmSubscriber(db, "c@example.com", NOW);
    await unsubscribeSubscriber(db, "c@example.com", NOW);

    expect(await subscriberCounts(db)).toEqual({
      pending: 1,
      confirmed: 1,
      unsubscribed: 1,
      bounced: 0,
    });
  });

  it("is all zeroes on an empty list", async () => {
    expect(await subscriberCounts(db)).toEqual({
      pending: 0,
      confirmed: 0,
      unsubscribed: 0,
      bounced: 0,
    });
  });
});

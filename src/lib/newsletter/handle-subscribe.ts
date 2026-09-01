import { PENDING_TTL_MS } from "./constants";
import {
  type ExistingSubscriber,
  type SubscriptionLimits,
  decideSubscription,
  parseEmail,
  startOfUtcDay,
} from "./subscription";

/**
 * What a subscription request does, expressed against named ports rather than
 * against D1, Turnstile and Resend directly.
 *
 * The split exists so the property that matters most here can be tested: an
 * address already on the list must get back exactly what a brand-new address
 * gets back. Anything else turns the form into a way of asking whether a given
 * person subscribes.
 *
 * `now()` is the only clock. Every port that stamps or expires something is
 * handed the instant the decision was made, so all of it can be pinned from a
 * test — narrowing one of these back and letting the adapter reach for
 * `Date.now()` would quietly put the stamps beyond reach again.
 */
export interface SubscribeDeps {
  now(): number;
  limits: SubscriptionLimits;
  verifyChallenge(token: unknown, ip: string | null): Promise<boolean>;
  findSubscriber(email: string): Promise<ExistingSubscriber | null>;
  countConfirmationsOnDay(day: number): Promise<number>;
  prunePending(olderThan: number): Promise<void>;
  recordConfirmationSent(record: ConfirmationSent): Promise<void>;
  sendConfirmation(email: string, now: number): Promise<void>;
}

/**
 * What one confirmation email adds to the record. `day` travels with `now`
 * rather than being derived downstream because the daily ceiling is only sound
 * if the day counted against and the day incremented are the same one.
 */
export interface ConfirmationSent {
  email: string;
  now: number;
  day: number;
  source: string | null;
}

interface SubscribeBody {
  email?: unknown;
  turnstileToken?: unknown;
  source?: unknown;
}

/** The single answer every accepted request gets, whatever happened behind it. */
const ACCEPTED = { ok: true } as const;

function json(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

export async function handleSubscribe(request: Request, deps: SubscribeDeps): Promise<Response> {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return json({ error: "invalid-request" }, 400);
  }

  const email = parseEmail(body.email);
  // A malformed address is the sender's own mistake and tells them nothing
  // about anybody else, so this one is safe to report plainly.
  if (!email) return json({ error: "invalid-email" }, 400);

  const ip = request.headers.get("cf-connecting-ip");
  if (!(await deps.verifyChallenge(body.turnstileToken, ip))) {
    return json({ error: "challenge-failed" }, 400);
  }

  const now = deps.now();
  const day = startOfUtcDay(now);

  // Cheap and indexed, and at the current volume it is the only thing that ever
  // needs to run: between signups there is nothing to prune. See `prunePending`
  // for what a scheduled version would take.
  await deps.prunePending(now - PENDING_TTL_MS);

  const [existing, confirmationsSentToday] = await Promise.all([
    deps.findSubscriber(email),
    deps.countConfirmationsOnDay(day),
  ]);

  const decision = decideSubscription({
    existing,
    now,
    confirmationsSentToday,
    limits: deps.limits,
  });
  if (decision.type !== "send-confirmation") return json(ACCEPTED, 200);

  const source = typeof body.source === "string" ? body.source.slice(0, 200) : null;

  // Stamped and counted before the send, never after, and never rolled back if
  // the send fails. A crash in between has to leave the address on cooldown and
  // the day's allowance spent — giving either back would hand an attacker a way
  // to make sends fail deliberately and walk past both limits.
  await deps.recordConfirmationSent({ email, now, day, source });
  await deps.sendConfirmation(email, now);

  return json(ACCEPTED, 200);
}

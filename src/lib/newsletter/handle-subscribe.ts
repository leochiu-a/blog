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
 */
export interface SubscribeDeps {
  now(): number;
  limits: SubscriptionLimits;
  verifyChallenge(token: unknown, ip: string | null): Promise<boolean>;
  findSubscriber(email: string): Promise<ExistingSubscriber | null>;
  countConfirmationsOnDay(day: number): Promise<number>;
  prunePending(olderThan: number): Promise<void>;
  recordConfirmationSent(email: string, day: number, source: string | null): Promise<void>;
  sendConfirmation(email: string): Promise<void>;
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

  // Cheap, indexed, and it keeps abandoned attempts from accumulating without
  // needing a scheduled job the OpenNext worker has no way to run.
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
  await deps.recordConfirmationSent(email, day, source);
  await deps.sendConfirmation(email);

  return json(ACCEPTED, 200);
}

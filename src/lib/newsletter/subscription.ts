/**
 * The rules for what a subscription request should cause — kept as a pure
 * decision so the interesting cases can be pinned down without a database.
 *
 * The rules exist for two reasons that pull in the same direction. A repeat
 * request must be cheap, because the form is a weapon otherwise: anyone can
 * point it at a third party's inbox and have us mail them over and over. And a
 * request for an address we already hold must be indistinguishable from a
 * request for a new one, or the form becomes a way to ask whether a given
 * person subscribes.
 */

export type SubscriberStatus = "pending" | "confirmed" | "unsubscribed" | "bounced";

export interface ExistingSubscriber {
  status: SubscriberStatus;
  /** Epoch milliseconds of the last confirmation email, if one was ever sent. */
  confirmationSentAt: number | null;
}

export interface SubscriptionLimits {
  /** How long after a confirmation email before another may be sent. */
  cooldownMs: number;
  /** Ceiling on confirmation emails per day, across all addresses. */
  dailyCap: number;
}

export interface SubscriptionRequest {
  existing: ExistingSubscriber | null;
  now: number;
  confirmationsSentToday: number;
  limits: SubscriptionLimits;
}

export type SubscriptionDecision =
  /** Write the address as pending and send it a confirmation email. */
  | { type: "send-confirmation" }
  /** Change nothing, send nothing, and tell the caller it went fine. */
  | { type: "silently-accept" }
  /** Today's ceiling is reached. Same outward answer, but worth logging. */
  | { type: "capped" };

export function decideSubscription({
  existing,
  now,
  confirmationsSentToday,
  limits,
}: SubscriptionRequest): SubscriptionDecision {
  // Already a subscriber. Saying so would answer a question the sender has no
  // right to ask, so the answer is the same as for a fresh address.
  if (existing?.status === "confirmed") return { type: "silently-accept" };

  // The cooldown comes first so that hammering one address can never move the
  // daily counter, and so a repeat inside the window is reported as the
  // ordinary no-op it is rather than as the cap being hit.
  const lastSent = existing?.confirmationSentAt;
  if (lastSent !== null && lastSent !== undefined && now - lastSent < limits.cooldownMs) {
    return { type: "silently-accept" };
  }

  if (confirmationsSentToday >= limits.dailyCap) return { type: "capped" };

  return { type: "send-confirmation" };
}

export type ConfirmationDecision = "confirm" | "already-confirmed" | "refused";

/**
 * What a valid confirmation link should do to the address it names.
 *
 * A signed link proves the address is theirs, which is why an address we have
 * no row for is still confirmed — the row may simply have been pruned. It is
 * not proof of a fresh request to be mailed, though, so an address that
 * unsubscribed stays off: a link that predates someone leaving must never be
 * able to undo it.
 */
export function decideConfirmation(existing: ExistingSubscriber | null): ConfirmationDecision {
  if (existing?.status === "confirmed") return "already-confirmed";
  if (existing?.status === "unsubscribed") return "refused";
  return "confirm";
}

/**
 * Normalises an address, or rejects it.
 *
 * Case-folding matters beyond tidiness: the list is keyed by address, so
 * `Reader@Example.com` and `reader@example.com` have to collapse to one row or
 * the cooldown and the "already confirmed" check can both be walked around by
 * changing capitalisation.
 */
export function parseEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  // 254 is the longest address SMTP has to carry.
  if (email.length === 0 || email.length > 254) return null;
  if (!/^[^\s@,;:<>"()[\]\\]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) return null;
  return email;
}

/** Midnight UTC — the boundary Cloudflare and Resend both reset daily quotas on. */
export function startOfUtcDay(now: number): number {
  return Math.floor(now / 86_400_000) * 86_400_000;
}

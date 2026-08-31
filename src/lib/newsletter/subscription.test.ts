import { describe, expect, it } from "vitest";
import {
  type ExistingSubscriber,
  decideConfirmation,
  decideSubscription,
  parseEmail,
} from "./subscription";

const NOW = Date.UTC(2026, 7, 31, 12, 0, 0);
const MINUTE = 60 * 1000;
const LIMITS = { cooldownMs: 15 * MINUTE, dailyCap: 200 };

function decide(existing: ExistingSubscriber | null, confirmationsSentToday = 0, now = NOW) {
  return decideSubscription({ existing, now, confirmationsSentToday, limits: LIMITS });
}

describe("deciding what to do with a subscription request", () => {
  it("sends a confirmation to an address it has never seen", () => {
    expect(decide(null).type).toBe("send-confirmation");
  });

  it("stays silent when the same address asks again inside the cooldown", () => {
    const existing = { status: "pending", confirmationSentAt: NOW - MINUTE } as const;

    expect(decide(existing).type).toBe("silently-accept");
  });

  it("sends another confirmation once the cooldown has passed", () => {
    const existing = { status: "pending", confirmationSentAt: NOW - 30 * MINUTE } as const;

    expect(decide(existing).type).toBe("send-confirmation");
  });

  it("stays silent for an address that has already confirmed", () => {
    const existing = { status: "confirmed", confirmationSentAt: NOW - 30 * MINUTE } as const;

    expect(decide(existing).type).toBe("silently-accept");
  });

  it("lets an unsubscribed address subscribe again", () => {
    const existing = { status: "unsubscribed", confirmationSentAt: NOW - 30 * MINUTE } as const;

    expect(decide(existing).type).toBe("send-confirmation");
  });

  it("lets an address that previously bounced subscribe again", () => {
    const existing = { status: "bounced", confirmationSentAt: NOW - 30 * MINUTE } as const;

    expect(decide(existing).type).toBe("send-confirmation");
  });

  it("stops sending once the daily confirmation cap is reached", () => {
    expect(decide(null, LIMITS.dailyCap).type).toBe("capped");
  });

  it("treats a repeat inside the cooldown as silent rather than capped", () => {
    const existing = { status: "pending", confirmationSentAt: NOW - MINUTE } as const;

    expect(decide(existing, LIMITS.dailyCap).type).toBe("silently-accept");
  });
});

describe("reading an address off the form", () => {
  it("folds case and trims, so one person cannot become two rows", () => {
    expect(parseEmail("  Reader@Example.COM ")).toBe("reader@example.com");
  });

  it("rejects anything that is not an address", () => {
    expect(parseEmail("reader")).toBeNull();
    expect(parseEmail("reader@localhost")).toBeNull();
    expect(parseEmail("two@addresses.com,other@example.com")).toBeNull();
    expect(parseEmail("")).toBeNull();
    expect(parseEmail(undefined)).toBeNull();
    expect(parseEmail(`${"a".repeat(250)}@example.com`)).toBeNull();
  });
});

describe("deciding what a confirmation link should do", () => {
  it("confirms an address that is waiting to be confirmed", () => {
    expect(decideConfirmation({ status: "pending", confirmationSentAt: NOW })).toBe("confirm");
  });

  it("confirms an address it has no record of, since the link itself is the proof", () => {
    expect(decideConfirmation(null)).toBe("confirm");
  });

  it("says nothing new happened when the address already confirmed", () => {
    expect(decideConfirmation({ status: "confirmed", confirmationSentAt: NOW })).toBe(
      "already-confirmed",
    );
  });

  it("refuses to put back an address that unsubscribed, however valid the link", () => {
    expect(decideConfirmation({ status: "unsubscribed", confirmationSentAt: NOW })).toBe("refused");
  });

  it("confirms an address that previously bounced", () => {
    expect(decideConfirmation({ status: "bounced", confirmationSentAt: NOW })).toBe("confirm");
  });
});

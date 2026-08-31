import { describe, expect, it } from "vitest";
import { type SubscribeDeps, handleSubscribe } from "./handle-subscribe";
import type { ExistingSubscriber } from "./subscription";

const NOW = Date.UTC(2026, 7, 31, 12, 0, 0);

function request(email: string) {
  return new Request("https://leochiu.com/api/newsletter/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, turnstileToken: "passing-token", source: "/blog/x/" }),
  });
}

function deps(existing: ExistingSubscriber | null) {
  const sent: string[] = [];
  const dependencies: SubscribeDeps = {
    now: () => NOW,
    limits: { cooldownMs: 15 * 60 * 1000, dailyCap: 200 },
    verifyChallenge: async () => true,
    findSubscriber: async () => existing,
    countConfirmationsOnDay: async () => 0,
    prunePending: async () => {},
    recordConfirmationSent: async () => {},
    sendConfirmation: async (email) => {
      sent.push(email);
    },
  };
  return { dependencies, sent };
}

describe("subscribing through the endpoint", () => {
  it("answers an address already on the list exactly as it answers a new one", async () => {
    const fresh = deps(null);
    const known = deps({ status: "confirmed", confirmationSentAt: NOW - 60 * 60 * 1000 });

    const freshResponse = await handleSubscribe(request("new@example.com"), fresh.dependencies);
    const knownResponse = await handleSubscribe(request("known@example.com"), known.dependencies);

    expect(knownResponse.status).toBe(freshResponse.status);
    expect(await knownResponse.text()).toBe(await freshResponse.text());
  });

  it("sends nothing to an address that has already confirmed", async () => {
    const known = deps({ status: "confirmed", confirmationSentAt: null });

    await handleSubscribe(request("known@example.com"), known.dependencies);

    expect(known.sent).toEqual([]);
  });

  it("sends a confirmation to an address it has never seen", async () => {
    const fresh = deps(null);

    await handleSubscribe(request("new@example.com"), fresh.dependencies);

    expect(fresh.sent).toEqual(["new@example.com"]);
  });

  it("rejects a request that fails the challenge", async () => {
    const fresh = deps(null);

    const response = await handleSubscribe(request("new@example.com"), {
      ...fresh.dependencies,
      verifyChallenge: async () => false,
    });

    expect(response.status).toBe(400);
    expect(fresh.sent).toEqual([]);
  });

  it("rejects an address that is not an address, without touching the list", async () => {
    const fresh = deps(null);

    const response = await handleSubscribe(request("nope"), fresh.dependencies);

    expect(response.status).toBe(400);
    expect(fresh.sent).toEqual([]);
  });
});

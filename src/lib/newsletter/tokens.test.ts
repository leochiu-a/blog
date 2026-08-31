import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "./tokens";

const SECRET = "test-secret-not-the-real-one";
const NOW = Date.UTC(2026, 7, 31, 12, 0, 0);
const HOUR = 60 * 60 * 1000;

describe("newsletter tokens", () => {
  it("gives back the email a confirmation token was made for", async () => {
    const token = await signToken(
      { email: "reader@example.com", purpose: "confirm", expiresAt: NOW + HOUR },
      SECRET,
    );

    const payload = await verifyToken(token, SECRET, { purpose: "confirm", now: NOW });

    expect(payload?.email).toBe("reader@example.com");
  });

  it("refuses a token whose payload has been edited", async () => {
    const token = await signToken(
      { email: "reader@example.com", purpose: "confirm", expiresAt: NOW + HOUR },
      SECRET,
    );
    const [, signature] = token.split(".");
    const forged = `${btoa('{"email":"attacker@example.com","purpose":"confirm"}')}.${signature}`;

    expect(await verifyToken(forged, SECRET, { purpose: "confirm", now: NOW })).toBeNull();
  });

  it("refuses a confirmation token once it has expired", async () => {
    const token = await signToken(
      { email: "reader@example.com", purpose: "confirm", expiresAt: NOW + HOUR },
      SECRET,
    );

    expect(
      await verifyToken(token, SECRET, { purpose: "confirm", now: NOW + 2 * HOUR }),
    ).toBeNull();
  });

  it("refuses a confirmation token presented to the unsubscribe flow", async () => {
    const token = await signToken(
      { email: "reader@example.com", purpose: "confirm", expiresAt: NOW + HOUR },
      SECRET,
    );

    expect(await verifyToken(token, SECRET, { purpose: "unsubscribe", now: NOW })).toBeNull();
  });

  it("keeps an unsubscribe token valid indefinitely", async () => {
    const token = await signToken({ email: "reader@example.com", purpose: "unsubscribe" }, SECRET);

    const payload = await verifyToken(token, SECRET, {
      purpose: "unsubscribe",
      now: NOW + 10_000 * HOUR,
    });

    expect(payload?.email).toBe("reader@example.com");
  });

  it("refuses a token signed with a different secret", async () => {
    const token = await signToken({ email: "reader@example.com", purpose: "unsubscribe" }, SECRET);

    expect(
      await verifyToken(token, "some-other-secret", { purpose: "unsubscribe", now: NOW }),
    ).toBeNull();
  });

  it("refuses a token that is not a token at all", async () => {
    expect(await verifyToken("garbage", SECRET, { purpose: "confirm", now: NOW })).toBeNull();
    expect(await verifyToken("", SECRET, { purpose: "confirm", now: NOW })).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

/** One siteverify answer, shaped the way Cloudflare shapes them. */
function siteverify(body: Record<string, unknown>) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
}

function verify(overrides: { token?: unknown } = {}) {
  return verifyTurnstile({ token: "a-token", secret: "a-secret", ip: null, ...overrides });
}

const REAL_PASS = { success: true, action: "subscribe", hostname: "leochiu.com" };
const TESTING_KEY_PASS = {
  success: true,
  hostname: "example.com",
  metadata: { result_with_testing_key: true },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("verifying a Turnstile token", () => {
  it("accepts a token that passed for this action on a hostname we serve", async () => {
    vi.stubGlobal("fetch", siteverify(REAL_PASS));

    expect(await verify()).toBe(true);
  });

  it("rejects a challenge that did not pass", async () => {
    vi.stubGlobal("fetch", siteverify({ ...REAL_PASS, success: false }));

    expect(await verify()).toBe(false);
  });

  it("rejects a token minted for a different action", async () => {
    vi.stubGlobal("fetch", siteverify({ ...REAL_PASS, action: "login" }));

    expect(await verify()).toBe(false);
  });

  it("rejects a token solved on a hostname we do not serve", async () => {
    vi.stubGlobal("fetch", siteverify({ ...REAL_PASS, hostname: "evil.example" }));

    expect(await verify()).toBe(false);
  });

  it("never calls siteverify for a token that cannot be one", async () => {
    const fetchMock = siteverify(REAL_PASS);
    vi.stubGlobal("fetch", fetchMock);

    expect(await verify({ token: "" })).toBe(false);
    expect(await verify({ token: "x".repeat(2049) })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a siteverify it cannot reach as a challenge that did not pass", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    expect(await verify()).toBe(false);
  });
});

/**
 * The testing-key exemption is the one place the action and hostname checks are
 * skipped, so what matters is that it stays confined to a development build and
 * to responses Cloudflare has flagged itself.
 */
describe("the testing-key exemption", () => {
  it("accepts a testing-key answer in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubGlobal("fetch", siteverify(TESTING_KEY_PASS));

    expect(await verify()).toBe(true);
  });

  it("rejects the same answer in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("fetch", siteverify(TESTING_KEY_PASS));

    expect(await verify()).toBe(false);
  });

  it("still checks action and hostname in development when the flag is absent", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubGlobal("fetch", siteverify({ success: true, hostname: "example.com" }));

    expect(await verify()).toBe(false);
  });

  it("does not take an unflagged answer's word for it, even in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubGlobal("fetch", siteverify({ ...REAL_PASS, hostname: "evil.example", metadata: {} }));

    expect(await verify()).toBe(false);
  });
});

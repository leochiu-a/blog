import { SITE_URL } from "@/lib/site";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Tags the token with the surface it was solved on, and is checked below. */
export const SUBSCRIBE_ACTION = "subscribe";

interface SiteverifyResult {
  success?: boolean;
  action?: string;
  hostname?: string;
  /** Set by siteverify only when the secret was one of Cloudflare's testing keys. */
  metadata?: { result_with_testing_key?: boolean };
}

/**
 * Hostnames a token is allowed to have been solved on.
 *
 * A widget is already bound to its domains, so this is defence in depth: it
 * means a token minted somewhere unexpected — a staging copy, a page someone
 * else put the sitekey on — cannot be spent here.
 */
function allowedHostnames(): Set<string> {
  const hostnames = new Set([new URL(SITE_URL).hostname]);
  if (process.env.NODE_ENV === "development") {
    hostnames.add("localhost");
    hostnames.add("127.0.0.1");
  }
  return hostnames;
}

/**
 * The first line against automated signups. A failure is rejected before the
 * request reaches the database or sends anything, so a flood costs nothing
 * beyond one outbound call.
 *
 * Three things have to hold, not one: the challenge passed, it was solved for
 * this surface, and it was solved on a hostname we serve. Checking only
 * `success` would accept a token minted anywhere the sitekey appears, and spent
 * against any endpoint.
 */
export async function verifyTurnstile({
  token,
  secret,
  ip,
  action = SUBSCRIBE_ACTION,
}: {
  token: unknown;
  secret: string;
  ip: string | null;
  action?: string;
}): Promise<boolean> {
  // 2048 is well past a real token, and caps what a flood can post at us.
  if (typeof token !== "string" || token === "" || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.append("remoteip", ip);

  let result: SiteverifyResult;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      // Siteverify sits in front of every signup; without a bound it could hold
      // a request open indefinitely.
      signal: AbortSignal.timeout(10_000),
      body,
    });
    if (!response.ok) return false;
    result = (await response.json()) as SiteverifyResult;
  } catch {
    // A challenge we cannot check is a challenge that did not pass.
    return false;
  }

  if (result.success !== true) return false;

  // Cloudflare's testing keys answer with no `action` and a fixed `example.com`
  // hostname, so the two checks below can never pass for them and local work
  // would have no way to exercise this path at all. The exemption is kept as
  // narrow as the problem: it needs a development build *and* a response
  // Cloudflare has itself flagged as produced by a testing key. A production
  // siteverify never sets that flag, so neither check is weakened where it
  // counts.
  if (process.env.NODE_ENV === "development" && result.metadata?.result_with_testing_key === true) {
    return true;
  }

  if (result.action !== action) return false;
  return result.hostname !== undefined && allowedHostnames().has(result.hostname);
}

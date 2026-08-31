import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SITE_URL } from "@/lib/site";
import { CONFIRMATION_TTL_MS } from "./constants";
import { signToken } from "./tokens";

/**
 * The bindings and secrets the newsletter routes need, fetched and checked in
 * one place so a missing secret fails as a clear error rather than as a
 * confusing `undefined` deep inside a request.
 */
export interface NewsletterRuntime {
  db: D1Database;
  tokenSecret: string;
  resendApiKey: string;
  resendSegmentId: string;
  turnstileSecret: string;
}

export async function newsletterRuntime(): Promise<NewsletterRuntime> {
  const { env } = await getCloudflareContext({ async: true });

  const missing = (
    [
      "NEWSLETTER_DB",
      "NEWSLETTER_TOKEN_SECRET",
      "RESEND_API_KEY",
      "RESEND_SEGMENT_ID",
      "TURNSTILE_SECRET_KEY",
    ] as const
  ).filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Newsletter is not configured: missing ${missing.join(", ")}`);
  }

  return {
    db: env.NEWSLETTER_DB,
    tokenSecret: env.NEWSLETTER_TOKEN_SECRET,
    resendApiKey: env.RESEND_API_KEY,
    resendSegmentId: env.RESEND_SEGMENT_ID,
    turnstileSecret: env.TURNSTILE_SECRET_KEY,
  };
}

export async function confirmationUrl(email: string, secret: string, now: number) {
  const token = await signToken(
    { email, purpose: "confirm", expiresAt: now + CONFIRMATION_TTL_MS },
    secret,
  );
  return `${SITE_URL}/newsletter/confirm/?token=${encodeURIComponent(token)}`;
}

export async function unsubscribeUrl(email: string, secret: string) {
  const token = await signToken({ email, purpose: "unsubscribe" }, secret);
  return `${SITE_URL}/newsletter/unsubscribe/?token=${encodeURIComponent(token)}`;
}

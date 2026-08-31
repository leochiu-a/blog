/**
 * Runtime bindings and secrets.
 *
 * `wrangler types` describes what is declared in `wrangler.jsonc`; secrets are
 * set with `wrangler secret put` and never appear in that file, so they are
 * declared here by hand. `getCloudflareContext().env` is typed by this
 * interface.
 */
declare global {
  interface CloudflareEnv {
    NEWSLETTER_DB: D1Database;
    /** HMAC key behind every confirmation and unsubscribe link. */
    NEWSLETTER_TOKEN_SECRET: string;
    RESEND_API_KEY: string;
    /** The Resend Segment holding the confirmed addresses. */
    RESEND_SEGMENT_ID: string;
    TURNSTILE_SECRET_KEY: string;
  }
}

export {};

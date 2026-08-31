/** Where Issues are sent from, and where a reply should land. */
export const FROM_ADDRESS = "Leo Chiu <hello@news.leochiu.com>";

/**
 * `news.leochiu.com` has no inbox, so replies are pointed at the apex domain,
 * which forwards through Cloudflare Email Routing. A newsletter nobody can
 * reply to is both rude and a negative signal to Gmail.
 */
export const REPLY_TO_ADDRESS = "hi@leochiu.com";

/** How long a confirmation link stays usable. */
export const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * How long after a confirmation email before the same address can trigger
 * another. This is what stops the form being used to mail a third party
 * repeatedly.
 */
export const CONFIRMATION_COOLDOWN_MS = 15 * 60 * 1000;

/**
 * Ceiling on confirmation emails per day across all addresses. The other
 * defences are probabilistic; this one is a hard stop, and what it protects —
 * the sending domain's reputation — is the only thing here that takes months to
 * repair.
 */
export const CONFIRMATION_DAILY_CAP = 200;

/** Pending rows older than this are dropped; the address can start over. */
export const PENDING_TTL_MS = CONFIRMATION_TTL_MS;

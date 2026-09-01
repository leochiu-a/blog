import { createContact } from "@/lib/newsletter/resend";
import { newsletterRuntime } from "@/lib/newsletter/runtime";
import { confirmSubscriber } from "@/lib/newsletter/subscribers";
import { verifyToken } from "@/lib/newsletter/tokens";

/**
 * Completes a subscription.
 *
 * POST rather than GET on purpose: Gmail and Outlook prefetch links in a
 * message to scan them, which would confirm subscriptions nobody ever clicked
 * and leave the consent record a fiction. The link in the email opens a page
 * with a button, and the button posts here.
 */
export async function POST(request: Request): Promise<Response> {
  const runtime = await newsletterRuntime();

  const { token } = (await request.json().catch(() => ({}))) as { token?: unknown };
  if (typeof token !== "string") return Response.json({ error: "invalid-token" }, { status: 400 });

  const payload = await verifyToken(token, runtime.tokenSecret, {
    purpose: "confirm",
    now: Date.now(),
  });
  if (!payload) return Response.json({ error: "invalid-token" }, { status: 400 });

  const outcome = await confirmSubscriber(runtime.db, payload.email, Date.now());
  if (outcome === "refused") {
    // The address left the list. A still-valid link from before that must not
    // quietly put them back on it.
    return Response.json({ status: "unsubscribed" }, { status: 409 });
  }

  if (outcome === "confirm") {
    // The address is confirmed either way; failing to project it into Resend
    // only delays delivery until the next send, which reconciles both stores.
    try {
      await createContact(runtime.resendApiKey, {
        email: payload.email,
        segmentId: runtime.resendSegmentId,
      });
    } catch (error) {
      console.error("newsletter: could not add contact to Resend", error);
    }
  }

  return Response.json({ status: "confirmed" });
}

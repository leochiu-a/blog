import { updateContactUnsubscribed } from "@/lib/newsletter/resend";
import { newsletterRuntime } from "@/lib/newsletter/runtime";
import { unsubscribeSubscriber } from "@/lib/newsletter/subscribers";
import { verifyToken } from "@/lib/newsletter/tokens";

/**
 * Takes an address off the list.
 *
 * The token may arrive in the body (the page's button) or in the query string
 * (a mail client acting on the `List-Unsubscribe` header, which posts to the
 * URL as-is). Both are the same operation, and both are accepted without any
 * kind of sign-in — an unsubscribe link that asks a subscriber to log in is an
 * unsubscribe link that does not work.
 */
export async function POST(request: Request): Promise<Response> {
  const runtime = await newsletterRuntime();

  const fromQuery = new URL(request.url).searchParams.get("token");
  const { token: fromBody } = (await request.json().catch(() => ({}))) as { token?: unknown };
  const token = typeof fromBody === "string" ? fromBody : fromQuery;
  if (typeof token !== "string") return Response.json({ error: "invalid-token" }, { status: 400 });

  const payload = await verifyToken(token, runtime.tokenSecret, {
    purpose: "unsubscribe",
    now: Date.now(),
  });
  if (!payload) return Response.json({ error: "invalid-token" }, { status: 400 });

  await unsubscribeSubscriber(runtime.db, payload.email, Date.now());

  // D1 is the record that matters; Resend is told so the current segment stops
  // including them before the next reconciliation runs.
  try {
    await updateContactUnsubscribed(runtime.resendApiKey, {
      email: payload.email,
      unsubscribed: true,
    });
  } catch (error) {
    console.error("newsletter: could not mark contact unsubscribed in Resend", error);
  }

  return Response.json({ status: "unsubscribed" });
}

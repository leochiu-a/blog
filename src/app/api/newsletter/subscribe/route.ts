import { CONFIRMATION_COOLDOWN_MS, CONFIRMATION_DAILY_CAP } from "@/lib/newsletter/constants";
import { FROM_ADDRESS, REPLY_TO_ADDRESS } from "@/lib/newsletter/constants";
import { handleSubscribe } from "@/lib/newsletter/handle-subscribe";
import { sendEmail } from "@/lib/newsletter/resend";
import { confirmationUrl, newsletterRuntime } from "@/lib/newsletter/runtime";
import {
  countConfirmationsOnDay,
  findSubscriber,
  prunePending,
  recordConfirmationSent,
} from "@/lib/newsletter/subscribers";
import { confirmationEmail } from "@/lib/newsletter/templates";
import { verifyTurnstile } from "@/lib/newsletter/turnstile";

/**
 * Wiring only. What the endpoint actually does — including answering a known
 * address the same way as a new one — lives in `handleSubscribe`, where it can
 * be tested.
 */
export async function POST(request: Request): Promise<Response> {
  const runtime = await newsletterRuntime();

  return handleSubscribe(request, {
    now: () => Date.now(),
    limits: { cooldownMs: CONFIRMATION_COOLDOWN_MS, dailyCap: CONFIRMATION_DAILY_CAP },
    verifyChallenge: (token, ip) => verifyTurnstile({ token, secret: runtime.turnstileSecret, ip }),
    findSubscriber: (email) => findSubscriber(runtime.db, email),
    countConfirmationsOnDay: (day) => countConfirmationsOnDay(runtime.db, day),
    prunePending: (olderThan) => prunePending(runtime.db, olderThan),
    recordConfirmationSent: (email, day, source) =>
      recordConfirmationSent(runtime.db, { email, now: Date.now(), day, source }),
    sendConfirmation: async (email) => {
      const url = await confirmationUrl(email, runtime.tokenSecret, Date.now());
      const { subject, html, text } = confirmationEmail({ confirmUrl: url });
      await sendEmail(runtime.resendApiKey, {
        from: FROM_ADDRESS,
        to: email,
        subject,
        html,
        text,
        replyTo: REPLY_TO_ADDRESS,
      });
    },
  });
}

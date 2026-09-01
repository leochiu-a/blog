import { Resend } from "resend";
import type { ErrorResponse } from "resend";

/**
 * Everything this app asks of Resend, named in our own vocabulary.
 *
 * A thin layer over the official SDK rather than raw calls to it, for two
 * reasons. Resend's nouns are not ours — it has contacts and segments, we have
 * Subscribers and a list — and letting its words spread into the routes and the
 * send script would blur a boundary CONTEXT.md draws deliberately. And the SDK
 * reports failure by returning `{ data, error }` instead of throwing, which is
 * easy to forget at a call site; every function here throws on error so a
 * mistake is loud.
 *
 * Resend is the sending pipe and, for now, what fans an Issue out to every
 * address. It is not where the list lives: contacts here are a projection of
 * the confirmed rows in D1, which stays authoritative. See
 * docs/adr/0001-newsletter-subscriber-list-lives-in-d1.md.
 */

export class ResendError extends Error {
  /**
   * Spelled out rather than written as a constructor parameter property: those
   * emit code instead of erasing, which is the one thing Node's type stripping
   * cannot do — and this file has to load under plain `node`, in the send
   * script.
   */
  readonly response: ErrorResponse;

  constructor(response: ErrorResponse) {
    super(`Resend refused the request: ${response.name} — ${response.message}`);
    this.name = "ResendError";
    this.response = response;
  }
}

/** Unwraps the SDK's `{ data, error }` into a value, or throws. */
function unwrap<T>({ data, error }: { data: T | null; error: ErrorResponse | null }): T {
  if (error) throw new ResendError(error);
  if (data === null) throw new Error("Resend returned neither data nor an error");
  return data;
}

const client = (apiKey: string) => new Resend(apiKey);

export interface OutgoingEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(apiKey: string, email: OutgoingEmail): Promise<{ id: string }> {
  return unwrap(await client(apiKey).emails.send(email));
}

/** Adds a confirmed address to the segment Issues are sent to. */
export async function createContact(
  apiKey: string,
  { email, segmentId }: { email: string; segmentId: string },
): Promise<{ id: string }> {
  return unwrap(
    await client(apiKey).contacts.create({
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    }),
  );
}

export async function updateContactUnsubscribed(
  apiKey: string,
  { email, unsubscribed }: { email: string; unsubscribed: boolean },
): Promise<{ id: string }> {
  return unwrap(await client(apiKey).contacts.update({ email, unsubscribed }));
}

export interface RemoteContact {
  email: string;
  unsubscribed: boolean;
}

/**
 * Every contact in the segment, following the cursor to the end.
 *
 * The pages matter: reconciliation compares this against D1, so stopping at the
 * first page would look exactly like everyone past it having unsubscribed.
 */
export async function listContacts(apiKey: string, segmentId: string): Promise<RemoteContact[]> {
  const resend = client(apiKey);
  const contacts: RemoteContact[] = [];
  let after: string | undefined;

  for (;;) {
    const page = unwrap(await resend.contacts.list({ segmentId, limit: 100, after }));
    contacts.push(...page.data.map(({ email, unsubscribed }) => ({ email, unsubscribed })));

    const last = page.data.at(-1);
    if (!page.has_more || !last) return contacts;
    after = last.id;
  }
}

export async function createBroadcast(
  apiKey: string,
  broadcast: {
    segmentId: string;
    from: string;
    replyTo: string;
    subject: string;
    html: string;
    text: string;
    name: string;
  },
): Promise<{ id: string }> {
  return unwrap(await client(apiKey).broadcasts.create(broadcast));
}

export async function sendBroadcast(apiKey: string, broadcastId: string): Promise<{ id: string }> {
  return unwrap(await client(apiKey).broadcasts.send(broadcastId));
}

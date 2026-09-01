/**
 * Signed, stateless links for the two things a subscriber does by email:
 * confirming a subscription and leaving one.
 *
 * Nothing is stored server-side — the link carries its own payload and an HMAC
 * over it, so a confirmation link works without a row to look up and an
 * unsubscribe link keeps working years later. `purpose` is inside the signed
 * payload, which is what stops a confirmation link from being replayed against
 * the unsubscribe endpoint (or the reverse).
 */

export type TokenPurpose = "confirm" | "unsubscribe";

export interface TokenPayload {
  email: string;
  purpose: TokenPurpose;
  /**
   * Epoch milliseconds. Confirmation links expire; unsubscribe links must not,
   * so they are signed without one.
   */
  expiresAt?: number;
}

interface VerifyOptions {
  purpose: TokenPurpose;
  now: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signToken(payload: TokenPayload, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Returns the payload the token was signed with, or `null` for anything that
 * fails — bad shape, bad signature, wrong purpose, expired. Callers get one
 * answer to act on and no detail to leak back to whoever sent the token.
 */
export async function verifyToken(
  token: string,
  secret: string,
  { purpose, now }: VerifyOptions,
): Promise<TokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return null;

  // `subtle.verify` compares in constant time, so an attacker learns nothing
  // from how long a rejection took.
  const signed = await crypto.subtle.verify(
    "HMAC",
    await importKey(secret),
    signatureBytes,
    encoder.encode(body),
  );
  if (!signed) return null;

  const bodyBytes = fromBase64Url(body);
  if (!bodyBytes) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoder.decode(bodyBytes));
  } catch {
    return null;
  }

  const payload = parsed as Partial<TokenPayload>;
  if (typeof payload?.email !== "string" || payload.email === "") return null;
  if (payload.purpose !== purpose) return null;
  if (payload.expiresAt !== undefined) {
    if (typeof payload.expiresAt !== "number" || now > payload.expiresAt) return null;
  }

  return { email: payload.email, purpose, expiresAt: payload.expiresAt };
}

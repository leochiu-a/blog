"use client";

import Link from "next/link";
import Script from "next/script";
import { useState } from "react";

type State = "idle" | "sending" | "sent" | "error";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * The subscribe form, shaped after the one at the foot of a Substack post.
 *
 * The borrowed detail is that it is one control, not two: the field has no
 * frame of its own, the frame belongs to the pair, and the button is flush
 * inside its right edge. Deliberately small — 400px, one row, no heading and no
 * fine print, because everything added here is something a reader has to read
 * before typing an address.
 *
 * Plain elements rather than the shadcn `Input`/`Button`: both bring their own
 * border and radius, and this composition is defined by sharing one.
 *
 * The success message is deliberately the same for an address that is already
 * on the list as for a new one — the endpoint answers both identically, and
 * saying "you already subscribe" here would give that away again.
 */
export function SubscribeForm({ source }: { source?: string }) {
  const [state, setState] = useState<State>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");

    try {
      const response = await fetch("/api/newsletter/subscribe/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          // Turnstile writes this hidden field into the surrounding form.
          turnstileToken: data.get("cf-turnstile-response"),
          source: source ?? window.location.pathname,
        }),
      });
      setState(response.ok ? "sent" : "error");
      if (response.ok) form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="font-sans text-base leading-relaxed text-muted-foreground">
        信寄出去了。去信箱點一下確認連結就完成訂閱 —— 連結 24 小時內有效。
      </p>
    );
  }

  return (
    <>
      {TURNSTILE_SITE_KEY && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      )}
      <form onSubmit={onSubmit} className="flex w-full max-w-[25rem] flex-col gap-2">
        <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-border bg-card focus-within:border-gold">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Email"
            className="min-w-0 flex-1 bg-transparent px-3.5 font-sans text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="shrink-0 bg-gold px-4 font-sans text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {state === "sending" ? "寄送中…" : "訂閱"}
          </button>
        </div>
        {/* The widget is in invisible mode: it draws nothing and asks nothing of
            the reader, so this element exists only for Turnstile to find and to
            write the token into. Invisible mode is allowed on the condition that
            the site's privacy policy references Cloudflare's Turnstile Privacy
            Addendum, which /privacy does — that link below is not decoration. */}
        {TURNSTILE_SITE_KEY && (
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-action="subscribe" />
        )}
        {state === "error" && (
          <p className="font-sans text-sm text-muted-foreground">送出失敗了，請再試一次。</p>
        )}
        {/* The widget is invisible, so nothing else on the page tells a reader
            that bot detection is running, and a footer link is not disclosure at
            the point of collection. Cloudflare's own policy is cited on
            /privacy rather than here: the condition for invisible mode is that
            the privacy policy references the Turnstile Privacy Addendum, not
            that every form links to it. */}
        <p className="font-sans text-xs text-muted-foreground">
          受 Cloudflare Turnstile 保護 ·{" "}
          <Link href="/privacy/" className="underline underline-offset-2 hover:text-gold">
            隱私說明
          </Link>
        </p>
      </form>
    </>
  );
}

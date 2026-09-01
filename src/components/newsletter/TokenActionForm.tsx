"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type State = "idle" | "working" | "done" | "gone" | "error";

/**
 * A button that posts a signed token to an endpoint.
 *
 * Confirming and unsubscribing both go through a button rather than the link in
 * the email doing the work itself: Gmail and Outlook fetch links to scan them,
 * and a GET that changes state would let a scanner confirm subscriptions and
 * cancel them on the subscriber's behalf.
 */
export function TokenActionForm({
  token,
  endpoint,
  action,
  tone,
  doneMessage,
  goneMessage,
}: {
  token: string;
  endpoint: string;
  action: string;
  /**
   * `primary` for the thing the page is asking for, `neutral` for leaving.
   * An unsubscribe button styled as an invitation reads as a trick.
   */
  tone: "primary" | "neutral";
  doneMessage: string;
  goneMessage?: string;
}) {
  const [state, setState] = useState<State>("idle");

  async function run() {
    setState("working");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.ok) return setState("done");
      setState(response.status === 409 ? "gone" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <p className="font-sans text-base leading-relaxed">{doneMessage}</p>;
  }
  if (state === "gone" && goneMessage) {
    return <p className="font-sans text-base leading-relaxed">{goneMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Same pill language as the subscribe button, so the whole newsletter
          section reads as one set of controls. Sized to its label rather than
          stretched: a full-width button here implied a form that is not one. */}
      <button
        type="button"
        onClick={run}
        disabled={state === "working"}
        className={cn(
          "h-11 w-fit rounded-full px-6 font-sans text-[1.0625rem] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60",
          tone === "primary" ? "bg-gold text-neutral-900" : "border border-border text-foreground",
        )}
      >
        {state === "working" ? "處理中…" : action}
      </button>
      {state === "error" && (
        <p className="font-sans text-sm text-muted-foreground">
          這個連結無效或已經過期了。回到{" "}
          <Link href="/newsletter/" className="underline">
            訂閱頁
          </Link>{" "}
          重新開始就好。
        </p>
      )}
    </div>
  );
}

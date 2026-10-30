"use client";

import { useEffect, useState } from "react";
import { SendButton, type SendState } from "@/components/editor/SendButton";
import { Button } from "@/components/ui/button";

const SLUG = "paper-plane-preview";

/**
 * The real send dialog over a send that goes nowhere: while this page is open,
 * a POST to any `/send/` route is answered here instead of reaching the server.
 * Everything else — the dialog, the confirm field, the animation — is the
 * component the editor uses.
 */
export function SendPreview() {
  const [fail, setFail] = useState(false);
  // A send that worked leaves the Sent badge behind; a new key gives a fresh
  // button to press again.
  const [round, setRound] = useState(0);
  const [state] = useState(() => Promise.resolve<SendState>({ sentAt: null, recipients: 6 }));

  useEffect(() => {
    const real = window.fetch;
    window.fetch = async (input, init) => {
      if (!String(input).endsWith("/send/")) return real(input, init);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const body = fail
        ? { error: "假的錯誤：Resend 沒有回應（這是預覽）" }
        : {
            subject: "紙飛機預覽",
            recipients: 6,
            sentAt: Date.now(),
            broadcastId: "bc_preview",
            pulledUnsubscribes: 0,
            pushedToResend: 0,
            recovered: false,
          };
      return new Response(JSON.stringify(body), {
        status: fail ? 502 : 200,
        headers: { "content-type": "application/json" },
      });
    };
    return () => {
      window.fetch = real;
    };
  }, [fail]);

  return (
    <div className="flex flex-1 flex-wrap items-center gap-4">
      <span className="text-muted-foreground">
        Send preview：寄送不會離開這個頁面，確認欄位輸入{" "}
        <code className="font-mono">{SLUG}</code>
      </span>
      <label className="ml-auto flex items-center gap-2">
        <input type="checkbox" checked={fail} onChange={(event) => setFail(event.target.checked)} />
        讓寄送失敗
      </label>
      <Button variant="ghost" size="sm" onClick={() => setRound((n) => n + 1)}>
        重來
      </Button>
      <SendButton
        key={round}
        collection="posts"
        slug={SLUG}
        subject="紙飛機預覽"
        draft={false}
        state={state}
        onBeforeSend={async () => {}}
      />
    </div>
  );
}

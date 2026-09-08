"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Where the address is kept between sends. A test goes to your own inbox
 * almost every time, and retyping it for each look at a draft is the kind of
 * friction that stops you looking.
 */
const REMEMBERED = "blog.editor.testSendTo";

function remembered(): string {
  try {
    return window.localStorage.getItem(REMEMBERED) ?? "";
  } catch {
    // Private windows and blocked site data both throw here. An empty field is
    // a fine outcome; a dialog that will not open is not.
    return "";
  }
}

function remember(email: string): void {
  try {
    window.localStorage.setItem(REMEMBERED, email);
  } catch {
    // Nothing to do, and nothing worth telling anyone about.
  }
}

type State =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "sent"; subject: string }
  | { phase: "error"; message: string };

/**
 * Sends the Issue in front of you to one address, the way Substack's "Send
 * test email" does.
 *
 * The command line can already do this (`pnpm newsletter:send <slug> --test`),
 * but a button in the toolbar is what gets used: checking a draft in a real
 * inbox is worth doing several times while writing, and it competes with
 * whatever else is on the desk. Both call the same `sendTestIssue`.
 *
 * It saves first. The editor autosaves a beat after typing stops, so without a
 * flush the paragraph you just wrote is the one thing missing from the email —
 * the single most confusing outcome this button could have.
 */
export function TestSendButton({
  slug,
  onBeforeSend,
}: {
  slug: string;
  onBeforeSend: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  // The field, so opening the dialog lands the caret in it — the address is the
  // only thing to say here, and reaching for the mouse to say it is a step this
  // dialog does not need.
  const field = useRef<HTMLInputElement>(null);
  // The dialog does not let Enter reach the form, and a one-field dialog that
  // ignores Enter is a dialog you have to aim at. This puts it back, through
  // `requestSubmit` so the field's own validation still runs first.
  const form = useRef<HTMLFormElement>(null);
  const [to, setTo] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });

  const openDialog = () => {
    setTo(remembered());
    setState({ phase: "idle" });
    setOpen(true);
  };

  const send = async () => {
    setState({ phase: "sending" });
    try {
      await onBeforeSend();
      const response = await fetch(`/api/editor/issues/${slug}/test-send/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to }),
      });
      // A route that threw answers with an HTML error page, and reading that
      // as JSON throws in turn — which showed the parse error instead of the
      // status that caused it.
      const body = (await response.json().catch(() => null)) as {
        subject?: string;
        error?: string;
      } | null;
      if (!response.ok) {
        setState({ phase: "error", message: body?.error ?? `寄不出去（HTTP ${response.status}）` });
        return;
      }
      remember(to);
      setState({ phase: "sent", subject: body?.subject ?? "" });
    } catch (error) {
      setState({ phase: "error", message: error instanceof Error ? error.message : "寄不出去" });
    }
  };

  const sending = state.phase === "sending";

  return (
    <>
      <Button variant="ghost" size="sm" onClick={openDialog}>
        Send test
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="font-sans" initialFocus={field}>
          <DialogHeader>
            <DialogTitle>寄一封測試信</DialogTitle>
            <DialogDescription>
              把這一期寄到一個信箱，主旨會加上 [測試]。不會碰到訂閱名單，也不算寄出過。
            </DialogDescription>
          </DialogHeader>

          <form
            ref={form}
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <Field>
              <FieldLabel htmlFor="test-send-to">收件地址</FieldLabel>
              <Input
                id="test-send-to"
                ref={field}
                type="email"
                required
                value={to}
                disabled={sending}
                onChange={(event) => setTo(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") form.current?.requestSubmit();
                }}
                placeholder="you@example.com"
              />
              {state.phase === "sent" && (
                <FieldDescription>寄出了：{state.subject}</FieldDescription>
              )}
              {state.phase === "error" && (
                <FieldDescription className="text-destructive">{state.message}</FieldDescription>
              )}
              {state.phase !== "sent" && state.phase !== "error" && (
                <FieldDescription>草稿也可以寄，先看看它在信箱裡長什麼樣子。</FieldDescription>
              )}
            </Field>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={sending}
                onClick={() => setOpen(false)}
              >
                關閉
              </Button>
              <Button type="submit" disabled={sending || to.trim() === ""}>
                {sending ? "寄送中…" : "寄出測試信"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
 * What the page read out of the deployed subscriber list, or why it could not.
 * Mirrors `SendState` in `src/lib/newsletter/send-issue.ts`.
 */
export type SendState = { sentAt: number | null; recipients: number } | { error: string };

/** What the route answers with. Mirrors `SendReceipt`. */
type Receipt = {
  subject: string;
  recipients: number;
  sentAt: number;
  broadcastId: string;
};

const day = (sentAt: number) =>
  new Date(sentAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });

const stamp = (sentAt: number) => new Date(sentAt).toLocaleString("zh-TW", { hour12: false });

/**
 * Sends the Issue in front of you to the list.
 *
 * The one irreversible action in the whole newsletter, so the dialog is a
 * review rather than a confirmation: the subject line that will land in an
 * inbox, and how many inboxes — the count read from the deployed list when the
 * page was opened, not from anything in the browser. Typing the slug back is
 * what arms the button, in place of the `yes` this used to ask for at a
 * terminal prompt. See docs/adr/0003-issues-are-sent-by-hand.md.
 *
 * Once an Issue has gone out there is no button here at all: a **Sent** badge
 * takes its place. `issue_sends` is what makes that true rather than the badge
 * — the row is keyed by slug, so a second send is refused by SQLite even if
 * something got past every check above it — but the badge is what answers "did
 * I already send this?" without pressing anything and reading the error.
 */
export function SendIssueButton({
  slug,
  subject,
  draft,
  state,
  onBeforeSend,
}: {
  slug: string;
  /** The subject line as the document currently reads, not as it was on disk. */
  subject: string;
  draft: boolean;
  state: SendState;
  onBeforeSend: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  // A send that was refused because the Issue had already gone out: the row was
  // there before this tab was opened, and the answer carries when.
  const [refusedAt, setRefusedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState("");
  // The field, so opening the dialog lands the caret in it: the slug is the
  // only thing to say here.
  const field = useRef<HTMLInputElement>(null);

  const unreachable = "error" in state ? state.error : null;
  const sentAt = receipt?.sentAt ?? refusedAt ?? ("error" in state ? null : state.sentAt);

  if (sentAt !== null) {
    return (
      <Badge variant="secondary" title={`寄出於 ${stamp(sentAt)}`}>
        Sent · {day(sentAt)}
      </Badge>
    );
  }

  const recipients = "error" in state ? 0 : state.recipients;
  // Why the send is not available, in the order the server decides it. `null`
  // means it is.
  const blocked = draft
    ? "這一期還是草稿（draft: true）。先 Publish 才寄得出去。"
    : unreachable !== null
      ? `讀不到線上的訂閱名單，所以還不能寄：${unreachable}`
      : recipients === 0
        ? "線上名單裡沒有已確認的訂閱者，沒有人可以寄。"
        : null;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      // The route mails what is on disk, and the editor autosaves a beat after
      // typing stops. Sending before that beat mails an Issue missing the
      // paragraph just written — and this is the one send that cannot be taken
      // back.
      await onBeforeSend();
      const response = await fetch(`/api/editor/issues/${slug}/send/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      // A route that threw answers with an HTML error page, and reading that as
      // JSON throws in turn — which shows the parse error instead of the status
      // that caused it.
      const body = (await response.json().catch(() => null)) as
        | (Partial<Receipt> & { error?: string; refusal?: string; sentAt?: number | null })
        | null;

      if (response.ok && body?.sentAt != null) {
        setReceipt(body as Receipt);
        setOpen(false);
        return;
      }

      setError(body?.error ?? `寄不出去（HTTP ${response.status}）`);
      // It had already gone out — from another tab, or before this one was
      // opened. Redraw as sent rather than leaving a dialog that invites
      // another attempt.
      if (body?.refusal === "already-sent" && body.sentAt != null) setRefusedAt(body.sentAt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "寄不出去");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setConfirm("");
          setError(null);
          setOpen(true);
        }}
      >
        Send
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* `font-sans`, like the other dialogs here: this is portalled to
            <body>, which is set in garamond for reading. */}
        <DialogContent className="font-sans" initialFocus={field}>
          <DialogHeader>
            <DialogTitle>把這一期寄給訂閱者</DialogTitle>
            <DialogDescription>
              寄出去就收不回來了。寄的是硬碟上的檔案，不是瀏覽器裡還沒存的東西。
            </DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-y py-4 text-sm">
            <dt className="text-muted-foreground">主旨</dt>
            <dd className="min-w-0 font-medium">{subject}</dd>
            <dt className="text-muted-foreground">收件人</dt>
            <dd className="font-medium tabular-nums">
              {unreachable === null ? `${recipients} 位已確認的訂閱者` : "讀不到"}
            </dd>
          </dl>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <Field>
              <FieldLabel htmlFor="send-issue-confirm">輸入 {slug} 以確認</FieldLabel>
              <Input
                id="send-issue-confirm"
                ref={field}
                required
                autoComplete="off"
                value={confirm}
                disabled={sending || blocked !== null}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder={slug}
              />
              {error !== null && (
                <FieldDescription className="text-destructive">{error}</FieldDescription>
              )}
              {error === null && blocked !== null && (
                <FieldDescription className="text-destructive">{blocked}</FieldDescription>
              )}
              {error === null && blocked === null && (
                <FieldDescription>寄出後這一期會記成已寄出，不會再寄第二次。</FieldDescription>
              )}
            </Field>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={sending}
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={sending || blocked !== null || confirm !== slug}>
                {sending ? "寄送中…" : "寄給訂閱者"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

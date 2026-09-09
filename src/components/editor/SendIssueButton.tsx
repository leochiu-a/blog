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
  pulledUnsubscribes: number;
  pushedToResend: number;
  recovered: boolean;
};

const day = (sentAt: number) =>
  new Date(sentAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });

const stamp = (sentAt: number) => new Date(sentAt).toLocaleString("zh-TW", { hour12: false });

/**
 * Where the send can be looked at afterwards. Our own records stop at "Resend
 * accepted it"; whether it reached an inbox, bounced or was opened is Resend's
 * to report, and this is the screen that reports it. The id is printed next to
 * the link either way, so the receipt still says everything it knows if the
 * dashboard's URL shape ever moves.
 */
const broadcastUrl = (id: string) => `https://resend.com/broadcasts/${id}`;

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

  // The receipt is on screen, so the toolbar behind it waits its turn: a badge
  // appearing under an open dialog would answer the dialog's own question
  // before it had been read.
  if (sentAt !== null && !(open && receipt !== null)) {
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
        // The dialog stays open, holding the receipt. It is the only moment the
        // recipient count, the broadcast id and what reconciliation moved are
        // all in one place — and the badge that replaces this button afterwards
        // can only say the date.
        setReceipt(body as Receipt);
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
          {/* The question, then the answer to it. A dialog still headed "寄出去
              就收不回來了" over a send that has happened is asking about
              something that is no longer in front of you. */}
          <DialogHeader>
            <DialogTitle>{receipt === null ? "把這一期寄給訂閱者" : "寄出了"}</DialogTitle>
            <DialogDescription>
              {receipt === null
                ? "寄出去就收不回來了。寄的是硬碟上的檔案，不是瀏覽器裡還沒存的東西。"
                : "這一期已經記成寄出過了，不會再寄第二次。"}
            </DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-y py-4 text-sm">
            <dt className="text-muted-foreground">主旨</dt>
            <dd className="min-w-0 font-medium">{receipt?.subject ?? subject}</dd>
            <dt className="text-muted-foreground">收件人</dt>
            <dd className="font-medium tabular-nums">
              {receipt !== null
                ? receipt.recovered
                  ? "Resend 已經寄過了"
                  : `${receipt.recipients} 位`
                : unreachable === null
                  ? `${recipients} 位已確認的訂閱者`
                  : "讀不到"}
            </dd>

            {receipt !== null && (
              <>
                <dt className="text-muted-foreground">寄出時間</dt>
                <dd className="font-medium tabular-nums">{stamp(receipt.sentAt)}</dd>
                <dt className="text-muted-foreground">Resend</dt>
                <dd className="min-w-0">
                  <a
                    href={broadcastUrl(receipt.broadcastId)}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all underline decoration-dotted underline-offset-2"
                  >
                    {receipt.broadcastId}
                  </a>
                </dd>
                {(receipt.pulledUnsubscribes > 0 || receipt.pushedToResend > 0) && (
                  <>
                    <dt className="text-muted-foreground">對帳</dt>
                    <dd className="text-muted-foreground">
                      回寫退訂 {receipt.pulledUnsubscribes} 筆、補進 Resend 名單{" "}
                      {receipt.pushedToResend} 筆
                    </dd>
                  </>
                )}
              </>
            )}
          </dl>

          {receipt !== null ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {receipt.recovered
                  ? "這一期在 Resend 上早就寄出去了，只是我們這邊沒記到——剛剛把紀錄補上了，沒有再寄給任何人。"
                  : "Resend 收下了。信有沒有真的進到收件匣、有沒有退信，上面那個連結看得到。"}
              </p>
              <div className="mt-4 flex justify-end">
                <Button type="button" onClick={() => setOpen(false)}>
                  好
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <Field>
                {/* `select-text` on the label, `select-all` on the slug.
                    Between them, the代號 can be taken out of the sentence it
                    is written in — nobody should transcribe thirty characters
                    of kebab-case by eye.
                    ⁃
                    Both are needed. `Label` ships `select-none`
                    (src/components/ui/label.tsx), so without the first the
                    slug cannot be selected at all; without the second a click
                    selects nothing and a double-click takes one word out of
                    five. Measured in the editor: clicking the slug selects the
                    whole of it and leaves focus alone, while clicking anywhere
                    else in the label still focuses the field the way a label
                    should.
                    ⁃
                    `block` because `Label` is a flex row: as flex items the
                    three pieces of one sentence get gaps between them and
                    refuse to wrap.
                    ⁃
                    Overriding `user-select` on the label itself rather than
                    fighting it from inside also keeps WebKit honest — a
                    descendant cannot escape an ancestor's
                    `-webkit-user-select: none` there, only replace it here.
                    ⁃
                    Deliberately not a copy button. The guard is that the slug
                    has to arrive in the field and the send has to be pressed
                    after it; carrying it across by hand was never the part that
                    made anybody think twice. */}
                <FieldLabel htmlFor="send-issue-confirm" className="block select-text">
                  輸入{" "}
                  <code className="font-mono select-all" title="點一下就整段選取">
                    {slug}
                  </code>{" "}
                  以確認
                </FieldLabel>
                <Input
                  id="send-issue-confirm"
                  ref={field}
                  required
                  autoComplete="off"
                  value={confirm}
                  disabled={sending || blocked !== null}
                  onChange={(event) => setConfirm(event.target.value)}
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

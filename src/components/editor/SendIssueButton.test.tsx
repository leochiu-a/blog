// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SendIssueButton, type SendState } from "./SendIssueButton";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** What happened, in the order it happened — which is the thing under test. */
let order: string[];

function stubFetch(response: { ok: boolean; status: number; body: unknown }) {
  const fetch = vi.fn(async () => {
    order.push("fetch");
    return {
      ok: response.ok,
      status: response.status,
      json: () => Promise.resolve(response.body),
    } as Response;
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const RECEIPT = {
  subject: "第一期",
  recipients: 3,
  sentAt: Date.UTC(2026, 8, 1, 4, 0, 0),
  broadcastId: "bc_1",
};

function renderButton({
  draft = false,
  state = { sentAt: null, recipients: 3 } as SendState,
}: { draft?: boolean; state?: SendState } = {}) {
  const onBeforeSend = vi.fn(async () => {
    order.push("save");
  });
  render(
    <SendIssueButton
      slug="first"
      subject="第一期"
      draft={draft}
      state={state}
      onBeforeSend={onBeforeSend}
    />,
  );
  return { onBeforeSend };
}

const sendButton = () => screen.getByRole("button", { name: "寄給訂閱者" });

beforeEach(() => {
  order = [];
});

describe("the send button", () => {
  it("does not offer to send an Issue that has already gone out", () => {
    renderButton({ state: { sentAt: RECEIPT.sentAt, recipients: 3 } });

    expect(screen.getByText(/^Sent · 2026-09-01$/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });

  /**
   * The whole point of the typed slug: a send that one stray click could
   * perform is a send that will eventually happen by accident.
   */
  it("stays disabled until the slug is typed back", async () => {
    const fetch = stubFetch({ ok: true, status: 200, body: RECEIPT });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(sendButton().hasAttribute("disabled")).toBe(true);

    await user.type(screen.getByLabelText("輸入 first 以確認"), "firs");
    expect(sendButton().hasAttribute("disabled")).toBe(true);

    await user.type(screen.getByLabelText("輸入 first 以確認"), "t");
    expect(sendButton().hasAttribute("disabled")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  /**
   * The route mails what is on disk, and the editor saves a beat after typing
   * stops. Sending before that beat mails an Issue missing the paragraph just
   * written — to everyone, once, with no way back.
   */
  it("saves the document before asking for the send", async () => {
    stubFetch({ ok: true, status: 200, body: RECEIPT });
    const user = userEvent.setup();
    const { onBeforeSend } = renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.type(screen.getByLabelText("輸入 first 以確認"), "first");
    await user.click(sendButton());

    await waitFor(() => expect(onBeforeSend).toHaveBeenCalled());
    expect(order).toEqual(["save", "fetch"]);
  });

  it("shows the send it just performed, so the button cannot come back", async () => {
    const user = userEvent.setup();
    stubFetch({ ok: true, status: 200, body: RECEIPT });
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.type(screen.getByLabelText("輸入 first 以確認"), "first");
    await user.click(sendButton());

    await waitFor(() => expect(screen.getByText(/^Sent · 2026-09-01$/)).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });

  /**
   * Sent from another tab, or before this one was opened. The refusal is the
   * answer, so the dialog must not stay open inviting a third attempt.
   */
  it("redraws as sent when the route refuses because it already went out", async () => {
    const user = userEvent.setup();
    stubFetch({
      ok: false,
      status: 409,
      body: { error: "已經寄過了", refusal: "already-sent", sentAt: RECEIPT.sentAt },
    });
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.type(screen.getByLabelText("輸入 first 以確認"), "first");
    await user.click(sendButton());

    await waitFor(() => expect(screen.getByText(/^Sent · 2026-09-01$/)).toBeTruthy());
  });

  it("will not send a draft, and says which button to press instead", async () => {
    const fetch = stubFetch({ ok: true, status: 200, body: RECEIPT });
    const user = userEvent.setup();
    renderButton({ draft: true });

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(/先 Publish/)).toBeTruthy();

    await user.type(screen.getByLabelText("輸入 first 以確認"), "first");
    expect(sendButton().hasAttribute("disabled")).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  /**
   * No network, or no Wrangler login: the page could not read the list, so the
   * recipient count in the dialog would be a guess. Refusing to send on a guess
   * is the only safe reading of it.
   */
  it("will not send when the subscriber list could not be read", async () => {
    const user = userEvent.setup();
    renderButton({ state: { error: "D1 unreachable" } });

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText(/D1 unreachable/)).toBeTruthy();
    expect(sendButton().hasAttribute("disabled")).toBe(true);
  });
});

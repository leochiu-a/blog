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

/** What the route answers a successful send with. */
const RECEIPT = {
  subject: "第一期",
  recipients: 3,
  sentAt: Date.UTC(2026, 8, 1, 4, 0, 0),
  broadcastId: "bc_1",
  pulledUnsubscribes: 0,
  pushedToResend: 0,
  recovered: false,
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

  it("answers the send it just performed, and offers no way to repeat it", async () => {
    const user = userEvent.setup();
    stubFetch({ ok: true, status: 200, body: RECEIPT });
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.type(screen.getByLabelText("輸入 first 以確認"), "first");
    await user.click(sendButton());

    // The receipt takes the dialog over; the badge is behind it, and arrives
    // when it is dismissed — see "the receipt" below.
    await waitFor(() => expect(screen.getByText("寄出了")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
    expect(screen.queryByRole("button", { name: "寄給訂閱者" })).toBeNull();
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
   * Two classes, both load-bearing. `Label` ships `select-none`, so without
   * `select-text` the slug written into its sentence cannot be selected at
   * all; without `select-all` a click selects nothing and a double-click on
   * kebab-case takes one word out of five. Together, one click on the slug
   * hands over all of it — verified in the editor, where it also leaves focus
   * alone while the rest of the label still focuses the field.
   */
  it("lets the slug be selected out of the label it is written in", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));

    const shown = screen.getByTitle("點一下就整段選取");
    expect(shown.textContent).toBe("first");
    expect(shown.className).toContain("select-all");

    const label = shown.closest("label");
    expect(label?.className).toContain("select-text");
    // Still the field's label — every other test finds the input through it.
    expect(label?.getAttribute("for")).toBe("send-issue-confirm");
    expect(screen.getByLabelText("輸入 first 以確認").id).toBe("send-issue-confirm");
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

/**
 * What the send says it did.
 *
 * The receipt exists because the badge that replaces this button can only say
 * a date, while the send itself knows the count, the broadcast id and what
 * reconciliation moved — and this is the only moment those are in one place.
 * Losing them meant the only way to answer "did that work?" was to go and read
 * two dashboards.
 */
describe("the receipt", () => {
  // One unsubscribe pulled back from Resend, so the reconciliation line has
  // something to say.
  const receipt = { ...RECEIPT, pulledUnsubscribes: 1 };

  it("reports the count, the broadcast and what reconciliation moved", async () => {
    const user = userEvent.setup();
    stubFetch({ ok: true, status: 200, body: receipt });
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.type(screen.getByLabelText("輸入 first 以確認"), "first");
    await user.click(sendButton());

    await waitFor(() => expect(screen.getByText("寄出了")).toBeTruthy());
    expect(screen.getByText("3 位")).toBeTruthy();
    expect(screen.getByRole("link", { name: "bc_1" }).getAttribute("href")).toBe(
      "https://resend.com/broadcasts/bc_1",
    );
    expect(screen.getByText(/回寫退訂 1 筆/)).toBeTruthy();
    // Not offering to do it again, either.
    expect(screen.queryByRole("button", { name: "寄給訂閱者" })).toBeNull();
  });

  it("leaves the Sent badge behind once the receipt is dismissed", async () => {
    const user = userEvent.setup();
    stubFetch({ ok: true, status: 200, body: receipt });
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.type(screen.getByLabelText("輸入 first 以確認"), "first");
    await user.click(sendButton());
    await waitFor(() => expect(screen.getByText("寄出了")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "好" }));

    await waitFor(() => expect(screen.getByText(/^Sent · 2026-09-01$/)).toBeTruthy());
  });

  /**
   * A send that mailed nobody: Resend had already sent this Issue and the row
   * was what was missing. Reporting it as "3 位" would claim an send that did
   * not happen here.
   */
  it("says so when it only wrote down a send Resend had already made", async () => {
    const user = userEvent.setup();
    stubFetch({
      ok: true,
      status: 200,
      body: { ...receipt, recipients: 0, pulledUnsubscribes: 0, recovered: true },
    });
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.type(screen.getByLabelText("輸入 first 以確認"), "first");
    await user.click(sendButton());

    await waitFor(() => expect(screen.getByText("Resend 已經寄過了")).toBeTruthy());
    expect(screen.getByText(/沒有再寄給任何人/)).toBeTruthy();
  });
});

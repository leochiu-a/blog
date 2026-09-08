// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestSendButton } from "./TestSendButton";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

/** What happened, in the order it happened — which is the thing under test. */
let order: string[];

function stubFetch(response: Partial<Response> & { json: () => Promise<unknown> }) {
  const fetch = vi.fn(async () => {
    order.push("fetch");
    return response as Response;
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function ok(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) };
}

async function openAndSend(to: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Send test" }));
  await user.type(screen.getByLabelText("收件地址"), to);
  await user.click(screen.getByRole("button", { name: "寄出測試信" }));
  return user;
}

function renderButton() {
  const onBeforeSend = vi.fn(async () => {
    order.push("save");
  });
  render(<TestSendButton slug="first" onBeforeSend={onBeforeSend} />);
  return { onBeforeSend };
}

beforeEach(() => {
  order = [];
});

describe("the test send button", () => {
  /**
   * The route mails what is on disk, and the editor saves a beat after typing
   * stops. Sending before that beat mails an Issue missing the paragraph just
   * written — which looks like the renderer dropping it.
   */
  it("saves the document before asking for the send", async () => {
    stubFetch(ok({ subject: "[測試] 第一期" }));
    const { onBeforeSend } = renderButton();

    await openAndSend("me@example.com");

    await waitFor(() => expect(onBeforeSend).toHaveBeenCalled());
    expect(order).toEqual(["save", "fetch"]);
  });

  it("posts the address to this Issue's endpoint", async () => {
    const fetch = stubFetch(ok({ subject: "[測試] 第一期" }));
    renderButton();

    await openAndSend("me@example.com");

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/editor/issues/first/test-send/");
    expect(JSON.parse(String(init.body))).toEqual({ to: "me@example.com" });
  });

  it("remembers the address for the next look at a draft", async () => {
    stubFetch(ok({ subject: "[測試] 第一期" }));
    const { unmount } = render(<TestSendButton slug="first" onBeforeSend={async () => {}} />);
    await openAndSend("me@example.com");
    await waitFor(() => expect(screen.getByText(/寄出了/)).toBeTruthy());
    unmount();

    render(<TestSendButton slug="first" onBeforeSend={async () => {}} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Send test" }));

    expect(screen.getByLabelText("收件地址")).toHaveProperty("value", "me@example.com");
  });

  it("shows what the route said went wrong", async () => {
    stubFetch({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ error: "Resend 拒絕了：API key is invalid" }),
    });
    renderButton();

    await openAndSend("me@example.com");

    await waitFor(() => expect(screen.getByText("Resend 拒絕了：API key is invalid")).toBeTruthy());
  });

  /** A thrown route answers with HTML, and reading that as JSON throws in turn. */
  it("reports the status when the failure did not arrive as JSON", async () => {
    stubFetch({ ok: false, status: 500, json: () => Promise.reject(new Error("not json")) });
    renderButton();

    await openAndSend("me@example.com");

    await waitFor(() => expect(screen.getByText("寄不出去（HTTP 500）")).toBeTruthy());
  });

  it("does not remember an address that failed", async () => {
    stubFetch({ ok: false, status: 502, json: () => Promise.resolve({ error: "沒寄出去" }) });
    renderButton();

    await openAndSend("me@example.com");

    await waitFor(() => expect(screen.getByText("沒寄出去")).toBeTruthy());
    expect(window.localStorage.getItem("blog.editor.testSendTo")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import type { RemoteBroadcast, RemoteContact } from "./resend";
import {
  SendRefused,
  decideSend,
  refusalMessage,
  sendIssueToList,
  type Issue,
  type IssueSent,
  type OutgoingBroadcast,
  type SendCandidate,
  type SendIssueDeps,
  type SendState,
} from "./send-issue";

/**
 * The gate in front of the one irreversible action here. Three states refuse a
 * send, and which one is reported matters as much as the refusal: the dialog
 * says why the button is dead, and the answers are different — one is fixed by
 * pressing Publish, one cannot be fixed at all.
 */

const ready: SendCandidate = { draft: false, sentAt: null, recipients: 42 };

describe("decideSend", () => {
  it("sends a published Issue that has not gone out to a list with people on it", () => {
    expect(decideSend(ready)).toBe("send");
  });

  it("refuses a draft", () => {
    expect(decideSend({ ...ready, draft: true })).toBe("draft");
  });

  it("refuses an empty list", () => {
    expect(decideSend({ ...ready, recipients: 0 })).toBe("no-recipients");
  });

  /**
   * Already sent outranks everything, including a draft flag added afterwards.
   * The other two describe an Issue that cannot be mailed yet; this one
   * describes one that has been, which is the fact worth reporting — and it is
   * what makes the toolbar show a Sent badge rather than an unpublished-draft
   * warning over an Issue people have already read.
   */
  it("reports an Issue that has already gone out, whatever else is true of it", () => {
    const sent = { draft: true, sentAt: Date.UTC(2026, 8, 1), recipients: 0 };

    expect(decideSend(sent)).toBe("already-sent");
    expect(refusalMessage("already-sent", sent)).toContain("issue_sends");
  });
});

/**
 * The send itself, with D1 and Resend faked.
 *
 * This path cannot be rehearsed against the real thing: every honest run of it
 * mails the list, so a bug in the order of operations would be found by five
 * thousand people at once. What is checked here is exactly what a real run
 * would not let anybody see twice — that a refused send costs no request, that
 * the segment is reconciled before the broadcast is created rather than after,
 * that the row recorded is the count that actually went out, and that the
 * recording is last.
 */

const issue: Issue = {
  slug: "first",
  frontmatter: { title: "第一期", datetime: "2026-09-01T09:00:00+08:00" },
  markdown: "哈囉。\n",
};

const NOW = Date.UTC(2026, 8, 1, 1, 0, 0);

function deps({
  state = { sentAt: null, recipients: 2 },
  confirmed = ["a@example.com", "b@example.com"],
  contacts = [
    { email: "a@example.com", unsubscribed: false },
    { email: "b@example.com", unsubscribed: false },
  ],
  existing = null,
}: {
  state?: SendState;
  confirmed?: string[];
  contacts?: RemoteContact[];
  /** What Resend already holds under this Issue's broadcast name. */
  existing?: RemoteBroadcast | null;
} = {}) {
  /** Every call the send made, in order — which is most of what is under test. */
  const calls: string[] = [];
  const names: string[] = [];
  const broadcasts: OutgoingBroadcast[] = [];
  const recorded: IssueSent[] = [];
  const created: string[] = [];
  const unsubscribed: string[][] = [];

  const dependencies: SendIssueDeps = {
    now: () => NOW,
    sendState: async () => {
      calls.push("sendState");
      return state;
    },
    findBroadcast: async (name) => {
      calls.push("findBroadcast");
      names.push(name);
      return existing;
    },
    confirmedEmails: async () => {
      calls.push("confirmedEmails");
      return confirmed;
    },
    listContacts: async () => {
      calls.push("listContacts");
      return contacts;
    },
    createContact: async (email) => {
      calls.push("createContact");
      created.push(email);
    },
    markUnsubscribed: async (emails) => {
      calls.push("markUnsubscribed");
      unsubscribed.push(emails);
    },
    createBroadcast: async (broadcast) => {
      calls.push("createBroadcast");
      broadcasts.push(broadcast);
      return { id: "bc_1" };
    },
    sendBroadcast: async () => {
      calls.push("sendBroadcast");
    },
    recordSend: async (record) => {
      calls.push("recordSend");
      recorded.push(record);
    },
  };

  return { dependencies, calls, names, broadcasts, recorded, created, unsubscribed };
}

describe("sending an Issue to the list", () => {
  it("reconciles, creates the broadcast, sends it, and records it — in that order", async () => {
    const fake = deps();

    const receipt = await sendIssueToList(issue, fake.dependencies);

    expect(fake.calls).toEqual([
      "sendState",
      "findBroadcast",
      "listContacts",
      "confirmedEmails",
      "markUnsubscribed",
      "createBroadcast",
      "sendBroadcast",
      "recordSend",
    ]);
    expect(receipt).toEqual({
      broadcastId: "bc_1",
      subject: "第一期",
      recipients: 2,
      sentAt: NOW,
      pulledUnsubscribes: 0,
      pushedToResend: 0,
      recovered: false,
    });
  });

  it("labels the broadcast by date and slug, and hands Resend its unsubscribe placeholder", async () => {
    const fake = deps();

    await sendIssueToList(issue, fake.dependencies);

    const [broadcast] = fake.broadcasts;
    expect(broadcast?.name).toBe("2026-09-01 first");
    // A broadcast is one template for everyone; Resend swaps this per contact.
    // Shipping a real per-subscriber link here would send everyone the same
    // one, and shipping nothing would send a dead footer.
    expect(broadcast?.html).toContain("{{{RESEND_UNSUBSCRIBE_URL}}}");
  });

  /**
   * The guard that matters most. A refusal has to happen before anything is
   * built or requested — an Issue that was already sent must cost zero calls to
   * Resend, or "it refused" and "it half-sent" become the same outcome.
   */
  it("refuses an Issue that has gone out without touching Resend at all", async () => {
    const fake = deps({ state: { sentAt: NOW - 86_400_000, recipients: 2 } });

    await expect(sendIssueToList(issue, fake.dependencies)).rejects.toThrow(SendRefused);
    expect(fake.calls).toEqual(["sendState"]);
  });

  it("records the count that went out, not the count D1 held before reconciling", async () => {
    // b@ left through Resend since they confirmed: D1 still says two.
    const fake = deps({
      contacts: [
        { email: "a@example.com", unsubscribed: false },
        { email: "b@example.com", unsubscribed: true },
      ],
    });

    const receipt = await sendIssueToList(issue, fake.dependencies);

    expect(fake.unsubscribed).toEqual([["b@example.com"]]);
    expect(receipt.recipients).toBe(1);
    expect(fake.recorded).toEqual([
      { issueSlug: "first", resendBroadcastId: "bc_1", recipientCount: 1, now: NOW },
    ]);
  });

  it("pushes a confirmed address the segment never got before mailing it", async () => {
    // b@ confirmed, but the contact creation failed at confirmation time.
    const fake = deps({ contacts: [{ email: "a@example.com", unsubscribed: false }] });

    await sendIssueToList(issue, fake.dependencies);

    expect(fake.created).toEqual(["b@example.com"]);
    expect(fake.calls.indexOf("createContact")).toBeLessThan(fake.calls.indexOf("createBroadcast"));
  });

  /**
   * Reconciliation can empty a list D1 said had people on it. Resend accepts a
   * broadcast to an empty segment, so nothing downstream would complain — it
   * would just be recorded as sent, and the Issue could never be sent again.
   */
  it("stops before the broadcast when reconciling leaves nobody", async () => {
    const fake = deps({
      contacts: [
        { email: "a@example.com", unsubscribed: true },
        { email: "b@example.com", unsubscribed: true },
      ],
    });

    await expect(sendIssueToList(issue, fake.dependencies)).rejects.toThrow(
      /沒有已確認的訂閱者|沒有人可以寄/,
    );
    expect(fake.calls).not.toContain("createBroadcast");
    expect(fake.recorded).toEqual([]);
  });

  it("will not mail a draft", async () => {
    const fake = deps();

    await expect(
      sendIssueToList(
        { ...issue, frontmatter: { ...issue.frontmatter, draft: true } },
        fake.dependencies,
      ),
    ).rejects.toThrow(/草稿/);
    expect(fake.calls).toEqual(["sendState"]);
  });

  /**
   * The window this check exists for: Resend accepted the mail and the write to
   * `issue_sends` never landed. The row is missing, so nothing in our own
   * records refuses a second press — and a second press must not mail anybody
   * again. It writes the row instead, from Resend's own account of the send.
   */
  it("records a send Resend already performed instead of performing it again", async () => {
    const sentAt = Date.UTC(2026, 8, 1, 0, 30, 0);
    const fake = deps({ existing: { id: "bc_old", status: "sent", sentAt } });

    const receipt = await sendIssueToList(issue, fake.dependencies);

    expect(receipt.recovered).toBe(true);
    expect(receipt.broadcastId).toBe("bc_old");
    // Resend's own timestamp, not this attempt's clock: the row records when
    // the mail went out, and that was earlier.
    expect(receipt.sentAt).toBe(sentAt);
    expect(fake.recorded).toEqual([
      { issueSlug: "first", resendBroadcastId: "bc_old", recipientCount: 0, now: sentAt },
    ]);
    expect(fake.calls).toEqual(["sendState", "findBroadcast", "recordSend"]);
  });

  it("looks Resend up by the name it gives the broadcast, before writing anything", async () => {
    const fake = deps({ existing: { id: "bc_old", status: "queued", sentAt: null } });

    await sendIssueToList(issue, fake.dependencies);

    expect(fake.names).toEqual(["2026-09-01 first"]);
    // Nothing reconciled, nothing created: a queued broadcast is already on its
    // way to everyone.
    expect(fake.calls).not.toContain("listContacts");
    expect(fake.calls).not.toContain("createBroadcast");
  });

  /**
   * The other half of that window: created, never sent. Sending it would mail a
   * template built from a file that has changed since, and creating a second
   * one leaves two broadcasts with one name. Neither is ours to choose.
   */
  it("refuses when Resend holds an unsent draft under this Issue's name", async () => {
    const fake = deps({ existing: { id: "bc_draft", status: "draft", sentAt: null } });

    await expect(sendIssueToList(issue, fake.dependencies)).rejects.toThrow(/status: draft/);
    expect(fake.recorded).toEqual([]);
    expect(fake.calls).toEqual(["sendState", "findBroadcast"]);
  });
});

import { describe, expect, it } from "vitest";
import { decideSend, refusalMessage, type SendCandidate } from "./send-issue";

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

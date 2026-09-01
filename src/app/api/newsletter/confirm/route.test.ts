import { describe, expect, it } from "vitest";
import * as confirmRoute from "./route";

/**
 * The confirmation endpoint must answer POST and nothing else.
 *
 * Gmail and Outlook fetch the links in a message to scan them. A `GET` export
 * here would let a scanner complete subscriptions nobody clicked, which turns
 * the consent record into a fiction — the one failure the double opt-in exists
 * to prevent. Nothing else in the suite would notice it being added, so this
 * asserts the module's shape rather than its behaviour.
 */
describe("the confirmation endpoint's HTTP surface", () => {
  it("exports POST", () => {
    expect(typeof confirmRoute.POST).toBe("function");
  });

  it("exports no handler that a link scanner could reach", () => {
    const reachableByFetching = ["GET", "HEAD"] as const;
    const exported = reachableByFetching.filter((method) => method in confirmRoute);

    expect(exported).toEqual([]);
  });
});

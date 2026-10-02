"use client";

import { useSyncExternalStore } from "react";
import { Demo } from "./Demo";

interface Probe {
  name: string;
  /** Whether GitHub's pages use it, per the scan. */
  github: boolean;
  test: () => boolean;
}

const css = (property: string, value: string) => () => CSS.supports(property, value);

const PROBES: readonly Probe[] = [
  { name: "Popover API", github: true, test: () => "popover" in HTMLElement.prototype },
  { name: "Anchor Positioning", github: true, test: css("anchor-name", "--a") },
  { name: "content-visibility", github: true, test: css("content-visibility", "auto") },
  { name: ":has()", github: true, test: () => CSS.supports("selector(:has(a))") },
  { name: "View Transitions", github: true, test: () => "startViewTransition" in document },
  {
    name: "@starting-style",
    github: true,
    test: () => "CSSStartingStyleRule" in window,
  },
  { name: "<dialog>", github: false, test: () => "HTMLDialogElement" in window },
  {
    name: "<details name>（互斥 accordion）",
    github: false,
    test: () => "name" in HTMLDetailsElement.prototype,
  },
  {
    name: "Invoker Commands",
    github: false,
    test: () => "commandForElement" in HTMLButtonElement.prototype,
  },
  { name: "@scope", github: false, test: () => "CSSScopeRule" in window },
  { name: "light-dark()", github: false, test: css("color", "light-dark(red, blue)") },
  {
    name: "::details-content",
    github: false,
    test: () => CSS.supports("selector(::details-content)"),
  },
];

const subscribe = () => () => {};

/** Probed once and kept: the answers cannot change while the page is open. */
let cached: Record<string, boolean> | null = null;

function probe() {
  cached ??= Object.fromEntries(
    PROBES.map((p) => {
      try {
        return [p.name, p.test()];
      } catch {
        return [p.name, false];
      }
    }),
  );
  return cached;
}

/**
 * Runs each feature check in the reader's own browser.
 *
 * The server cannot know, so its snapshot is `null` and every row shows a dash
 * rather than a guess; on the client the snapshot is the real answer, and
 * React swaps it in after hydration instead of hydrating to something other
 * than what the server sent.
 */
export function BrowserSupportCheck() {
  const results = useSyncExternalStore(subscribe, probe, () => null);
  return (
    <Demo label="即時偵測" className="p-0">
      <p className="border-b border-border p-4 text-muted-foreground">
        下面是在你現在這個瀏覽器裡即時偵測的結果。
      </p>
      <ul>
        {PROBES.map((p) => {
          const ok = results?.[p.name];
          return (
            <li
              key={p.name}
              className="flex items-baseline gap-4 border-b border-border p-4 last:border-b-0"
            >
              <span className="w-8 shrink-0 font-medium" aria-label={ok ? "支援" : "不支援"}>
                {results === null ? "–" : ok ? "✓" : "✗"}
              </span>
              <span className="flex-1 text-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground">
                {p.github ? "GitHub 有用" : "GitHub 沒用"}
              </span>
            </li>
          );
        })}
      </ul>
    </Demo>
  );
}

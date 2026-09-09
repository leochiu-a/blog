import { getPlatformProxy } from "wrangler";

/**
 * The deployed subscriber list, reached from `next dev`.
 *
 * `getCloudflareContext()` — what the rest of the app uses — hands out the
 * binding from `wrangler.jsonc`, which is deliberately local: development must
 * never write to the real list. But two surfaces in the editor are *about* the
 * real list, the Subscribers dashboard and the send, and a dashboard reporting
 * the empty local table would answer the question wrongly rather than not
 * answer it. Both come here instead.
 *
 * Node-only, through `wrangler`: import it from `.dev.ts` / `.dev.tsx` routes
 * and nothing else. See src/lib/editor/dev-routes.ts.
 *
 * One connection, shared by every render. `getPlatformProxy` stands up a local
 * workerd and opens a session against Cloudflare, measured at ~2.3s against
 * ~0.6s for a query — paying it per request made opening the page take three
 * seconds every time.
 *
 * On `globalThis` rather than in a module variable because Next replaces this
 * module on every edit; a module variable would leave the previous workerd
 * running and start another, and after a few saves the laptop is hosting a
 * dozen of them. Nothing disposes of it — one connection for as long as
 * `next dev` runs is the point, and the process exiting takes it down.
 */
const PROXY = Symbol.for("blog.newsletter.remoteEnv");

type ProxyHolder = {
  [PROXY]?: Promise<{ env: CloudflareEnv }>;
};

export async function remoteEnv(): Promise<CloudflareEnv> {
  const holder = globalThis as ProxyHolder;
  // `wrangler.send.jsonc` declares the same D1 database as `wrangler.jsonc`
  // and marks the binding `remote`, so Wrangler reaches the deployed one using
  // the login already on this machine.
  holder[PROXY] ??= getPlatformProxy<CloudflareEnv>({
    configPath: "wrangler.send.jsonc",
    remoteBindings: true,
  });

  try {
    return (await holder[PROXY]).env;
  } catch (cause) {
    // A failed connection must not be cached, or every later render replays
    // this error and the editor stays broken until the dev server restarts.
    delete holder[PROXY];
    throw cause;
  }
}

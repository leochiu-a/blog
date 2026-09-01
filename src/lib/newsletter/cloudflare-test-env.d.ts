/// <reference types="@cloudflare/vitest-pool-workers/types" />

/**
 * The migrations the D1 project hands to `applyD1Migrations`.
 *
 * Passed as a Miniflare binding by `vitest.config.mts`, so it has to appear on
 * the env type. It exists only under the `d1` test project; nothing deployed
 * ever sees it.
 */
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}

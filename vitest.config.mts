import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig, type ViteUserConfig } from "vitest/config";

/**
 * Two projects, split by what a test needs underneath it.
 *
 * Almost everything here is a pure function and runs in Node. The exception is
 * SQL: `subscribers.ts` is deliberately thin, so the only way to check that a
 * statement does what its comment claims is to run it against a real SQLite —
 * `*.d1.test.ts` files run inside workerd with a Miniflare-backed D1, migrated
 * from `migrations/` so the schema under test is the deployed one.
 *
 * `resolve.alias` sits here rather than inside each project on purpose: a
 * project that declares its own Vite-level options gets its own Vite server,
 * and every server transforms the shared `src/` tree again from scratch. The
 * `node` project has no other reason to want one, so it inherits this config
 * instead (`extends: true` — Vitest 4 does not inherit by default). The `d1`
 * project needs `cloudflareTest()` and so keeps a server either way.
 */
export default defineConfig(async (): Promise<ViteUserConfig> => {
  const migrations = await readD1Migrations(
    fileURLToPath(new URL("./migrations", import.meta.url)),
  );

  return {
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: "node",
            // Node stays the default: all but a handful of these tests are pure
            // functions, and a DOM they never touch is only startup cost.
            // Component tests opt in per file with `// @vitest-environment happy-dom`.
            environment: "node",
            include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
            exclude: ["src/**/*.d1.test.ts"],
          },
        },
        {
          extends: true,
          plugins: [
            cloudflareTest({
              // Bindings are declared here rather than read from
              // `wrangler.jsonc`, which points `main` at the OpenNext build
              // output — a file that only exists after a build and that these
              // tests have no use for.
              miniflare: {
                compatibilityDate: "2026-08-20",
                compatibilityFlags: ["nodejs_compat"],
                d1Databases: ["NEWSLETTER_DB"],
                bindings: { TEST_MIGRATIONS: migrations },
              },
            }),
          ],
          test: {
            name: "d1",
            include: ["src/**/*.d1.test.ts"],
          },
        },
      ],
    },
  };
});

import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

/**
 * Two projects, split by what a test needs underneath it.
 *
 * Almost everything here is a pure function and runs in Node. The exception is
 * SQL: `subscribers.ts` is deliberately thin, so the only way to check that a
 * statement does what its comment claims is to run it against a real SQLite —
 * `*.d1.test.ts` files run inside workerd with a Miniflare-backed D1, migrated
 * from `migrations/` so the schema under test is the deployed one.
 */
export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    fileURLToPath(new URL("./migrations", import.meta.url)),
  );

  return {
    test: {
      projects: [
        {
          resolve: { alias },
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
          resolve: { alias },
          test: {
            name: "d1",
            include: ["src/**/*.d1.test.ts"],
          },
        },
      ],
    },
  };
});

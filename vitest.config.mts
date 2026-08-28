import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Node stays the default: all but a handful of these tests are pure
    // functions, and a DOM they never touch is only startup cost. Component
    // tests opt in per file with `// @vitest-environment happy-dom`.
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});

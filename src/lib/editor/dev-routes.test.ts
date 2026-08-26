import { describe, expect, it } from "vitest";
import { pageExtensionsFor } from "./dev-routes";

describe("dev-only page extensions", () => {
  it("registers the .dev.* extensions during development", () => {
    expect(pageExtensionsFor("development")).toEqual(expect.arrayContaining(["dev.tsx", "dev.ts"]));
  });

  it.each(["production", "test", undefined])("leaves them out when NODE_ENV is %o", (env) => {
    const extensions = pageExtensionsFor(env);

    expect(extensions).not.toContain("dev.tsx");
    expect(extensions).not.toContain("dev.ts");
    expect(extensions).toEqual(expect.arrayContaining(["tsx", "ts", "md", "mdx"]));
  });
});

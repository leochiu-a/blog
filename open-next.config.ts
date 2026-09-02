import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const config = defineCloudflareConfig({
  // Every route here is prerendered at build time and only changes on a
  // redeploy, so the prerendered HTML can live in Workers Assets alongside the
  // rest of the static output. Without this the worker re-rendered each page on
  // every request — median CPU sat at ~28ms against the 10ms free-tier limit,
  // and sustained refreshes tripped "Exceeded CPU Time Limits".
  //
  // This override deliberately has no revalidation story: it only ever serves
  // what the build produced. That matches the site today; the day a route needs
  // on-demand revalidation, this has to become the R2 or KV cache instead.
  incrementalCache: staticAssetsIncrementalCache,
  // Answer cacheable routes early in the worker, before Next.js routing gets
  // involved. Safe here because nothing uses PPR.
  enableCacheInterception: true,
});

/**
 * How OpenNext builds the Next app.
 *
 * Without this it runs the package's own `build` script — which is the script
 * that calls `opennextjs-cloudflare build` — and the two call each other until
 * the machine gives up. Naming the Next build here is what lets `pnpm build`
 * mean "produce the thing wrangler.jsonc points at" rather than "produce
 * `.next/` and stop half way".
 *
 * `wrangler types` is not part of this: `postinstall` already runs it, so the
 * generated bindings are in place before any build starts.
 */
config.buildCommand = "next build";

export default config;

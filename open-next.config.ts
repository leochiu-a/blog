import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache override: every route is either static or rendered on
// demand, so there is nothing for R2 to hold yet.
export default defineCloudflareConfig({});

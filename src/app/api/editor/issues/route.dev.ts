import { createDocument } from "@/lib/editor/api";
import { issueStore } from "@/lib/editor/store";

// `.dev.ts` — registered as a route only while `next dev` is running.
// See src/lib/editor/dev-routes.ts.

export const POST = () => createDocument(issueStore);

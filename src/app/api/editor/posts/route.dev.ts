import { createPost } from "@/lib/editor/api";
import { postStore } from "@/lib/editor/store";

// `.dev.ts` — registered as a route only while `next dev` is running.
// See src/lib/editor/dev-routes.ts.

export const POST = (request: Request) => createPost(request, postStore);

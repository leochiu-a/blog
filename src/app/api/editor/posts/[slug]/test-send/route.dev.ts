import { handleTestSend } from "@/lib/editor/send-routes";

/**
 * `.dev.ts` — a route only while `next dev` is running. The behaviour, and why
 * that is the whole authorisation story, is in `src/lib/editor/send-routes.ts`.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handleTestSend("post", slug, request);
}

import { createLinkCard } from "@/lib/editor/api";
import { assetStore } from "@/lib/editor/store";
import { postAt, postDefaults } from "@/lib/post-at";

export const POST = (request: Request) => createLinkCard(request, assetStore);

/**
 * What a post on this site lends a card, for the editor to draw it with. It is
 * answered here rather than in the editor because reading the post collection
 * pulls every compiled post into the page that imports it, and saving the one
 * being edited would then refresh the editor.
 */
export function GET(request: Request) {
  const post = postAt(new URL(request.url).searchParams.get("href") ?? "");
  if (!post) return Response.json({ error: "Not a post on this site" }, { status: 404 });

  return Response.json({ href: post.href, ...postDefaults(post) });
}

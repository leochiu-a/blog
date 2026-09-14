import { createLinkCard } from "@/lib/editor/api";
import { assetStore } from "@/lib/editor/store";

export const POST = (request: Request) => createLinkCard(request, assetStore);

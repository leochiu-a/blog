import { uploadImage } from "@/lib/editor/api";
import { assetStore } from "@/lib/editor/store";

export const POST = (request: Request) => uploadImage(request, assetStore);

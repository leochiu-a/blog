import { uploadVideo } from "@/lib/editor/api";
import { assetStore } from "@/lib/editor/store";

export const POST = (request: Request) => uploadVideo(request, assetStore);

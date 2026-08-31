import { uploadVideo } from "@/lib/editor/api";
import { postStore } from "@/lib/editor/store";

export const POST = (request: Request) => uploadVideo(request, postStore);

import { uploadImage } from "@/lib/editor/api";
import { postStore } from "@/lib/editor/store";

export const POST = (request: Request) => uploadImage(request, postStore);

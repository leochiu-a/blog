import { deletePost, getPost, savePost } from "@/lib/editor/api";
import { postStore } from "@/lib/editor/store";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  return getPost((await params).slug, postStore);
}

export async function PUT(request: Request, { params }: Params) {
  return savePost((await params).slug, request, postStore);
}

export async function DELETE(_request: Request, { params }: Params) {
  return deletePost((await params).slug, postStore);
}

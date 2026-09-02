import { deleteDocument, getDocument, saveDocument } from "@/lib/editor/api";
import { issueStore } from "@/lib/editor/store";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  return getDocument((await params).slug, issueStore);
}

export async function PUT(request: Request, { params }: Params) {
  return saveDocument((await params).slug, request, issueStore);
}

export async function DELETE(_request: Request, { params }: Params) {
  return deleteDocument((await params).slug, issueStore);
}

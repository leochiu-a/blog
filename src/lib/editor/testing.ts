import type { PmNode, EditorDocument } from "./types";

/**
 * Drop the original-source attrs, so serialization has to go through the mdast
 * bridge rather than replaying the bytes it was handed. Shared by the tests
 * that need to prove the serializer, not the replay.
 */
export function forgetSource(document: EditorDocument): EditorDocument {
  const content = (document.doc.content ?? []).map((block) => {
    const { source: _source, ...attrs } = block.attrs ?? {};
    return { ...block, attrs: Object.keys(attrs).length > 0 ? attrs : undefined } as PmNode;
  });
  return { ...document, doc: { ...document.doc, content } };
}

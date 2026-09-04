"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";

type Props = {
  id?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
};

/**
 * Tags as chips rather than a comma-separated string, so a tag that contains a
 * comma or a stray space can't quietly split itself in two on the way to
 * frontmatter.
 *
 * Enter or comma commits what's typed; Backspace on an empty field takes the
 * last one back — the two gestures every tag field has.
 */
export function TagInput({ id, tags, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const commit = (value: string) => {
    const tag = value.trim();
    setDraft("");
    if (tag === "" || tags.includes(tag)) return;
    onChange([...tags, tag]);
  };

  const remove = (tag: string) => onChange(tags.filter((item) => item !== tag));

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      {tags.map((tag) => (
        // The remove control is a direct child of Badge, so Badge's own icon
        // sizing rule (`[&>svg]`) reaches the ✕ instead of stopping at a wrapper.
        <Badge
          key={tag}
          variant="secondary"
          className="cursor-pointer"
          onClick={() => remove(tag)}
          render={<button type="button" aria-label={`Remove ${tag}`} />}
        >
          {tag}
          <XIcon />
        </Badge>
      ))}

      <input
        id={id}
        value={draft}
        placeholder={tags.length === 0 ? "AI, 工程師職涯" : ""}
        onChange={(event) => {
          // Pasting "a, b, c" should land as three tags, not one.
          if (event.target.value.includes(",")) {
            const parts = event.target.value.split(",");
            parts.slice(0, -1).forEach(commit);
            setDraft(parts.at(-1)?.trimStart() ?? "");
            return;
          }
          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(draft);
            return;
          }
          if (event.key === "Backspace" && draft === "" && tags.length > 0) {
            event.preventDefault();
            remove(tags[tags.length - 1]!);
          }
        }}
        onBlur={() => commit(draft)}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

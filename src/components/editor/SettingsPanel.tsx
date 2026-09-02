"use client";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/post-frontmatter";
import { collectionOf, type CollectionName } from "@/lib/editor/collections";
import {
  readFlag,
  readList,
  readText,
  withField,
  without,
  type FrontmatterValues,
} from "@/lib/editor/frontmatter-fields";
import { TagInput } from "./TagInput";

type Props = {
  collection: CollectionName;
  frontmatter: FrontmatterValues;
  onChange: (next: FrontmatterValues) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
};

/**
 * Settings live here rather than in the writing surface, the way Medium and
 * Substack split "the story" from "everything about the story".
 *
 * Which fields there are is the collection's business: a Post is filed and
 * indexed — a category, tags, an image, a read time — while an Issue is a
 * letter, and the only thing it has that a Post does not is the subject line
 * the inbox shows.
 */
export function SettingsPanel({
  collection,
  frontmatter,
  onChange,
  open,
  onOpenChange,
  slug,
}: Props) {
  const { label: collectionLabel, previewBase, requiredKeys } = collectionOf(collection);

  const set = (key: string, value: unknown) => onChange(withField(frontmatter, key, value));
  const clear = (key: string) => onChange(without(frontmatter, key, requiredKeys));

  /** An emptied optional field is a removed key; a required one is only blanked. */
  const setText = (key: string, value: string) => (value === "" ? clear(key) : set(key, value));

  const text = (key: string, label: string, placeholder = "") => (
    <Field>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Input
        id={key}
        value={readText(frontmatter, key)}
        placeholder={placeholder}
        onChange={(event) => setText(key, event.target.value)}
      />
    </Field>
  );

  /**
   * The day, picked rather than typed. An Issue's `datetime` carries a time and
   * a UTC offset that nothing here should be rewriting, so whatever follows the
   * day is kept exactly as the file had it.
   */
  const date = (key: string, label: string) => {
    const current = readText(frontmatter, key);
    return (
      <Field>
        <FieldLabel htmlFor={key}>{label}</FieldLabel>
        <Input
          id={key}
          type="date"
          value={current.slice(0, 10)}
          onChange={(event) => {
            const day = event.target.value;
            setText(key, day === "" ? "" : `${day}${current.slice(10)}`);
          }}
        />
      </Field>
    );
  };

  const choice = (key: string, label: string, options: readonly string[]) => (
    <Field>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Select value={readText(frontmatter, key)} onValueChange={(value) => set(key, value)}>
        <SelectTrigger id={key}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[22rem] overflow-y-auto font-sans sm:max-w-none">
        <SheetHeader>
          <SheetTitle>{collectionLabel} settings</SheetTitle>
          <SheetDescription>
            {previewBase}/{slug}/
          </SheetDescription>
        </SheetHeader>

        <FieldGroup className="px-4 pb-6">
          <Field>
            <FieldLabel htmlFor="description">description</FieldLabel>
            <Textarea
              id="description"
              rows={4}
              value={readText(frontmatter, "description")}
              placeholder="SEO 描述"
              onChange={(event) => setText("description", event.target.value)}
            />
          </Field>

          {date("datetime", "datetime")}

          {collection === "posts" && (
            <>
              {text("readTime", "readTime", "5 min")}
              {choice("category", "category", CATEGORIES)}
              {text("ogImage", "ogImage", "/blog-images/…")}

              <Field>
                <FieldLabel htmlFor="tags">tags</FieldLabel>
                <TagInput
                  id="tags"
                  tags={readList(frontmatter, "tags")}
                  onChange={(next) => (next.length > 0 ? set("tags", next) : clear("tags"))}
                />
              </Field>

              <Field orientation="horizontal">
                <FieldLabel htmlFor="featured">featured</FieldLabel>
                <Switch
                  id="featured"
                  checked={readFlag(frontmatter, "featured")}
                  onCheckedChange={(checked) =>
                    checked ? set("featured", true) : clear("featured")
                  }
                />
              </Field>
            </>
          )}

          {/* Only when it should read differently from the title — empty means
              the subject is the title, which is what the send script does. */}
          {collection === "issues" && text("subject", "subject", "留空就用標題")}
        </FieldGroup>
      </SheetContent>
    </Sheet>
  );
}

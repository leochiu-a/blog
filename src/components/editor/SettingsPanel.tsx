"use client";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
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
import { seoTitle } from "@/lib/site";
import { collectionOf, type CollectionName } from "@/lib/editor/collections";
import {
  readFlag,
  readList,
  readText,
  withField,
  without,
  type FrontmatterValues,
} from "@/lib/editor/frontmatter-fields";
import { DateField } from "./DateField";
import { OgImageField } from "./OgImageField";
import { DraftLinkField } from "./DraftLinkField";
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
 * Grouping is carried by rhythm rather than by a rule: 16px between the fields
 * inside a section against 40px between sections. A full-width hairline is the
 * heaviest separator available for the smallest payload — it reads as a table
 * rule, and with near-equal gaps above and below it does not even group.
 */
const sectionGap = "pt-5";

/**
 * Settings live here rather than in the writing surface, the way Medium and
 * Substack split "the story" from "everything about the story".
 *
 * Which fields there are is the collection's business: a Post is filed and
 * indexed — a category, tags, an image, a read time — while an Issue is a
 * letter, and the only thing it has that a Post does not is the subject line
 * the inbox shows.
 *
 * The fields are grouped by the question they answer, because a flat column of
 * nine is a list you re-read every time: 發佈 is when it goes out, 分類 is where
 * it lands on the site, 搜尋與分享 is how it reads everywhere that is not the
 * site. The draft link stays above all three — it is fetched, not edited.
 */
export function SettingsPanel({
  collection,
  frontmatter,
  onChange,
  open,
  onOpenChange,
  slug,
}: Props) {
  const { itemLabel, previewBase, requiredKeys } = collectionOf(collection);

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
        <DateField
          id={key}
          value={current}
          onChange={(day) => set(key, `${day}${current.slice(10)}`)}
        />
      </Field>
    );
  };

  /** Section headers read as headers, not as one more field label. */
  const legend = (label: string) => (
    <FieldLegend
      variant="label"
      className="tracking-widest text-muted-foreground data-[variant=label]:text-xs"
    >
      {label}
    </FieldLegend>
  );

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
      <SheetContent side="right" className="overflow-y-auto font-sans data-[side=right]:w-[28rem] data-[side=right]:sm:max-w-none">
        <SheetHeader>
          <SheetTitle>{itemLabel} settings</SheetTitle>
          <SheetDescription>
            {previewBase}/{slug}/
          </SheetDescription>
        </SheetHeader>

        <FieldGroup className="px-4 pb-6">
          {/* First, because it is the one thing here you open the panel to
              fetch rather than to edit — and it is gone once published. */}
          <DraftLinkField collection={collection} slug={slug} frontmatter={frontmatter} />

          <FieldSet>
            {legend("發佈")}
            {date("datetime", "datetime")}
            {/* Only when it should read differently from the title — empty means
                the subject is the title, which is what the send script does. */}
            {collection === "issues" && text("subject", "subject", "留空就用標題")}
          </FieldSet>

          {collection === "posts" && (
            <FieldSet className={sectionGap}>
              {legend("分類")}
              {choice("category", "category", CATEGORIES)}

              <Field>
                <FieldLabel htmlFor="tags">tags</FieldLabel>
                <TagInput
                  id="tags"
                  tags={readList(frontmatter, "tags")}
                  onChange={(next) => (next.length > 0 ? set("tags", next) : clear("tags"))}
                />
              </Field>

              {text("readTime", "readTime", "5 min")}

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
            </FieldSet>
          )}

          <FieldSet className={sectionGap}>
            {legend("搜尋與分享")}

            {/* Read-only: the title is written in the document itself, and the
                suffix is derived (see `seoTitle`). Shown here because this line
                — not the bare title — is what a search result and an OG card
                actually display, and it is otherwise invisible until publish. */}
            <Field>
              <FieldLabel>SEO title</FieldLabel>
              <p className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm wrap-break-word">
                {seoTitle(readText(frontmatter, "title"))}
              </p>
              <FieldDescription>
                搜尋結果與 OG 卡片顯示的標題，接在文件標題後自動補上站名。
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="description">SEO description</FieldLabel>
              <Textarea
                id="description"
                rows={4}
                value={readText(frontmatter, "description")}
                placeholder="SEO 描述"
                onChange={(event) => setText("description", event.target.value)}
              />
            </Field>

            {collection === "posts" && (
              <OgImageField
                value={readText(frontmatter, "ogImage")}
                onChange={(next) => setText("ogImage", next)}
              />
            )}
          </FieldSet>
        </FieldGroup>
      </SheetContent>
    </Sheet>
  );
}

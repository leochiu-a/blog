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
  frontmatter: FrontmatterValues;
  onChange: (next: FrontmatterValues) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
};

/**
 * Post settings live here rather than in the writing surface, the way Medium
 * and Substack split "the story" from "everything about the story".
 */
export function SettingsPanel({ frontmatter, onChange, open, onOpenChange, slug }: Props) {
  const set = (key: string, value: unknown) => onChange(withField(frontmatter, key, value));
  const clear = (key: string) => onChange(without(frontmatter, key));

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
          <SheetTitle>Post settings</SheetTitle>
          <SheetDescription>/blog/{slug}/</SheetDescription>
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

          {text("datetime", "datetime", "2026-01-01")}
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
              onCheckedChange={(checked) => (checked ? set("featured", true) : clear("featured"))}
            />
          </Field>
        </FieldGroup>
      </SheetContent>
    </Sheet>
  );
}

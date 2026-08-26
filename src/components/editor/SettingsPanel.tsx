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
import { TagInput } from "./TagInput";

type Frontmatter = Record<string, unknown>;

type Props = {
  frontmatter: Frontmatter;
  onChange: (next: Frontmatter) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
};

const FONTS = ["garamond", "newsreader"] as const;
const CATEGORIES = ["professional", "personal"] as const;

const asString = (value: unknown) => (typeof value === "string" ? value : "");

/**
 * Post settings live here rather than in the writing surface, the way Medium
 * and Substack split "the story" from "everything about the story".
 */
export function SettingsPanel({ frontmatter, onChange, open, onOpenChange, slug }: Props) {
  const set = (key: string, value: unknown) => {
    const next = { ...frontmatter };
    if (value === "" || value === false) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const tags = Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]) : [];

  const text = (key: string, label: string, placeholder = "") => (
    <Field>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Input
        id={key}
        value={asString(frontmatter[key])}
        placeholder={placeholder}
        onChange={(event) => set(key, event.target.value)}
      />
    </Field>
  );

  const choice = (key: string, label: string, options: readonly string[]) => (
    <Field>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Select value={asString(frontmatter[key])} onValueChange={(value) => set(key, value)}>
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
              value={asString(frontmatter.description)}
              placeholder="SEO 描述"
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>

          {text("datetime", "datetime", "2026-01-01")}
          {text("readTime", "readTime", "5 min")}
          {choice("font", "font", FONTS)}
          {choice("category", "category", CATEGORIES)}
          {text("ogImage", "ogImage", "/blog-images/…")}

          <Field>
            <FieldLabel htmlFor="tags">tags</FieldLabel>
            <TagInput
              id="tags"
              tags={tags}
              onChange={(next) => set("tags", next.length > 0 ? next : "")}
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="featured">featured</FieldLabel>
            <Switch
              id="featured"
              checked={frontmatter.featured === true}
              onCheckedChange={(checked) => set("featured", checked)}
            />
          </Field>
        </FieldGroup>
      </SheetContent>
    </Sheet>
  );
}

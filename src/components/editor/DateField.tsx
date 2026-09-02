"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * The day part of a frontmatter date, picked from a calendar.
 *
 * The button shows the day exactly as the file holds it rather than in a
 * display format: this is a field over a text file, and what you see is what
 * `datetime:` will say.
 */

/** `YYYY-MM-DD…` as a local Date — anything else is a date we cannot show. */
function toDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Local, not `toISOString`: a day picked east of UTC serializes to the day
 * before, which is how a post silently moves to yesterday.
 */
function toDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DateField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (day: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className="w-full justify-between px-2.5 font-normal text-foreground"
          />
        }
      >
        {selected ? toDay(selected) : "選一個日期"}
        <CalendarIcon className="size-4 opacity-60" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(toDay(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

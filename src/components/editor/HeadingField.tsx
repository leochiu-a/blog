"use client";

import { useLayoutEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  placeholder: string;
  className: string;
};

/**
 * The title and subtitle, which are frontmatter but are edited in place at the
 * top of the post the way Medium and Substack do it.
 *
 * A textarea rather than an input, so a long title wraps and grows instead of
 * scrolling out of sight — it has to break the same way the `<h1>` does on the
 * published page. Enter moves on to the body rather than inserting a newline,
 * since neither field can hold one.
 */
export function HeadingField({ value, onChange, onEnter, placeholder, className }: Props) {
  const field = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = field.current;
    // Measure only once the DOM reflects the text we were handed; releasing
    // the height first is what makes scrollHeight report the wrapped size.
    if (element?.value !== value) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={field}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        onEnter();
      }}
      className={`w-full resize-none overflow-hidden bg-transparent outline-none ${className}`}
    />
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorDocument } from "@/lib/editor/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Writes the post back to disk a beat after typing stops. The delay is what
 * keeps `next dev` from recompiling the content collection on every keystroke.
 */
const DELAY_MS = 800;

export function useAutosave(save: (document: EditorDocument) => Promise<void>) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<EditorDocument | null>(null);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(async () => {
    const value = pending.current;
    if (value === null) return;
    pending.current = null;
    setStatus("saving");
    try {
      await saveRef.current(value);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  const schedule = useCallback(
    (value: EditorDocument) => {
      pending.current = value;
      setStatus("idle");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DELAY_MS);
    },
    [flush],
  );

  useEffect(() => {
    const onLeave = () => {
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      onLeave();
    };
  }, [flush]);

  return { status, schedule };
}

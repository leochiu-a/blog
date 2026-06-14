"use client";

import { useEffect } from "react";
import type { Mode } from "@/types/content";

export function ThemeSync({ mode }: { mode: Mode }) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "professional");
  }, [mode]);
  return null;
}

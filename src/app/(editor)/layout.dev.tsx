// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
// eslint-disable-next-line import/no-unassigned-import
import "@/components/editor/editor.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

/**
 * Root layout for the dev-only post editor. The whole `(editor)` group is
 * named `*.dev.tsx`, so it only exists while `next dev` is running — a
 * production build never resolves these files as routes.
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={fontVariables}>
      {/* No font utility here: globals.css sets `font-family` on `body` as
          unlayered CSS, which beats any Tailwind utility class regardless of
          specificity. The editor's own chrome asks for `font-sans` further
          down, where a class does win. */}
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}

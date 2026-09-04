// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { UfoAbduction } from "@/components/UfoAbduction";
import { fontVariables } from "@/lib/fonts";

/* `global-not-found` rather than `not-found`: every route here lives in a group
   with its own root layout ((home), (blog), (editor)), so there is no single
   layout a shared 404 could render inside. This file is the whole document —
   Next skips rendering the app for an unmatched URL — which is why it imports
   the stylesheet and fonts itself. */
export const metadata: Metadata = {
  title: "404 — Leo Chiu",
  description: "This page has been abducted.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-svh flex-col items-center justify-center bg-background font-garamond antialiased">
        <UfoAbduction />
      </body>
    </html>
  );
}

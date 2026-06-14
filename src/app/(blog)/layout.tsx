// eslint-disable-next-line import/no-unassigned-import
import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Leo Chiu",
  description: "Frontend engineer & developer",
  icons: {
    icon: "/seo/icon.svg",
    apple: "/seo/apple-touch-icon.png",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  // Blog pages use the light theme (no `dark` class on <html>).
  return (
    <html lang="en" className={fontVariables} data-scroll-behavior="smooth">
      <body className="flex justify-center bg-background scroll-smooth font-garamond antialiased">
        {children}
      </body>
    </html>
  );
}

import "@/styles/globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Home • Leo Chiu",
  description: "Frontend engineer & developer",
  icons: {
    icon: "/seo/icon.svg",
    apple: "/seo/apple-touch-icon.png",
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  // Homepage defaults to the dark theme (professional mode); PortfolioApp
  // toggles `.dark` on <html> client-side when switching to personal mode.
  return (
    <html lang="en" className={`dark ${fontVariables}`} data-scroll-behavior="smooth">
      <body className="flex justify-center bg-background scroll-smooth font-garamond antialiased">
        {children}
      </body>
    </html>
  );
}

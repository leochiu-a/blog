import type { Metadata } from "next";
import { HomeScreen } from "@/components/HomeScreen";
import { pathForMode, titleForMode } from "@/lib/mode-routes";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: titleForMode("professional"),
  alternates: {
    canonical: `${SITE_URL}${pathForMode("professional")}`,
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function Home() {
  return <HomeScreen mode="professional" />;
}

import type { Metadata } from "next";
import { HomeScreen } from "@/components/HomeScreen";
import { pathForMode, titleForMode } from "@/lib/mode-routes";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: titleForMode("personal"),
  alternates: {
    canonical: `${SITE_URL}${pathForMode("personal")}`,
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function Personal() {
  return <HomeScreen mode="personal" />;
}

import { issues } from "@/lib/issues";
import { posts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

/** Escape the handful of characters that break well-formed XML. */
function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  // Posts and Issues are separate collections but one publication, so the feed
  // interleaves them by date. A `<category>` tells a reader which is which
  // without having to guess from the URL.
  const entries = [
    ...posts.map((post) => ({ ...post, category: "Blog" })),
    ...issues.map((issue) => ({ ...issue, category: "Newsletter" })),
  ].sort((a, b) => b.datetime.localeCompare(a.datetime));

  const items = entries
    .map((entry) => {
      const url = `${SITE_URL}${entry.href}`;
      const pubDate = new Date(entry.datetime).toUTCString();
      return `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <category>${entry.category}</category>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(entry.subtitle ?? entry.title)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Leo Chiu</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Frontend engineer &amp; developer</description>
    <language>zh-TW</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

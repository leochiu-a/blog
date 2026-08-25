// Renders structured data as a native <script> tag, per Next.js's own
// recommendation (see `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`).
// `<` is escaped to its unicode equivalent since `JSON.stringify` alone
// doesn't sanitize against XSS injection.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

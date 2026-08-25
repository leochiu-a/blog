// Override with NEXT_PUBLIC_SITE_URL in the deploy environment if the
// domain ever changes — no code change needed.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://leochiu.com"
).replace(/\/$/, "");

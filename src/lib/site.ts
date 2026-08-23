// TODO: replace with the real production domain once it's decided, or set
// NEXT_PUBLIC_SITE_URL in the deploy environment — no code change needed.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://leochiu.dev").replace(
  /\/$/,
  "",
);

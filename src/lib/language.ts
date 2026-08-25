const CJK_PATTERN = /[一-鿿]/;

/**
 * Every post so far is written in Traditional Chinese; detecting CJK in the
 * title (rather than hardcoding "zh-Hant") keeps `<html lang>` and each
 * post's `BlogPosting.inLanguage` correct automatically if an English post
 * shows up later.
 */
export function detectPostLanguage(title: string): "zh-Hant" | "en" {
  return CJK_PATTERN.test(title) ? "zh-Hant" : "en";
}

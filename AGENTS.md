<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Writing posts

Conventions for `src/content/blog/*.md` and `src/content/newsletter/*.md`:

- `>` is an ordinary quote; `>>` is a **pull quote**, rendered by `FancyQuote`. The nested blockquote is the deliberate syntax for it — see `Blockquote` in `src/mdx-components.tsx` — because a markdown editor still previews it as a quote, where a bare JSX tag shows as markup. Never "correct" a `>>` to a single `>`.
- Link to another page of this site with a root-relative path (`/blog/<slug>/`), never the full `https://leochiu.com/...` URL. `rehype-external-links` in `next.config.ts` splits internal from external on "has a protocol", so an absolute self-link opens in a new tab and loses the client-side router and the back button.
- Tag every opening code fence with a language. Highlighting is resolved at build time by `rehype-pretty-code`, and an untagged block ships unhighlighted. Use `text` for ASCII diagrams and terminal trees.
- Give every post its own `ogImage`. Without one it falls back to `DEFAULT_OG_IMAGE`, the site's generic social card, for both the unfurl and schema.org `image`.

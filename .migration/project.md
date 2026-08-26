# project

2026-08-26 — whole-project Radix → Base UI, golden pair via the shadcn CLI. Clean.

## Changed

- `components.json:3` — style `radix-nova` → `base-nova`. Flipped before regenerating, so every `shadcn add` resolved the base variant.
- `src/components/ui/*.tsx` — all 14 wrappers regenerated from the base registry. Every one was pristine (never hand-edited), so the golden pair applied with no diff to replay. `button.tsx` now wraps the real `@base-ui/react/button` primitive; `badge.tsx` uses `useRender` + `mergeProps`.
- `package.json` — `@base-ui/react@1.7.0` added, `radix-ui@1.6.7` removed. pnpm lockfile updated.
- Consumers, 7 `asChild` → `render`:
  - `src/components/editor/PostEditor.tsx:133,146` — link buttons, plus `nativeButton={false}`
  - `src/app/(editor)/editor/page.dev.tsx:76` — same
  - `src/components/editor/NewPostButton.tsx:72` — `PopoverTrigger render={<Button/>}`
  - `src/components/editor/InsertMenu.tsx:102` — same, `aria-label` moved onto the trigger
  - `src/components/editor/PublishButton.tsx:43` — `AlertDialogTrigger render={<Button/>}`
  - `src/components/editor/TagInput.tsx:38` — `Badge render={<button aria-label=…/>}`; the label sits on the rendered element so the a11y lint can see it

Leftover scan clean: `grep -rn "radix-ui\|@radix-ui\|asChild" src/` returns nothing.

## Left alone

- `src/styles/globals.css` — untouched by this run. Its HSL-channel tokens and the `@layer base { * { border-color } }` rule are shared by both bases.
- `src/lib/editor/**`, the mdast bridge and its 133 tests — no UI dependency.

## Behavior changes

- Base UI's `Button` warns when `render` produces a non-`<button>`. The three link buttons now declare `nativeButton={false}`; they render `<a>` as before.
- Base UI overlays (Popover, Sheet, AlertDialog) mount through Portal → Positioner → Popup rather than Radix's Portal → Content. Positioning props live on the positioner now; nothing in this project sets them.

## Verify by hand

1. `/editor/<slug>` — Settings sheet opens, focus lands inside, Esc closes and focus returns to the Settings button.
2. Publish → AlertDialog: Tab reaches 取消/發佈, Esc cancels, 確認 writes the file.
3. `+` insert menu and New post popover: open on click, close on outside click and Esc.
4. Select (font / category): keyboard up/down and typeahead pick a value.
5. Tag chips: click ✕ removes; the button is reachable by keyboard.

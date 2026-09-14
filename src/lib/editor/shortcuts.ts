/**
 * What the bubble toolbar advertises on hover, spelled the way Tiptap spells a
 * binding — the same string the keymap registers, so a test can hold the two
 * against each other.
 *
 * The claim is worth guarding because half of it is ours. `Mod-Alt-1` and
 * `Mod-Alt-2` are not Tiptap's heading keys: the run is shifted by one in
 * `extensions.ts`, to spend the easiest key on an h2 rather than on an h1 no
 * post has. Move that offset without touching this table and the toolbar goes
 * on naming a key that now does something else, which nothing would report.
 */
export const toolbarShortcuts = {
  bold: "Mod-b",
  italic: "Mod-i",
  strikethrough: "Mod-Shift-s",
  code: "Mod-e",
  "heading 2": "Mod-Alt-1",
  "heading 3": "Mod-Alt-2",
  quote: "Mod-Shift-b",
} as const;

const onAMac: Record<string, string> = { Mod: "⌘", Alt: "⌥", Shift: "⇧", Ctrl: "⌃" };
const anywhereElse: Record<string, string> = {
  Mod: "Ctrl",
  Alt: "Alt",
  Shift: "Shift",
  Ctrl: "Ctrl",
};

/**
 * The binding as keycaps. A Mac writes ⌘⌥⇧; everywhere else spells the same
 * keys out, so which one to draw has to be read off the machine — a Ctrl user
 * shown ⌘ is being told to press a key their keyboard does not have.
 *
 * Derived from the binding rather than typed out beside it: two copies of a
 * shortcut is how a toolbar starts lying about which key does the job.
 */
export function shortcutKeys(binding: string, onMac: boolean): string[] {
  const named = onMac ? onAMac : anywhereElse;
  return binding.split("-").map((part) => named[part] ?? part.toUpperCase());
}

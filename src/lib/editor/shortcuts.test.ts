import { getExtensionField, resolveExtensions } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { extensions } from "./extensions";
import { shortcutKeys, toolbarShortcuts } from "./shortcuts";

/**
 * Every key the editor actually binds, collected the way Tiptap collects them
 * when it builds its keymap plugins. The bound methods are never called — only
 * their keys are read — so a bare context is enough to ask an extension what
 * it listens for.
 */
const bound = new Set(
  resolveExtensions(extensions).flatMap((extension) => {
    const shortcuts = getExtensionField<() => Record<string, unknown>>(
      extension,
      "addKeyboardShortcuts",
      { name: extension.name, options: extension.options, storage: {}, editor: {}, type: null },
    );
    return shortcuts ? Object.keys(shortcuts()).map((key) => key.toLowerCase()) : [];
  }),
);

describe("the shortcuts the toolbar advertises", () => {
  it.each(Object.entries(toolbarShortcuts))("%s is a key the editor binds", (_label, binding) => {
    expect(bound).toContain(binding.toLowerCase());
  });

  it("names the headings the editor's own levels, not Tiptap's", () => {
    // The offset that makes this worth testing: h2 sits on the 1 key.
    expect(toolbarShortcuts["heading 2"]).toBe("Mod-Alt-1");
    expect(toolbarShortcuts["heading 3"]).toBe("Mod-Alt-2");
  });
});

describe("keycaps", () => {
  it("draws the Mac glyphs", () => {
    expect(shortcutKeys("Mod-Shift-s", true)).toEqual(["⌘", "⇧", "S"]);
    expect(shortcutKeys("Mod-Alt-1", true)).toEqual(["⌘", "⌥", "1"]);
  });

  it("spells the keys out everywhere else", () => {
    expect(shortcutKeys("Mod-Shift-s", false)).toEqual(["Ctrl", "Shift", "S"]);
    expect(shortcutKeys("Mod-Alt-1", false)).toEqual(["Ctrl", "Alt", "1"]);
  });
});

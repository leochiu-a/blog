import { Extension } from "@tiptap/core";
import type { Node as PmSchemaNode } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import type { MdxAttribute } from "./types";

/**
 * The attribute marking the one image above the fold. Bare — it carries no
 * value, and the published `Figure` reads its mere presence as `true`.
 */
export const HERO_ATTRIBUTE = "hero";

/**
 * Whether a block can be the post's hero.
 *
 * `Figure` only: `hero` turns into eager loading at high priority on an
 * `<Image>`, and `Clip` renders a `<video>`, which has no such lever.
 */
export function supportsHero(name: string | null): boolean {
  return name === "Figure";
}

function carriesHero(node: PmSchemaNode): boolean {
  const attributes = (node.attrs.attributes as MdxAttribute[] | null) ?? [];
  return attributes.some((attribute) => attribute.name === HERO_ATTRIBUTE);
}

/** Where the blocks claiming to be the hero sit, in document order. */
export function heroPositions(doc: PmSchemaNode): number[] {
  const found: number[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "mdxLeaf" && carriesHero(node)) found.push(pos);
  });
  return found;
}

/**
 * A post has one hero, however the second one arrived.
 *
 * The toggle enforces that for the gesture it owns — turning the hero on takes
 * the mark off whichever Figure held it, in the same transaction. Pasting goes
 * around it: a copied `<Figure … hero />` brings the attribute along, so a
 * writer who duplicated their hero image ended up with two, and the browser
 * was told to fetch both eagerly at high priority — which prioritises neither.
 *
 * The incumbent keeps the mark and the newcomers lose it, because the writer
 * said which picture the post is by pressing the toggle, and pasting a copy of
 * it is not them saying so again. Its position is mapped through the
 * transactions rather than looked up again, so a paste above the hero doesn't
 * hand the mark to the copy on its way past. With no incumbent — a paste into
 * an empty post, both heroes arriving at once — the first one in the document
 * wins, which is the one nearest the top of the page.
 *
 * Nothing here touches `ogImage`: the toggle points the share card at the hero
 * when a writer names one, and silently losing a duplicate's mark is not that
 * claim being made.
 */
export const soleHeroPlugin = new Plugin({
  appendTransaction: (transactions, oldState, newState) => {
    if (!transactions.some((transaction) => transaction.docChanged)) return null;

    const heroes = heroPositions(newState.doc);
    if (heroes.length < 2) return null;

    let incumbent = heroPositions(oldState.doc)[0];
    for (const transaction of transactions) {
      if (incumbent === undefined) break;
      incumbent = transaction.mapping.map(incumbent);
    }
    const kept = incumbent !== undefined && heroes.includes(incumbent) ? incumbent : heroes[0]!;

    const tr = newState.tr;
    for (const position of heroes) {
      if (position === kept) continue;
      const node = newState.doc.nodeAt(position);
      if (node === null) continue;
      tr.setNodeAttribute(
        position,
        "attributes",
        ((node.attrs.attributes as MdxAttribute[] | null) ?? []).filter(
          (attribute) => attribute.name !== HERO_ATTRIBUTE,
        ),
      );
    }

    return tr.steps.length > 0 ? tr : null;
  },
});

export const SoleHero = Extension.create({
  name: "soleHero",
  addProseMirrorPlugins: () => [soleHeroPlugin],
});

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from "react";
import { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { shortcutKeys, toolbarShortcuts } from "@/lib/editor/shortcuts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  TextQuoteIcon,
} from "lucide-react";

/**
 * Which machine this is, for `shortcutKeys` to spell the modifiers for.
 *
 * The keyboard is an external store, not state: `useSyncExternalStore` is what
 * lets the server render the non-Mac spelling and the browser correct it in
 * the same pass, instead of hydrating one and then re-rendering the other.
 */
const subscribeToNothing = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const notMac = () => false;

/**
 * Lucide draws a heading as a capital H with a subscript numeral, so at the
 * row's 16px box the letter itself lands well under the cap height of B, I and
 * S and reads as a smaller button. Two more pixels of box put the H back on
 * the same line as the letters it sits beside; the explicit `size-` also opts
 * the icon out of the button's own sizing rule, which only fills in a size for
 * icons that do not bring one.
 *
 * The stroke thins to pay for those pixels. A lucide stroke is drawn in a
 * 24-unit space and scales with the box, so a wider box is also a heavier
 * line — which does not read as a bigger icon, it reads as a darker one.
 * 2 × 16/24 is the 1.33px line the rest of the row draws; 1.78 × 18/24 is the
 * same 1.33px, now spread across the larger letter.
 */
const HeadingIcon = (Icon: typeof Heading2Icon) => () => (
  <Icon className="size-[1.125rem]" strokeWidth={1.78} />
);

const Heading2 = HeadingIcon(Heading2Icon);
const Heading3 = HeadingIcon(Heading3Icon);

/**
 * The only chrome that appears while writing: a Medium-style toolbar that
 * shows up on a selection and disappears the moment it collapses.
 */
export function BubbleToolbar({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState("");
  const linkField = useRef<HTMLInputElement>(null);

  // Focus follows the control the user just opened.
  useEffect(() => {
    if (linking) linkField.current?.focus();
  }, [linking]);

  const onMac = useSyncExternalStore(subscribeToNothing, isMac, notMac);

  /**
   * The toolbar fades up as it arrives, and sinks back out as it goes.
   *
   * Neither can be a CSS keyframe on the element: Tiptap detaches the toolbar
   * on hide and re-attaches the same node on show, both inside one task, and
   * the style engine never sees it leave — so a keyframe runs once, on the
   * first selection of the session, and never again. Driving both ends from
   * the plugin's own callbacks is what makes every selection look like the
   * first one.
   *
   * The entrance also earns its keep. Floating UI computes the position a tick
   * after the node is back in the document, so the first frame lands wherever
   * the previous selection left it. Coming up from transparent covers that.
   */
  const bar = useRef<HTMLDivElement>(null);
  // Where Tiptap parks the toolbar, remembered while it is still attached —
  // the exit has to put it back, and by then `parentElement` is already null.
  const home = useRef<HTMLElement | null>(null);
  const leaving = useRef<Animation | null>(null);

  const motion = useMemo(() => {
    const stilled = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return {
      onShow: () => {
        // A selection that comes back mid-exit keeps the node it is already
        // looking at: cancelling stops the fade and leaves the element in the
        // document, where `show` has just put it.
        leaving.current?.cancel();
        const el = bar.current;
        if (!el) return;
        home.current = el.parentElement;
        if (stilled()) return;
        el.animate(
          [
            { opacity: 0, transform: "translateY(4px) scale(0.97)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 120, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        );
      },

      /**
       * By the time this runs the node is gone — `hide` removes it and then
       * says so. Putting it back for the length of the fade is the only way to
       * animate an exit the plugin does not itself wait for; the animation
       * takes it out again when it lands.
       *
       * Quicker than the entrance, and it drops rather than rises: leaving
       * should read as the toolbar getting out of the way, not as a second
       * arrival played backwards.
       */
      onHide: () => {
        const el = bar.current;
        const parent = home.current;
        if (!el || !parent?.isConnected || stilled()) return;

        el.style.visibility = "visible";
        el.style.opacity = "1";
        parent.appendChild(el);

        const out = el.animate(
          [
            { opacity: 1, transform: "none" },
            { opacity: 0, transform: "translateY(2px) scale(0.98)" },
          ],
          { duration: 90, easing: "ease-in" },
        );
        leaving.current = out;
        out.onfinish = () => {
          if (leaving.current !== out) return;
          leaving.current = null;
          el.remove();
        };
        out.oncancel = () => {
          if (leaving.current === out) leaving.current = null;
        };
      },
    };
  }, []);

  const surface =
    "flex items-center gap-0.5 rounded-md border bg-popover p-1 text-popover-foreground shadow-md";

  /**
   * The URL is typed into the toolbar rather than a `window.prompt`: browsers
   * suppress native dialogs in enough contexts that the button would silently
   * do nothing. ProseMirror keeps the selection while the input has focus, so
   * the chain still applies to the text that was highlighted.
   */
  if (linking) {
    const apply = () => {
      setLinking(false);
      if (href.trim() === "") editor.chain().focus().unsetLink().run();
      else editor.chain().focus().setLink({ href: href.trim() }).run();
    };

    return (
      <BubbleMenu ref={bar} editor={editor} className={surface} options={motion}>
        <Input
          ref={linkField}
          value={href}
          placeholder="https://…"
          onChange={(event) => setHref(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
            if (event.key === "Escape") setLinking(false);
          }}
          className="w-56 border-0 shadow-none focus-visible:ring-0"
        />
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(event) => event.preventDefault()}
          onClick={apply}
        >
          {href.trim() === "" ? "remove" : "apply"}
        </Button>
      </BubbleMenu>
    );
  }

  /**
   * The icon says what the button does; the tooltip says how to do it without
   * the button. A writer who has to reach for the mouse to reach the toolbar
   * never learns the key that would have saved the trip, so the shortcut is
   * shown where the reaching already happens.
   */
  const action = (
    label: string,
    binding: string | null,
    Icon: ComponentType,
    active: boolean,
    run: () => void,
  ) => (
    <Tooltip key={label}>
      <TooltipTrigger
        render={
          <Button
            variant={active ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={run}
          >
            <Icon />
          </Button>
        }
      />
      {/* Measured from the button, which sits inside the toolbar's own padding
          and border — so the default offset would land the hint on the edge it
          is supposed to float above. Clearing that padding is what puts air
          between the two surfaces instead of stacking them. */}
      <TooltipContent sideOffset={8}>
        {label}
        {binding && (
          <KbdGroup>
            {shortcutKeys(binding, onMac).map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <BubbleMenu
      ref={bar}
      editor={editor}
      className={surface}
      options={motion}
      // A selected image or clip is a node selection, which spans a position
      // and so reads as a range — but bold and H2 have nothing to say about a
      // picture, and the toolbar only covered it up.
      shouldShow={({ editor: instance, state, from, to }) =>
        from !== to &&
        !(state.selection instanceof NodeSelection) &&
        !instance.isActive("codeBlock") &&
        !instance.isActive("unknownBlock")
      }
    >
      {/* One provider for the row: the first hint waits, and moving along the
          row after that opens the next one at once, the way a toolbar the
          writer is already scanning should behave. */}
      <TooltipProvider delay={500} closeDelay={100}>
        {action("bold", toolbarShortcuts.bold, BoldIcon, editor.isActive("bold"), () =>
          editor.chain().focus().toggleBold().run(),
        )}
        {action("italic", toolbarShortcuts.italic, ItalicIcon, editor.isActive("italic"), () =>
          editor.chain().focus().toggleItalic().run(),
        )}
        {action(
          "strikethrough",
          toolbarShortcuts.strikethrough,
          StrikethroughIcon,
          editor.isActive("strike"),
          () => editor.chain().focus().toggleStrike().run(),
        )}
        {action("code", toolbarShortcuts.code, CodeIcon, editor.isActive("code"), () =>
          editor.chain().focus().toggleCode().run(),
        )}
        {action("link", null, LinkIcon, editor.isActive("link"), () => {
          setHref((editor.getAttributes("link").href as string | undefined) ?? "");
          setLinking(true);
        })}

        <Separator orientation="vertical" className="mx-1 h-5" />

        {action(
          "heading 2",
          toolbarShortcuts["heading 2"],
          Heading2,
          editor.isActive("heading", { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        )}
        {action(
          "heading 3",
          toolbarShortcuts["heading 3"],
          Heading3,
          editor.isActive("heading", { level: 3 }),
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        )}
        {action("quote", toolbarShortcuts.quote, TextQuoteIcon, editor.isActive("blockquote"), () =>
          editor.chain().focus().toggleBlockquote().run(),
        )}
      </TooltipProvider>
    </BubbleMenu>
  );
}

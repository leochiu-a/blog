import Image from "next/image";
import Link from "next/link";
import { postAt } from "@/lib/post-at";

interface LinkCardProps {
  /**
   * Where the card points. A site-relative path (`/blog/<slug>/`) is read out
   * of the post collection; anything else was read off the page once, at
   * insert time, and is carried in the attributes below.
   */
  href: string;
  title?: string;
  /** The page's own summary. Omitted when it offers none. */
  description?: string;
  /** The publication's name, or its hostname — whichever the page gave up. */
  site?: string;
  /**
   * The share image, already copied into this repository by the editor. A card
   * without one is a card, not a broken one: the thumbnail column is dropped
   * and the text takes the full width.
   */
  image?: string;
}

/**
 * A link to something worth stopping for, shown as a card rather than as a
 * phrase in a sentence.
 *
 * The picture sits on the right, which is where Ghost's bookmark card, Notion's
 * bookmark block and a Slack unfurl all put it, and the opposite of where a
 * feed card (X's `summary`, Substack's Small) does. The difference is the
 * setting: in a feed every item is its own thing, but here the card interrupts
 * a column of prose, and text on the left keeps the reader's eye on the margin
 * it has been following. It also means the card degrades along its own grain —
 * lose the picture and the text is already where it belongs.
 *
 * Deliberately not the other common shape, a banner image above the title.
 * That one is built to win attention in a feed it is competing in; dropped into
 * an article it takes a screenful to say what this says in four lines.
 */
export function LinkCard({ href, title, description, site, image }: LinkCardProps) {
  const post = postAt(href);
  // Whether the link leaves the site, which is a question about the href
  // itself — not about whether a post was found behind it. A card left
  // pointing at a renamed post still points into this site, and sending the
  // reader to its 404 in a second tab would be the wrong kind of wrong.
  const internal = href.startsWith("/");

  // A post on this site is read from the collection every time the page is
  // built, so retitling it updates every card pointing at it. Attributes still
  // win where they are written: the card is where a link is introduced, and a
  // writer who shortened a long title for one sentence meant it.
  const card = {
    title: title ?? post?.title ?? "",
    description: description ?? post?.description ?? post?.subtitle,
    // Its own date and length, rather than this site's name repeated under
    // every card — the reader already knows where they are.
    site: site ?? (post ? `${post.date} · ${post.readTime}` : undefined),
    image: image ?? post?.ogImage,
  };

  const content = (
    <>
      {/* `min-w-0` so a long unbroken title truncates instead of pushing the
          thumbnail off the card — a flex item's default floor is its content. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
        <span className="line-clamp-2 font-sans font-medium leading-snug text-foreground">
          {card.title}
        </span>
        {card.description && (
          // Gone on a phone, the way Ghost's bookmark card drops it. Two lines
          // of summary wrap to four or five in a 375px column, and the card's
          // height is what decides the thumbnail's crop: left in, it turns the
          // 1.91:1 banner beside it into a portrait sliver. The title and the
          // site are what the reader is deciding on anyway.
          <span className="hidden font-sans text-sm leading-relaxed text-muted-foreground sm:line-clamp-2">
            {card.description}
          </span>
        )}
        {card.site && (
          <span className="mt-1 font-sans text-xs text-muted-foreground">{card.site}</span>
        )}
      </div>

      {card.image && (
        // Fixed, so every card on a page lines up regardless of what shape the
        // other site's image happens to be — and wide, because a share image is
        // a 1.91:1 banner and a squarer box would crop most of it away. At this
        // width the card's own height leaves a crop close enough to the
        // original that a banner with words on it is still readable.
        <div className="relative w-32 shrink-0 self-stretch sm:w-44">
          <Image
            src={card.image}
            // The title says what this links to; the picture repeats it.
            alt=""
            fill
            sizes="176px"
            className="object-cover"
          />
        </div>
      )}
    </>
  );

  const className =
    "not-prose my-6 flex items-stretch overflow-hidden rounded-lg border border-border no-underline transition-colors hover:bg-muted/40";

  // The same split `next.config.ts` draws for links written as Markdown, where
  // `rehype-external-links` does it and cannot see JSX: a recommendation should
  // not cost the reader the piece they were in the middle of, but moving around
  // this site is ordinary navigation, and a new tab there would cost the
  // client-side router and the back button for nothing.
  return internal ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
}

import { SubscribeForm } from "@/components/newsletter/SubscribeForm";
import { newsletter } from "@/data/content";

/**
 * The offer at the foot of something worth reading: the pitch, and the field
 * itself rather than a link to the page that has one.
 *
 * Someone who just finished a piece is as close to subscribing as they will
 * get, and sending them elsewhere to type an address loses most of them. It
 * sits straight after the writing and before the post-script matter, because it
 * answers "I want the next one" — which is what a last line leaves a reader
 * with.
 *
 * `source` records where the address was typed, so the list can say which page
 * earns its subscribers.
 */
export function SubscribeCta({ source }: { source: string }) {
  return (
    <section className="mt-12 flex flex-col items-center border-t border-border pt-8 text-center">
      {/* The same pitch the subscribe page opens with, wrapped the same way:
          each piece is inline-block, so a line can break in the gaps and
          nowhere else. Chinese breaks per character otherwise. */}
      <p className="max-w-[30rem] font-sans text-lg leading-relaxed">
        {newsletter.pitch.map((piece) => (
          <span key={piece} className="inline-block">
            {piece}
          </span>
        ))}
      </p>
      <div className="mt-6 flex w-full justify-center">
        <SubscribeForm source={source} />
      </div>
    </section>
  );
}

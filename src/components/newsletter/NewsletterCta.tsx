import { SubscribeForm } from "./SubscribeForm";

/** The end-of-post invitation to subscribe. */
export function NewsletterCta({ source }: { source: string }) {
  return (
    <section className="mt-12 flex flex-col items-center text-center">
      <p className="max-w-[26rem] font-sans text-base leading-relaxed text-muted-foreground">
        <span className="inline-block">每兩週，分享寫作與所見。</span>
        <span className="inline-block">每天進步一點點，</span>
        <span className="inline-block">一起在終點遇見更好的自己。</span>
      </p>
      <div className="mt-4 flex w-full justify-center">
        <SubscribeForm source={source} />
      </div>
    </section>
  );
}

import type { Mode } from "@/types/content";
import { SectionRow } from "@/components/SectionRow";

const linkClass = "illuminated-link font-medium text-foreground";

export function AboutSection({ mode }: { mode: Mode }) {
  return (
    <SectionRow label="About">
      <div className="flex flex-col gap-y-5 font-garamond text-xl leading-loose">
        {mode === "professional" ? (
          <>
            <p>Engineer &amp; serial entrepreneur. Currently working on Claude Code at Anthropic.</p>
            <p>
              In past lives I&apos;ve founded{" "}
              <a className={linkClass} href="https://www.playmultiverse.com">
                a YC backed gaming company that raised $17MM
              </a>
              ,{" "}
              <a className={linkClass} href="https://techcrunch.com/2013/03/28/hubspot-acquires-chime-prepwork/">
                sold a SAAS startup
              </a>
              ,{" "}
              <a className={linkClass} href="https://www.pubpub.org/">
                made a non-profit
              </a>
              , and did gradschool at the MIT Media Lab.
            </p>
          </>
        ) : (
          <p>Trying to pay attention.</p>
        )}
      </div>
    </SectionRow>
  );
}

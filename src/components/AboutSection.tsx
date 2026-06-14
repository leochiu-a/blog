import type { Mode } from "@/types/content";
import { SectionRow } from "@/components/SectionRow";

const linkClass = "illuminated-link font-medium text-foreground";

export function AboutSection({ mode }: { mode: Mode }) {
  return (
    <SectionRow label="About">
      <div className="flex flex-col gap-y-5 font-garamond text-xl leading-loose">
        {mode === "professional" ? (
          <>
            <p>
              資深前端工程師，專注於構建高效、可擴展的網頁應用程式。擁有豐富的經驗，熟悉各種前端技術和框架，致力於創造優質的使用者體驗。
            </p>
            <p>
              <span className={linkClass}>
                目前任職於 KKday Growth Team，主導網站 SEO / AEO（AI
                搜尋優化）策略落地
              </span>
              <span>
                ，透過提升網頁核心指標（Core Web
                Vitals）與語義化架構，驅動網站流量與搜尋能見度成長。擅長將複雜業務轉化為高效技術方案，並在團隊中推動效能優化與架構升級。
              </span>
            </p>
          </>
        ) : (
          <p>Trying to pay attention.</p>
        )}
      </div>
    </SectionRow>
  );
}

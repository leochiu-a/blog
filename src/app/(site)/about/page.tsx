import Link from "next/link";
import type { Metadata } from "next";
import { DarkPageShell } from "@/components/blog/DarkPageShell";
import { JsonLd } from "@/components/JsonLd";
import { author, projects, socialLinks } from "@/data/content";
import { PERSON_ID, personJsonLd } from "@/lib/person";
import { SITE_URL, seoTitle } from "@/lib/site";

const title = `關於 ${author.name}`;

const description = "這裡記錄我在工程開發、AI 落地與團隊協作中的實踐與思考，以及一些下班後的隨筆。";

/**
 * The Chinese line shown after each project's name, keyed by the title in
 * `data/content.ts`.
 *
 * The titles and URLs still come from that list, so a project cannot exist on
 * the home page and not here, and a moved URL is one edit. Only the wording is
 * local: the cards on the home page carry each project's own English pitch,
 * and this page is read in Chinese.
 */
const PROJECT_NOTES: Record<string, string> = {
  CodeReel: "將程式碼變更紀錄轉化為可視化影片的小工具",
  "slidev-workspace": "用於高效管理與開發 Slidev 簡報的 Workspace",
  "git-pr-ai": "自動根據 Git diff 分析並生成 Pull Request 摘要的 CLI 工具",
  "elden-ring-github": "將 GitHub 活動紀錄結合遊戲元素的趣味小專案",
  "universal-agents": "探索與實作跨平台 AI agent 溝通架構",
  "open-resume": "簡潔且高度可客製化的開放原始碼履歷模板",
};

/** The profiles listed under 聯絡我, in this order. The rest stay in the footer. */
const CONTACT_PROFILES = ["GitHub", "Threads", "Instagram", "Medium", "LinkedIn"];

export const metadata: Metadata = {
  title: seoTitle("關於"),
  description,
  alternates: { canonical: `${SITE_URL}/about/` },
  // No `openGraph` or `twitter` block on purpose: the layout's default card is
  // the one that introduces a person, which is exactly what this page does.
  // Spelling either out here would replace that block rather than add to it.
};

/**
 * Who wrote the posts, and why they are worth reading.
 *
 * A reader arriving from search lands on one post and has no route to the
 * credentials — the byline bio under each post answers that in three lines and
 * points here for the rest. In schema this is the one `ProfilePage` on the
 * site, and the only page whose main subject is the `Person` entity itself
 * (the home page's is the `WebSite`).
 */
export default function AboutPage() {
  const contacts = CONTACT_PROFILES.map((label) =>
    socialLinks.find((link) => link.label === label),
  ).filter((link): link is (typeof socialLinks)[number] => link !== undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // Emitted alongside, so `mainEntity` resolves inside this document
      // instead of pointing at an `@id` a crawler has to have seen elsewhere.
      personJsonLd,
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/about/#profilepage`,
        url: `${SITE_URL}/about/`,
        name: title,
        description,
        inLanguage: "zh-Hant",
        mainEntity: { "@id": PERSON_ID },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "關於", item: `${SITE_URL}/about/` },
        ],
      },
    ],
  };

  return (
    <DarkPageShell>
      <JsonLd data={jsonLd} />
      <h1 className="mt-2 font-sans text-4xl font-extrabold leading-tight tracking-tight">
        {title}
      </h1>
      <p className="mt-3 font-sans text-lg leading-snug text-muted-foreground">{description}</p>

      <div className="prose prose-lg prose-zinc mt-8 border-t border-border pt-8">
        <h2>在 KKday</h2>
        <p>
          目前在 KKday Growth Team，主要負責網站 SEO 與 AEO（AI
          搜尋優化）策略。透過優化網頁核心指標與語義化架構，持續提升搜尋能見度與流量；
          同時也在團隊內部導入 AI agent，優化日常開發流程與效能。
        </p>

        <h2>我在想的事</h2>
        <p>
          這裡大部分的文章，都在探討 AI 如何改變軟體工程師的工作方式，以及「當 AI
          能做到更多時，人類的價值該放在哪裡」。
        </p>
        <ul>
          <li>
            <strong>技術邊界與個人成長：</strong>我會透過閱讀最新論文來了解 AI
            的能力極限，並反思開發者該培養哪些核心能力。
          </li>
          <li>
            <strong>思維深度與架構設計：</strong>探討「認知卸載」與「認知投降」的界線，
            以及當大模型持續進化時，如何重新設計防禦性 Harness 架構。
          </li>
          <li>
            <strong>團隊實踐與 Web 前沿：</strong>記錄團隊內部的真實實驗（例如讓設計師獨立開發
            前端專案遇到的瓶頸），以及 Chrome Built-in AI、WebMCP 等 Web 前沿技術的觀察。
          </li>
        </ul>

        <h2>做過的東西</h2>
        <ul>
          {projects.map((project) => (
            <li key={project.title}>
              <a href={project.live ?? project.github} target="_blank" rel="noopener">
                {project.title}
              </a>
              {PROJECT_NOTES[project.title] && <span> — {PROJECT_NOTES[project.title]}</span>}
            </li>
          ))}
        </ul>

        <h2>下班之後</h2>
        <p>
          下班之後，想的都是些無關緊要的小事，全寫在
          <Link href="/personal/">另外一面</Link>。
        </p>

        <h2>聯絡我</h2>
        <p>
          <a href="mailto:hi@leochiu.com">hi@leochiu.com</a>
          {contacts.map(({ label, href }) => (
            <span key={href}>
              {" ｜ "}
              <a href={href} target="_blank" rel="me noopener">
                {label}
              </a>
            </span>
          ))}
        </p>
      </div>
    </DarkPageShell>
  );
}

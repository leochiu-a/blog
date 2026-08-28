# leochiu.com

我的個人網站與部落格：一頁式的 portfolio 首頁，加上以 Markdown / MDX 撰寫的文章。用 Next.js App Router 建置，部署在 Cloudflare Workers 上。

## 技術組成

| 面向 | 選擇 |
| --- | --- |
| 框架 | Next.js 16（App Router、`trailingSlash`，沿用舊站 `/blog/<slug>/` 的網址） |
| 內容 | Markdown / MDX + [content-collections](https://www.content-collections.dev/)，frontmatter 以 zod 驗證 |
| 語法高亮 | rehype-pretty-code + shiki，build 時完成，bundle 不含 highlighter |
| 樣式 | Tailwind CSS v4、`@tailwindcss/typography` |
| UI 元件 | shadcn（Base UI 版本）、lucide-react |
| 部署 | OpenNext + Cloudflare Workers（`wrangler.jsonc`） |
| 測試 / 工具 | Vitest + happy-dom、oxlint、oxfmt |

## 開發

```bash
pnpm install
```

```bash
pnpm dev
```

開 [http://localhost:7788](http://localhost:7788)。

其他指令：

| 指令 | 用途 |
| --- | --- |
| `pnpm build` | production build |
| `pnpm start` | 跑 production build |
| `pnpm preview` | 用 OpenNext 打包後在本機 Workers runtime 預覽 |
| `pnpm deploy` | 打包並部署到 Cloudflare Workers |
| `pnpm test` | Vitest（`pnpm test:watch` 為 watch mode） |
| `pnpm lint` / `pnpm format` | oxlint / oxfmt |

## 寫文章

文章放在 `src/content/blog/<slug>.md`，檔名就是網址 slug。Frontmatter 的欄位定義在 [src/lib/post-frontmatter.ts](src/lib/post-frontmatter.ts)：

```yaml
---
title: "標題"
subtitle: "副標，選填"
description: "SEO 描述，選填"
ogImage: "/images/og/xxx.png"   # 選填
tags: ["ai", "frontend"]        # 選填
datetime: "2026-08-25"
updated: "2026-09-01"           # 選填，改版後填，會顯示 Updated 並帶進 schema.org
readTime: "5 min"
category: "professional"        # professional | personal
featured: true                  # 選填
draft: true                     # 選填
---
```

`draft: true` 的文章只在 `next dev` 看得到——列表、RSS、文章頁在 production 都會排除它，所以未完成的稿子可以先進 repo。想對照各種格式怎麼寫，看 [格式參考](src/content/blog/format-reference.md) 這篇 draft。

除了標準 Markdown（含 GFM 表格），還可以用這些元件（定義在 [src/mdx-components.tsx](src/mdx-components.tsx)）：

- `<Callout>`、`<Figure>`、`<VideoEmbed>`
- 巢狀的 `>>` blockquote 會渲染成 pull quote，維持純文字、在任何 Markdown 編輯器都能預覽
- `---` 會渲染成裝飾性的分隔線

## 內建編輯器

`/editor` 提供一個 TipTap 的所見即所得編輯器，直接讀寫 `src/content/blog/` 底下的檔案。

它只存在於開發環境：相關路由命名為 `page.dev.tsx` / `route.dev.ts`，而這些副檔名只有在 `next dev` 時才註冊給 Next.js（見 [src/lib/editor/dev-routes.ts](src/lib/editor/dev-routes.ts)）。production build 根本不會把它們解析成路由，因此部署出去的站台既沒有編輯頁、也沒有那些會寫檔的 API——不靠 runtime flag，沒有東西需要事後剝除。

## 目錄結構

```
src/
  app/
    (home)/          首頁（portfolio）
    (blog)/          文章內頁（列表在首頁）
    (editor)/        dev-only 編輯器
    api/editor/      dev-only 讀寫檔案的 API
    feed.xml/        RSS
    sitemap.ts
  content/blog/      文章本體
  components/
    mdx/             文章裡可用的元件
    blog/            文章頁的周邊（目錄、作者、回到頂端…）
    editor/          編輯器
    ui/              shadcn 元件
  lib/               設定、資料存取、工具
  data/content.ts    個人資料、社群連結、專案清單
```

網址預設為 `https://leochiu.com`，可用環境變數 `NEXT_PUBLIC_SITE_URL` 覆寫（見 [src/lib/site.ts](src/lib/site.ts)）。

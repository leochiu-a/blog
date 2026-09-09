---
title: RD#1 當 agent 接手程式碼之後
subtitle: 模型變強之後，我們去年為了防 AI 犯錯寫下的那些規範還需要嗎？
description: RD#1 —— 過期的 harness 該刪哪一半、Chrome 內建 AI 的落地取捨、Rust 重寫的 pnpm 12，以及一份 agent 時代還留得住的工程價值清單。
datetime: 2026-09-08T00:00:00+08:00
---

## 我自己寫的

### [你的 AI Agent 正在用過期的 Harness 嗎？](/blog/stale-harness-and-loop-engineering/)

*Leo Chiu · 9 分鐘*

我這篇在梳理 AI 工程從靜態 harness 走向動態 loop 的演進。模型變強之後，Anthropic 發現 Opus 4.6 能自己撐完兩個多小時的開發，就直接把繁複的 sprint contract 結構砍掉了。除了模型無法憑常識推論的團隊冷門規則，一些常識型的 harness 都可以大膽淘汰，把省下的 token 留給測試與 CI。

### [Chrome Built-in AI 與 WebMCP 如何重塑 Web 體驗？](/blog/chrome-built-in-ai-and-webmcp/)

*Leo Chiu · 12 分鐘*

這篇拆解 Chrome 兩項瀏覽器端 AI 新規格怎麼落地，這篇文章舉得案例是 Yahoo 奇摩拍賣上線 9 個 Built-in AI 功能，賣家上架耗時從 20 分鐘縮短到 2 分鐘。Yahoo 有提到導入 Built-in AI 的預算該花在狀態管理與資源協調，而不是調 prompt；WebMCP 則還在 origin trial，值得投資理解與試作，但關鍵路徑上還不值得實作。

## 這週讀到的

### [Modern Engineering Values](https://cpojer.net/posts/modern-engineering-values)

*Christoph Nakazawa · 14 分鐘*

這篇在討論當 coding agent 能代勞多數程式碼時，軟體工程師該靠什麼建立核心競爭力。作者列出六項價值：ownership、taste、guardrails 與快回饋迴圈、把 context 收進 repo、掌握自己的 stack，以及 option value。他自己過去 30 天送出 770 個 commit，並提醒主管必須親自掌握技術細節才給得出方向。這是我這週最推薦的一篇。

### [pnpm 12](https://pnpm.io/blog/releases/12.0)

*Zoltan Kochan · 10 分鐘*

這篇介紹 pnpm 最新大改版的技術細節，核心是將整個底層以 Rust 重寫。雖然引擎徹底翻新，但它完整承接了 pnpm 11 的指令與 lockfile 格式，大型專案解析依賴的速度提升了 2 到 3 倍。唯一要留意的是 git 依賴現在一律走 HTTPS，私有 repo 想走 SSH 得自己用 `insteadOf` 改寫。

### [Workers 體積上限放寬到 64 MiB](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/)

*Cloudflare Changelog*

這則是 Cloudflare 關於 Worker 部署大小限制的規則異動公告。官方移除了過去檢查壓縮檔案的舊規定，改為全面只看未壓縮大小，且免費與付費方案的上限一律統一放寬到 64 MiB。限制放寬後不再容易卡關，大家跑 `wrangler deploy --dry-run` 時稍微留心一下即可。

### [shadcn-ui/cn](https://github.com/shadcn-ui/cn)

這是一個專為 Tailwind CSS 類別合併設計的新工具，由 AidenyBai 與 Shadcn 聯手維護。它維持與既有 API 相同的使用方式，但執行效能達到原有工具的 30 倍。既有專案只要跑一行遷移指令就能替換，有在用 Tailwind 的人很值得順手換掉。

### [TanStack Start on Vercel](https://vercel.com/docs/frameworks/full-stack/tanstack-start)

*Vercel 官方文件*

這份官方指南說明如何將基於 TanStack Router 的全端框架 TanStack Start 部署到 Vercel。整套配置的核心是在專案中安裝並設定 Nitro 外掛，讓伺服器端順利對接 Vercel Functions。如果手邊沒有要立刻部署這套架構，這篇可以先跳過，等有需要時再來查。

## 心態與生活

### [3-2-1：關於熱忱、重新開始與持續](https://jamesclear.com/3-2-1/september-3-2026)

*James Clear · 約 3 分鐘*

這期電子報以簡短語錄分享如何面對熱忱、當下的選擇以及長期累積。其中 Tim Urban 指出，在每週清醒的 112 小時裡，花 15 小時寫作與完全不寫的人，生活其餘的 6/7 其實一模一樣。這種把巨大目標拆解回日常時數的視角，很適合在懷疑自己進度時拿來提醒自己。

### [Love, Money, and Fame](https://markmanson.net/breakthrough/244-success)

*Mark Manson · 約 5 分鐘*

這篇探討外在成就與人格之間的關係。作者指出愛、金錢與名聲從來不會改變一個人，只會把原本的特質放大，例如原本就缺乏安全感的人只會變得更加不安。別以為外在的成功可以治好個人缺陷，在全力追逐目標前，先釐清自己的真實動機更重要。

### [everything is a win when the goal is to experience](https://yearlyblues.substack.com/p/everything-is-a-win-when-the-goal)

*sentimental being · 約 10 分鐘*

這是一篇提醒讀者放慢腳步的散文，主張將生活從累積成果轉為單純體驗。作者反思自己過去習慣用 92 分或排名第 3 這類數字給人生評分，把存在當成了向他人證明的作業。如果最近被績效與進度壓得喘不過氣，很推薦讀讀這篇，能幫你找回生活的感知。

## 有趣的發現

### [Awwwards 的 404 收藏集](https://www.awwwards.com/awwwards/collections/404-error-page/)

這是一個專門收集網站 404 錯誤頁面的設計策展，目前總共收錄了 475 個案例。集合中涵蓋了來自不同團隊的動態效果、3D 畫面甚至是微型遊戲，呈現各種跳脫傳統報錯的介面設計。如果團隊正好在構思如何讓錯誤畫面更有特色，這份清單隨手翻翻就能帶來不少靈感。

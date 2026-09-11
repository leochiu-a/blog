---
title: "用 Cloudflare 免費方案架一個 blog，會用到哪些服務"
subtitle: "你現在看的這個站就跑在免費方案上。DNS、Workers、D1、Turnstile、WAF，一個一個過，順便標出額度的邊界在哪"
description: "Cloudflare 免費方案架 blog 會用到的服務與 2026 年 9 月的免費額度：DNS、Workers、Pages、Workers Builds、D1、Turnstile、WAF Rate limiting rules、Web Analytics，加上實際做下去才會發現需要的 Email Routing、Images、Workers Logs。"
datetime: "2026-09-10"
readTime: "9 min"
category: "professional"
tags: ["Cloudflare", "Cloudflare Workers", "D1", "Turnstile", "WAF", "免費方案"]
draft: true
---

<Figure src="/blog-images/cloudflare-free-tier-stack-hero.webp" alt="一個人站在岩石上張開雙臂擁抱一朵橘白色的雲，遠處有幾棟建築物的插畫" width={2816} height={1536} />

## 前言

這個部落格目前完全架在 Cloudflare 的免費方案上，用 Next.js 做 SSG 靜態產生、D1 資料庫存電子報訂閱名單，再掛上 Turnstile 與 WAF 來擋機器人跟異常大流量，避免 Worker 被刷爆。

這篇文章想分享給打算低成本自架部落格的朋友，我把會用到的 Cloudflare 服務盤點了一遍，並整理出各自免費額度的邊界（數據為 2026 年 9 月對照官方文件的最新版本）。

至於如何把 Next.js 塞進 Worker，以及中間踩過哪些坑，我會整理在另一篇文章中。

---

## DNS

原本我在 Vercel 跟 Cloudflare 之間猶豫，最後選 Cloudflare，主因就是想要「一站式」搞定，不用在不同平台間拼湊資料庫、CDN 跟防護工具。

把網域的 NS（Name Server） 指給 Cloudflare 後，幾乎不用特別設定，Universal SSL 憑證就自動簽發跟續約完成，還順手帶上不限流量的 CDN 頻寬、DDoS 防護和免費 WAF。

而且 HTTPS 也是預設啟用，完全不用自己去寫 Let's Encrypt 的邏輯。

### DNS Proxy：開啟免費防護的開關

這兩個名字很有趣，我也是在碰了 Cloudflare 以後才知道：

- **灰雲（DNS Only）：** NS 指向 Cloudflare 後，Cloudflare 只做單純的地址指引，把訪客直接帶到你的主機 IP。
- **橘雲（Proxy）：**&#x8A2A;客打進來會先經過 Cloudflare 的伺服器，因此你能免費享受到 **DDoS 防護、CDN 快取、SSL 憑證與 WAF**，同時也能隱藏背後的真實 IP。

---

## Workers

如果你想到 Next.js，一定會想到 Vercel，以前我也幾乎都把 Next.js 架在 Vercel 上面，因為 DX 很好，而且又提供免費的 HTTPS 服務。

但這次我想嘗試看看把 Next.js 架在 Cloudflare Workers 上面。

大家想到 Workers，一定會想說它可能比較接近 Cloud Functions 或是 AWS Lambda 這種 serverless 的服務，但其實網頁現在也可以在 Worker 部署。

而且很神奇的是，大家想到 Serverless 的 server，一定也會想到它會不會有冷啟動的時間會花上 2\~3 秒的問題。

但是 Cloudflare 在背後做了一些特殊的事情來達到**零冷啟動（Zero Cold Start），**&#x57;orkers 不使用傳統的虛擬機，而是使用 Google Chrome 瀏覽器的核心技術——**V8 Isolate**。它不需要啟動整個作業系統或 Node.js 虛擬環境，可以在**毫秒級（\<10ms）**&#x5167;直接執行 Next.js 的程式碼。

<Figure src="/blog-images/cloudflare-free-tier-stack-v8-isolates.webp" alt="左右對照圖：傳統架構的四個區塊各自帶著一份使用者程式碼與一份 process overhead；Workers 的 V8 isolates 則是九份使用者程式碼共用同一份 process overhead" width={1678} height={666} caption="Cloudflare worker - V8 isolcates">

</Figure>

### 免費方案額度

- **每日請求數：** 10 萬次
- **CPU 時間：** 每次呼叫上限 10 毫秒（Duration 時間不計費）

&#x20;10 萬個請求在部落格初期已經很夠用了。

除非你是一個流量很大的部落格，不然如果初期只是想嘗試的話，免費方案其實已經很足夠了。

你會想說，圖片、字型、JS Chunk 這些要算錢嗎？答案是免費。

只有真的跑去喚醒 Worker script 的請求才會算錢，只有真正打到 Worker script（通常只有請求 HTML 頁面）才會扣額度。

### 10ms 的 CPU 時間

10 毫秒 CPU 時間這條限制比較麻煩一點，我初期在測試的時候，發現只要快速重整幾次，這個 10 毫秒的 CPU 時間很容易就會碰到，使用者有時候會踩到 Cloudflare 的 **1102**（Worker exceeded resource limits）。

順帶介紹兩個常搞混的錯誤碼：

- **1102**：CPU 時間燒完（跟流量無關， 一個人狂刷新就會爆）。
- **1027**：當天 10 萬次請求總額度用光。

這個 CPU 限制後來我是靠 Worker Cache 搞定的，細節與其它坑點我整理在另一篇。

### 容量限制：3 MB -> 64 MiB

2026 年 9 月 4 日，Cloudflare 大幅放寬了 Worker 的容量上限，這對要把 Next.js 丟上來的人來說是大好消息。

過去免費方案限制 **3 MB**（付費版 10 MB），而且計算的是 gzip 壓縮後的大小。使用 `@opennextjs/cloudflare` 打包出來的 `worker.js` 要塞進 3 MB 非常吃緊，內容多一點就可能會爆炸。

現在全方案統一放寬到 **64 MiB**，並改看**未壓縮**的大小，官方原文說明：

> "Cloudflare now only checks the uncompressed size of your bundle, which is 64 MiB across all plans."
>
> 參考：[Increased Worker size limit](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/)（2026-09-04）

---

## Pages

如果你還覺得「靜態站就是要丟 Cloudflare Pages」，現在狀況不太一樣了。Cloudflare 自己在 Pages 文件有提到：

> Workers supports most Pages use cases and offers a broader feature set. It is Cloudflare's primary platform for building applications. Start new projects with Workers.

簡單來說，官方現在的核心就是 Workers。

不過 Pages 也沒有要關，老專案不會壞，免費額度也沒縮水。每個月 500 次 build、1 個並行 build、單站上限 20,000 個檔案、單檔最大 25 MiB、每個專案能綁 100 個自訂網域，而且不限流量免費跑。如果你只是純靜態站，繼續放在 Pages 完全沒問題。

換作是之前，要架設 Next.js 可能得用 Pages 配上 Workers 來跑 SSR，或是強制設定 `output: 'export'` 輸出純靜態檔才能部署到 Pages 上。現在全套直接丟 Workers 處理反而單純很多。

---

## Workers Builds

Workers Builds 是 Cloudflare 內建的 CI 工具。綁定 GitHub 後，只要 `git push` 就會自動觸發打包與部署。免費方案每個月提供 3,000 分鐘建置時間、1 個並行 build，每次最多跑 20 分鐘。

如果你手邊早就有慣用的 GitHub Actions，這功能直接略過沒關係。但如果想少維護一份 CI pipeline，這 3,000 分鐘給個人專案用綽綽有餘。

以我這個部落格為例，整套 build 完大約一分鐘，一個月推個上百次也只會扣掉一小部分額度。

---

## D1

D1 是 Cloudflare 提供的 Serverless SQLite 資料庫。

免費方案每天給 500 萬 rows read、10 萬 rows written，以及 5 GB 總儲存空間。

<Figure src="/blog-images/cloudflare-free-tier-stack-d1-pricing.webp" alt="Cloudflare D1 定價表：Storage 免費方案 5 GB、付費 $0.75/GB-month；Rows Read 免費每天 500 萬列、付費 $0.001/百萬列；Rows Written 免費每天 10 萬列、付費 $1.00/百萬列" width={2262} height={1006} caption="D1 Pricing">

</Figure>

因為部落格文章在 build 的階段就已預先產生為靜態內容，平時瀏覽完全不需要打資料庫。只有像訂閱名單這種「需要在 runtime 寫入、後續再撈出來」的動態資料，才需要放到 D1。

在 `wrangler.jsonc` 綁定好之後：

```jsonc
// wrangler.jsonc
"d1_databases": [
  {
    "binding": "NEWSLETTER_DB",
    "database_name": "blog-newsletter",
    "migrations_dir": "migrations",
  },
],
```

綁定設好後，就能直接在 Worker 裡透過 `env.NEWSLETTER_DB.prepare(...)` 呼叫，完全不需要處理資料庫連線字串，也不需要自己維護 Connection Pool。

值得注意的是，免費方案給的 500 萬次讀取看似充裕，但計算方式是「**查詢過程掃描的總列數**」，而不是最後回傳的資料筆數。如果表內有十萬筆資料，而你下了一條沒掛 Index 的 `WHERE email = ?` 查詢，只要執行一次就會直接燒掉十萬列額度。

因此額度能不能守住，關鍵全看你的 Schema 如何設計 Index，跟網站流量反而沒那麼大關係。

---

## 部落格圖片：放在 Repo 還是 R2？

文章裡的截圖與示意圖到底要擺哪？在 Cloudflare 上主要有三條路：

- 直接跟著程式碼進 repo
- 丟去 R2
- 或是用 Cloudflare Images 當圖床。

### 我目前的選擇：圖片直接住在 Repo 裡

目前我選擇的是圖片放進 `public/blog-images/`，跟文章一起 commit，build 完直接變成 Worker 的 Static Assets。

會這樣選主要有兩個原因：

- **請求完全免費：** 打到靜態資產的請求不扣每日 10 萬次的 Worker 額度（免費方案上限 20000 個檔案、單檔 25 MiB，對部落格綽綽有餘）。
- **版本控管方便：** 文章與圖片版本綁定，可以在本地看到哪些圖片更動

另外，為了優化 CWV 的 CLS 跟 LCP，所以我在本地開發環境寫了簡單的腳本，在文章中插入圖片時會自動把圖片轉成 WebP，並直接將寬高寫進 `<Figure>` 元件中。

### next/image 的額度機制

使用 `@opennextjs/cloudflare` 時，`next/image` 的轉檔會調用 Cloudflare Image Transformations，需要在 `wrangler.jsonc` 綁定 `IMAGES`。

```jsonc
// wrangler.jsonc
"images": {
  "binding": "IMAGES",
},
```

免費方案提供每月 **5000 次 unique transformations**（同一張原圖 + 同一尺寸變體一個月只算一次，與訪客流量無關）。超過上限後只會轉檔失敗，不會扣錢。

### 為什麼是 Image Transformations，而不是 Cloudflare Images？

兩者很容易搞混，但它們是完全不同的服務：

- **Cloudflare Images：** 這是獨立的「圖片託管圖床（包含儲存與管理）」，屬於**純付費服務**（每月 $5 起步，沒有免費額度）。
- **Image Transformations：** 這是邊緣運算的「即時轉檔 API」。當你在 Next.js 使用 `<Image/>` 時，`@opennextjs/cloudflare` 背後呼叫的就是這個服務，圖片依然存放在你的 Repo 或 R2，只是透過 Cloudflare 在邊緣節點動態裁切與轉成 WebP。

因此，你**不需要**購買 Cloudflare Images 服務，直接享受每月 5000 次的免費轉檔額度即可。

### 什麼時候該搬去 R2？

當 Git repo 開始被圖片拖慢，或是圖片檔案大小太大（單檔 > 25 MiB）時，就是改用 **R2** 的時候。

R2 是 S3 相容的物件儲存，免費方案給 **10 GB 儲存空間** 與每月 **1000 萬次 B 類讀取**。它最大的優點是 **$0 Egress（流量不收費）**，非常適合當作極低成本的公開圖床。

---

## Turnstile

Turnstile 是 Cloudflare 用來取代傳統驗證碼（CAPTCHA）的工具。

實作方式很簡單，前端嵌入 widget，後端打一支 `siteverify` API 來驗證 token。免費方案提供 20 個 widget，每個綁定上限 10 個 hostname，而且發送 challenge 與驗證 token 的次數完全沒有上限。

網站只要有開放對外的 POST API（例如訂閱電子報）會把資料寫進 DB，一些攻擊型的機器人可能就會嘗試打打看。

但 D1 的每日寫入上限只有 10 萬次，把 Turnstile 擋在最前面，就能乾淨地把真人請求與腳本洗資料區隔開來。

相比 Google 的 reCAPTCHA，Turnstile 的體驗好上不少。大部分時候使用者完全不需要用肉眼點紅綠燈或斑馬線，widget 在背景就把驗證跑完了。

<Figure src="/blog-images/cloudflare-free-tier-stack-turnstile-flow.webp" alt="Turnstile 運作流程圖：網頁載入 challenges.cloudflare.com 的 api.js，以 sitekey 呼叫 turnstile.render，iframe 跑完 challenge 後回傳 token；使用者送出請求時把 token 交給 Origin / Worker，後端再帶著 secret key 與 token 去打 siteverify API 驗證" width={3757} height={2700} caption="How Turnstile works" />

---

## WAF：Rate limiting rules

Turnstile 專門防機器人，Rate Limiting 則是抓同一個來源在短時間內瘋狂連擊 API，即使是通過 Turnstile 驗證卻依然不斷點擊重送的請求，也能一併擋下。

免費方案給的 Rate Limiting 規則相對陽春：

- **規則數量：** 只有 **1 條**
- **計數週期：** 只能設 **10 秒**
- **封鎖時間（mitigation timeout）：** 只能封 **10 秒**
- **規則表達式欄位：** 只能選 **Path** 與 **Verified Bot**
- **計數依據（characteristics）：** 只能綁 **IP**
- **計數模型：** 算請求數

算下來你能開的規則就只有一種樣式：「只要是這個 Path，同一個 IP 在 10 秒內打超過 N 次，就擋 10 秒」。因為手頭上只有這麼一條配額，一定要押在風險最高的 Endpoint 上。

---

## Web Analytics

完全免費、不讀寫 Cookie，甚至不需要開 Proxy，只要塞一段 JS beacon 就能運作，即使網站託管在別家平台也能用。

對個人部落格來說，它提供的指標已經非常夠用：Page Views、訪客數、流量來源、國家、裝置類型與 Core Web Vitals 等等。

雖然沒有 Google Analytics 那種繁複的自訂事件追蹤或轉換漏斗，但寫部落格可能不需要這麼複雜的事件，也不需要有 Cookie bar。

<Figure src="/blog-images/cloudflare-free-tier-stack-traffic-overview.webp" alt="Cloudflare 的 Traffic overview 儀表板，上方四張卡片顯示 6.28k 請求數、288、44.81% 與 77.91 MB，下方是過去 24 小時的請求數折線圖" width={2320} height={1370} caption="Web Analytics" />

---

### Workers Logs

只要在設定中將 `observability.enabled` 打開，Workers Logs 就會開始收 logs。

免費版每天能處理 200,000 個 log event，資料會保留 3 天。

```
// wrangler.jsonc
"observability": {
  "enabled": true,
},

```

僅能保存 3 天能做的事情就很有限，像是系統出事當天進 Dashboard 除錯沒問題，但想回頭查上週的異常行為就不可能了。

如果要長期留存 log，還是得乖乖串接外部服務。

---

## 免費額度的真實瓶頸

把這些服務對照下來，會發現 Cloudflare 各項免費額度的鬆緊度落差蠻大的：

- **完全不用擔心：** Worker 每天 10 萬次請求，D1 給的 500 萬次 row read，Workers Builds 每月 3000 分鐘與 Turnstile 的 20 個 widget，一般來說這些一開始根本用不完。
- **真正需要注意的是：**
  1. **Workers 的 10ms CPU 時間：** 這跟流量無關，單人狂重新整理也會爆，所以需要特別注意。
  2. **Rate limiting 只有 1 條規則：** 一定要設在風險最高的 Endpoint 上。
  3. **Images 每月 5000 次 unique transformations：** 圖多、尺寸變體多的站要留意，跟流量無關。

總體來說 Cloudflare 還是非常佛心，如果想要自己架設個部落格，不需要在多個雲端服務之間斡旋，可以選擇 Cloudflare 全家桶，等之後流量或是需求因素踩到一些免費額度的上線，到時候再思考也不遲。

之後會另外寫一篇關於 Next.js + Cloudflare 可能會踩到的一些坑，敬請期待！

---

## Reference

1. [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
2. [Static Assets Billing and Limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
3. [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
4. [Workers Builds Limits and Pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
5. [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
6. [Turnstile Plans](https://developers.cloudflare.com/turnstile/plans/)
7. [WAF Rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
8. [Cloudflare Images Pricing](https://developers.cloudflare.com/images/pricing/)
9. [Images Transformations bindings](https://developers.cloudflare.com/images/transform-images/bindings/)
10. [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)

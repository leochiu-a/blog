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

<Figure src="/blog-images/gemini-generated-image-geuvm2geuvm2geuv.webp" alt="" width={2816} height={1536} />

## 前言

現在這個 blog 跑在 Cloudflare 免費方案上，包括使用 Next.js 來實現 SSG，用 D1 資料庫來存電子報的訂閱者，也有使用 Turnstile 跟 WAF 來防止機器人跟大流量來打爆 Worker。

這篇文章主要是想分享給那些想嘗試自架部落格，但是想要花較低成本的人。下面把會用到的服務一個一個過，順便標出各自免費額度的邊界，數字是我 2026 年 9 月從官方文件一頁頁翻出來對過的。

至於怎麼把 Next.js 塞進 Worker、還有我在那條路上踩到的坑，另外寫在[把 Next.js 搬上 Cloudflare Workers](/blog/nextjs-on-cloudflare-workers/)。

---

## DNS：一切的起點

原本我在 Vercel 跟 Cloudflare 之間猶豫，最後選 Cloudflare，主因就是想要「一站式」搞定，不用在不同平台間拼湊資料庫、CDN 跟防護工具。

把網域的 NS（Name Server） 指給 Cloudflare 後，幾乎不用特別設定，Universal SSL 憑證就自動自動簽發續約了，還順手帶上不限流量的 CDN 頻寬、DDoS 防護和免費 WAF。

而且 HTTPS 也是預設帶好，完全不用自己去寫 Let's Encrypt 的邏輯。

### Cloudflare 的灰雲（Grey Cloud） 跟橘雲（Orange Cloud）

這兩個名字很有趣，我也是在碰了 Cloudflare 以後才知道：

- **灰雲（僅 DNS）：** NS 指向 Cloudflare 後，Cloudflare 只做單純的地址指引，把訪客直接帶到你的主機 IP。
- **橘雲（Proxy 代理）：** Cloudflare 跳出來當中間人（Proxy）。訪客打進來會先經過 Cloudflare 的伺服器，因此你能免費享受到 **DDoS 防護、CDN 快取、SSL 憑證與 WAF**，訪客也永遠看不到你背後的真實伺服器 IP。

---

## Workers

如果你想到 Next.js，一定會想到 Vercel，以前我也幾乎都把 Next.js 架在 Vercel 上面，因為 DX 很好，而且又提供免費的 HTTPS 服務。

但這次我想嘗試看看把 Next.js 架在 Cloudflare Workers 上面。

大家想到 Workers，一定會想說它可能比較接近 Cloud Functions 或是 AWS Lambda 這種 serverless 的服務。但其實網頁現在也可以在 Worker 部署，也可以拿來當作 serverless server 使用。

而且很神奇的是，大家想到 Serverless 的 server，一定也會想到它會不會有冷啟動的時間 2\~3 秒的問題。

但是 Cloudflare 在背後做了一些特殊的事情來達到**零冷啟動（Zero Cold Start）**&#x57;orkers 不使用傳統的虛擬機，而是使用 Google Chrome 瀏覽器的核心技術——**V8 Isolate**。它不需要啟動整個作業系統或 Node.js 虛擬環境，可以在 **毫秒級（\<10ms）** 內直接跑起 Next.js 的程式碼。

### 免費方案

免費方案每天給 10 萬個請求，每次呼叫有 10 毫秒 CPU 時間，duration 時間不收錢。

&#x20;10 萬個請求在部落格初期已經很夠用了。除非你是一個流量很大的部落格，不然如果初期只是想嘗試的話，免費方案其實已經很足夠了。

你會想說，圖片、字型、JS Chunk 這些要算錢嗎？

答案是免費，只有真的跑去喚醒 Worker script 的請求才會算錢，幾乎就只有拿頁面的 HTML 的請求才算。

### 10ms 的 CPU 時間

10 毫秒 CPU 時間這條限制比較麻煩一點，我初期在測試的時候，發現只要快速重整幾次，這個 10 毫秒的 CPU 時間很容易就會碰到，訪客會拿到 Cloudflare 的 **1102** 錯誤頁（Worker exceeded resource limits）。

順帶分清楚兩個容易搞混的錯誤碼：1102 是這次講的 CPU 燒完，**1027** 才是免費方案當天 10 萬個請求用光。前者跟流量無關，一個人狂重整就會碰到。

後來我是用 Worker Cache 把這個問題解掉的，那段連同其他坑寫在另一篇：[把 Next.js 搬上 Cloudflare Workers](/blog/nextjs-on-cloudflare-workers/)。

### 3 MB -> 64 MiB 的容量

Worker 的大小上限在 2026 年 9 月 4 日放寬了，這件事對想把 Next.js 丟上來的人蠻關鍵的。

以前免費方案是 **3 MB**、付費方案 **10 MB**，而且算的是 gzip 壓縮後的大小。opennextjs 打包出來的 `worker.js` 要塞進 3 MB 並不輕鬆，站一長大就會撞到。

現在改成所有方案統一 **64 MiB**，而且改看未壓縮的大小，壓縮值只是列出來參考、不再是限制。官方的說法是「Cloudflare now only checks the uncompressed size of your bundle, which is 64 MiB across all plans」。

> 參考：[Increased Worker size limit](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/)（2026-09-04）

---

## Pages

如果你還覺得「靜態站就是要丟 Cloudflare Pages」，現在狀況不太一樣了。Cloudflare 自己在 Pages 文件首頁就挑明了講：

> Workers supports most Pages use cases and offers a broader feature set. It is Cloudflare's primary platform for building applications. Start new projects with Workers.

Pages 沒有要關，老專案不會炸掉，免費額度也沒縮水：每個月 500 次 build、1 個並行 build、單一站台 20,000 個檔案、單檔最大 25 MiB、每個 project 能綁 100 個自訂網域，流量隨你跑不收錢。純靜態的站丟在 Pages 上面現在照樣跑得好好的。

如果在前幾年，你可能就需要使用 Cloudflare Pages，再加上 Cloudflare Workers 來執行 SSR，才有辦法架設 Next.js。不然你就要每次設定 output 等於 export，讓 Next.js 輸出靜態檔，才能單純部署到 Cloudflare Pages 上面。

---

## Workers Builds

這就是 Cloudflare 內建的 CI 工具。綁定 GitHub 後，git push 就自動觸發 build 跟 deploy。免費方案每個月送 3,000 分鐘、1 個並行 build，每次 build 最多跑 20 分鐘。

手邊早就有 GitHub Actions 的話，這功能直接跳過也無所謂。但如果想少維護一份 CI pipeline，3,000 分鐘給個人專案用綽綽有餘。

我這個 blog 整套 build 完差不多一分鐘，一個月推一百次扣掉的額度也才一點點。

---

## D1

Cloudflare 的 SQLite 資料庫服務。

免費方案每天有 5,000,000 rows read、100,000 rows written，儲存空間總共給 5 GB。

我用它來存電子報的訂閱名單。

部落格文章在 build 的時候就已經轉成靜態內容，根本用不到資料庫；只有那些「使用者在 runtime 寫進來、之後要撈出來看」的資料才需要，訂閱名單剛好符合這條件。

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

綁定設好後，在 Worker 裡面直接調用 `env.NEWSLETTER_DB.prepare(...)`，不必管連線字串，也不用開連線池。

500 萬列讀取聽起來很大方，但要注意 rows read 計算的是查詢過程掃描了幾列，沒人在管你最後撈回幾列。要是表裡有十萬筆資料，你偏偏下了一條沒掛 index 的 `WHERE email = ?`，只要跑一次就直接噴掉十萬列額度。

這額度能不能守住，看的是你 schema 怎麼開 index，跟外面流量大不大沒啥關係。

---

## Turnstile

Cloudflare 拿來替換傳統 CAPTCHA 的工具。

前端塞個 widget，後端 call 一支 siteverify 來驗 token。免費方案提供 20 個 widget，每個 widget 上限 10 個 hostname，送 challenge 跟打 siteverify 的次數完全沒限額。

網站只要有一支開在外面的 POST endpoint 會往資料庫寫東西，機器人很快就會找上門，偏偏 D1 每天寫入上限就卡在 100,000 次。把 Turnstile 擋在最前線，就能把真人點擊跟自動化腳本洗資料區隔開來。

用它比用 reCAPTCHA 舒服很多，大部分時候使用者不用肉眼認紅綠燈，widget 自己在背景就把驗證跑完了。**How Turnstile works**

<Figure src="/blog-images/image-2.webp" alt="" width={3757} height={2700} caption="How Turnstile works" />

---

## WAF：Rate limiting rules

Turnstile 專門防機器人，rate limiting 則是抓同一個來源短時間內瘋狂戳 API——就連那些通過驗證卻不斷狂按重送的 request 也能擋。

免費方案給的 rate limiting rule 非常陽春，動手前最好先摸清它的邊界：

- 規則數量：只有 **1 條**
- 計數週期：只能設 **10 秒**
- 封鎖時間（mitigation timeout）：只能封 **10 秒**
- 規則表達式只能用兩個欄位：**Path** 跟 **Verified Bot**
- 計數依據（characteristics）只能綁 **IP**
- 計數模型：算請求數

算下來你能開的規則就只有一種樣式：「只要是這個 path，同一個 IP 在 10 秒內打超過 N 次，就擋 10 秒」。因為手頭上只有這麼一條配額，一定要押在最危險的地方。

這條規則剛好拿來補 Turnstile 的盲區：

> Turnstile 看的是「這個請求有沒有像活人」，rate limiting 看的是「同個 IP 這陣子到底衝進來幾次」。萬一前面被鑽漏洞摸過去，後面的 rate limiting 還能把你的額度成本死死守住。

另外免費版附贈的 WAF managed ruleset 還有 Bot Fight Mode 基本上都是一鍵開關，沒有自訂空間，把它們點亮放著就行。

---

## Web Analytics

不用錢、完全不吃 cookie，甚至不需要把網域丟進 Cloudflare proxy——它單靠一段 JS beacon 就能跑，就算你網站丟在別家託管也能直接掛。

看個人 blog 的話它給的指標就很夠用了：page view、訪客數、流量來源、國家、裝置類型跟 Core Web Vitals 都有。雖然沒提供 Google Analytics 那種繁複的事件追蹤或轉換漏斗，但寫 blog 用不上那些，還能順手把 cookie consent banner 整塊拔掉。

<Figure src="/blog-images/image.webp" alt="" width={2320} height={1370} caption="Web Analytics" />

---

### Images（圖片轉換）

Cloudflare Images 免費方案的寫法很容易讓人看錯。它送的是「去轉那些放在別處的圖片」，每個月給 5,000 次 unique transformations；圖片儲存跟 delivery 這兩塊都要掏錢買方案才有。

我把這個 blog 的圖片塞在 static assets 裡，讓 `next/image` 的最佳化透過 images binding 直接送進 Cloudflare 的轉換管道：

```jsonc
// wrangler.jsonc
"images": {
  "binding": "IMAGES",
},
```

超過 5,000 次後的反應特別值得留意：原本就在 cache 裡面的轉換會正常吐給使用者，新請求的轉換則直接回傳 `9422` 錯誤，不會偷偷扣你的信用卡。額度到了直接撞硬牆、不生帳單，這個設計我很喜歡。

要注意 unique transformations 是看「原圖 × 參數組合」，如果你的 `sizes` 開了一堆斷點，或者每篇文章都狂塞新圖，這個計數器跳得會比你預期的快很多。

---

### Workers Logs

`observability.enabled` 打開之後，Workers Logs 就會開始收紀錄，免費版每天能吞 200,000 個 log event，資料留 3 天。

```jsonc
// wrangler.jsonc
"observability": {
  "enabled": true,
},
```

保存 3 天基本定死了它的定位。系統炸掉當天進 dashboard 翻 log 沒問題，要是想回頭抓上禮拜的詭異行為就別想了。想做長期儲存，還是得乖乖自己把 log 打去外部服務。

---

## 我先撞到的是哪幾條

把上面這堆東西通通盤過一遍，會發現各服務額度的鬆緊度落差極大。

Worker 每天 10 萬次請求幾乎碰不到，畢竟靜態資產全都不算次數。

D1 給的 500 萬次 rows read 額度也很大方，前提是你該上的索引都有建。至於 Workers Builds 每月 3000 分鐘，還有 Turnstile 的 20 個 widget，普通人用都用不完。

平常需要盯著看的就三條。**Workers 的 10 毫秒 CPU** 是唯一當場把我卡死的一關，而且這跟流量毫無關聯，一個人來也會爆，看的是你在單次 request 裡塞了多少運算。

**Rate limiting 只有 1 條規則**，所以那條規則得放在風險較高的 endpoint 上。

**Images 每月 5000 次轉換**，就看你有沒有先把圖片的尺寸規格收斂好。

Cloudflare 免費方案能扛住的東西比我預想的還要多很多。它幫我省掉一堆「單純為了讓網站活著」的雜事，不必挑 VPS、省去配置 nginx、不用管 HTTPS 憑證，也不必到處比價找 CDN。剩下要動腦的地方是把 cache 擺在對的層次，而那件事本來就該花時間。

10 毫秒那條線我是怎麼過的，還有把 Next.js 塞進 Worker 的其他坑，之後會另外寫一篇文章來聊這件事情。

---

## Reference

1. [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
2. [Static Assets Billing and Limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
3. [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
4. [Workers Builds Limits and Pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
5. [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
6. [Turnstile Plans](https://developers.cloudflare.com/turnstile/plans/)
7. [WAF Rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
8. [Email Routing Limits](https://developers.cloudflare.com/email-routing/limits/)
9. [Cloudflare Images Pricing](https://developers.cloudflare.com/images/pricing/)

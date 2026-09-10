---
title: "用 Cloudflare 免費方案架一個 blog：會用到哪些服務，以及怎麼把 Next.js 塞進去"
subtitle: "你現在看的這個站就跑在免費方案上。先過一遍會用到的服務跟額度，再講 opennextjs 那段我被 10ms CPU 打爆的過程"
description: "Cloudflare 免費方案架 blog 需要的服務：DNS、Workers、Pages、Workers Builds、D1、Turnstile、WAF Rate limiting rules、Web Analytics，加上 Email Routing、Images、Workers Logs。第二部分講 Next.js + @opennextjs/cloudflare 跟 Worker cache 怎麼避開 10ms CPU 限制。"
datetime: "2026-09-10"
readTime: "14 min"
category: "professional"
tags: ["Cloudflare", "Cloudflare Workers", "OpenNext", "Next.js", "D1", "免費方案"]
draft: true
---

## 前言

現在這個 blog 跑在 Cloudflare 免費方案上，包括使用 Next.js 來實現 SSG，用 D1 資料庫來存電子報的訂閱者，也有使用 Turnstile 跟 WAF 來防止機器人跟大流量來打爆 Worker。

這篇文章主要是想分享給那些想嘗試自架部落格，但是想要花較低成本的人。

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

我選擇把 Next.js 架在 Cloudflare Workers，而不是 Pages 上面。

大家想到 Workers，一定會想說它可能比較接近 Cloud Functions 或是 AWS Lambda 這種 serverless 的服務。但其實網頁現在也可以在 Worker 部署，也可以拿來當作 serverless server 使用。

而且很神奇的是，大家想到 Serverless 的 server，一定都會想到它會不會有冷啟動的時間。但是 Cloudflare 在背後做了很多優化，所以大家在進來網站時，幾乎不會有冷啟動的時間。

### 免費方案

免費方案每天給 10 萬個請求，每次呼叫有 10 毫秒 CPU 時間，duration 時間不收錢。

&#x20;10 萬個請求在部落格初期已經很夠用了。除非你是一個流量很大的部落格，不然如果初期只是想嘗試的話，免費方案其實已經很足夠了。

你會想說，圖片、字型、JS Chunk 這些要算錢嗎？

答案是免費，只有真的跑去喚醒 Worker script 的請求才會算錢，幾乎就只有拿頁面的 HTML 的請求才算。

### 10ms 的 CPU 時間

10 毫秒 CPU 時間這條限制比較麻煩一點，我初期在測試的時候，發現只要快速重整幾次，這個 10 毫秒的 CPU 時間很容易就會碰到，造成頁面直接回 HTTP 429。

所以後來就需要用 Worker Cache 來處理這個問題，文章後面會提到。

### 3MB -> 60MiB 的容量

[https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/)

---

## Pages

如果你還覺得「靜態站就是要丟 Cloudflare Pages」，現在狀況不太一樣了。Cloudflare 自己在 Pages 文件首頁就挑明了講：

> Workers supports most Pages use cases and offers a broader feature set. It is Cloudflare's primary platform for building applications. Start new projects with Workers.

Pages 沒有要關，老專案不會炸掉，免費額度也沒縮水：每個月 500 次 build、1 個並行 build、單一站台 20,000 個檔案、單檔最大 25 MiB、每個 project 能綁 100 個自訂網域，流量隨你跑不收錢。純靜態的站丟在 Pages 上面現在照樣跑得好好的。

我沒選 Pages，主要是 Workers 現在支援 Static Assets 了，同一個 Worker 能同時扛靜態檔案跟 SSR。

---

## Workers Builds

這就是 Cloudflare 內建的 CI 工具。綁定 GitHub 後，git push 就自動觸發 build 跟 deploy。免費方案每個月送 3,000 分鐘、1 個並行 build，每次 build 最多跑 20 分鐘。

手邊早就有 GitHub Actions 的話，這功能直接跳過也無所謂。但如果想少維護一份 CI pipeline，3,000 分鐘給個人專案用綽綽有餘。

我這個 blog 整套 build 完差不多一分鐘，一個月推一百次扣掉的額度也才一點點。

---

## D1

Cloudflare 推的 SQLite。免費方案每天有 5,000,000 rows read、100,000 rows written，儲存空間總共給 5 GB。

我拿它來存電子報的訂閱名單。部落格文章在 build 的時候就已經轉成靜態內容，根本用不到資料庫；只有那些「使用者在 runtime 寫進來、之後要撈出來看」的資料才需要，訂閱名單剛好符合這條件。

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

用它比用 reCAPTCHA 舒服很多，大部分時候使用者不用肉眼認紅綠燈，widget 自己在背景就把驗證跑完了。

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

---

## 還會需要的三個

前面列的那八樣算是整個架構的骨架，但剩下這三個，真的是要自己動手踩下去才會發現漏掉。

### Email Routing

如果你想用 `hi@yourdomain.com` 這種掛自己網域的收信地址，Email Routing 能免費幫你把信件轉進 Gmail。每個帳號能驗證 200 個轉發目標信箱、每個網域能配 200 條路由規則，單封收信上限 25 MiB，五分鐘就能拉好設定。

這玩意只管收信不管寄信。網站如果要發驗證信、系統通知或電子報，Email Routing 幫不上忙，必須自己去串第三方服務。我這個 blog 找了 Resend 來送電子報，名單的權威來源依然放在 D1，送去 Resend 的只有驗證通過的 email：

```
D1（名單的權威來源） ──> Worker ──> Resend API ──> 收件者
```

看名字很容易讓人誤會收發信全都一手包辦，等寫到 double opt-in 的驗證信那一步，你就會發現得另外去翻寄信服務來串了。

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

## Next.js + @opennextjs/cloudflare

Workers 底層的 runtime 是 workerd，不是 Node.js。

它缺了完整的 Node API、沒有實體檔案系統，也沒有常駐 process，偏偏 Next.js 的 `next start` 預設下面坐著一台 Node 伺服器。兩邊接不起來，中間就需要轉譯器，`@opennextjs/cloudflare` 就是拿來幹這個的：它吞掉 `next build` 吐出的東西，重新打包成 workerd 能執行的 Worker，外加一整包靜態檔案。

設定入口要顧兩個檔案。先用 `wrangler.jsonc` 跟 Cloudflare 報備東西放哪裡：

```jsonc
// wrangler.jsonc
{
  "main": ".open-next/worker.js",
  "name": "blog",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS",
  },
}
```

`nodejs_compat` 一定得掛上，Next.js 的 runtime 抓了部分 Node 內建模組來用。流量打進來的時候，Cloudflare 會先去翻 `.open-next/assets` 裡面有沒有現成檔案，抓到就直接送出去（免費、完全不算請求數），真的撲空了才會去把 `worker.js` 叫醒。

`open-next.config.ts` 則是負責交代 OpenNext 怎麼編出這個 Worker。這裡藏了一個初次設定保證踩到的雷：

```ts
// open-next.config.ts
config.buildCommand = "next build";
```

要是忘了寫這行，OpenNext 就會傻傻跑去執行 package.json 裡的 `build` script——偏偏那個指令本身就是 `opennextjs-cloudflare build`。兩邊無限遞迴互相 call，直到機器放棄。老老實實指定 `next build`，你敲 `pnpm build` 才能順利吐出 wrangler.jsonc 想要的那包檔案。

本地端開發還有一個地方要補。`next dev` 跑在 Node 環境裡，預設摸不到 `env.NEWSLETTER_DB` 這些 binding，所以記得在 `next.config.ts` 最後補上一行呼叫：

```ts
// next.config.ts
initOpenNextCloudflareForDev();
```

它會默默起一個 workerd 的 proxy，把那些 bindings 灌回 `next dev` 裡面。這時候 D1 預設會指到本地端的 SQLite 檔案，完全不會去碰線上的 production 資料。

---

## Worker + cache：10 毫秒 CPU&#x20;

我第一版 deploy 上去之後，站是活的，但如果有瞬間流量進來就會出現 `Exceeded CPU Time Limits`。

跑進 dashboard 一查，median CPU 落在 28 毫秒左右，對比免費給的 10 毫秒額度直接超標。連續重新整理個幾下就開始噴錯。

抓出原因才發現每個請求都在背後重新 render。文章明明在 build 階段就編好了，Worker 偏偏在每次 request 進來時硬要把 React 重跑一次。Next.js 的 ISR/prerender 機制在 Node 端是靠檔案系統在記快取，搬來 Workers 就沒有硬碟可用。OpenNext 必須由你明講要掛哪一種 incremental cache 實作，沒掛的話快取直接當作不存在。

改法就是加這段：

```ts
// open-next.config.ts
import staticAssetsIncrementalCache
  from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const config = defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
```

### static assets incremental cache

`staticAssetsIncrementalCache` 會把 prerender 好的 HTML 直接塞進 Workers Assets，跟一般靜態產物堆在一塊。這樣請求一到就單純是送檔案，Worker 幾乎不用花力氣去算。

這招也是有代價的：這個 override 徹底沒有 revalidation 的本事，吐出來的永遠是 build 當下產出的內容。但對我這個 blog 來說完全夠用，反正在我重新 redeploy 之前文章都不會變。要是哪天有哪個 route 需要做 on-demand revalidation，就必須改換成 R2 或 KV 版本的 incremental cache。

### enable cache interception

`enableCacheInterception` 算是我省 CPU 的第二招：能被快取的路由在 Worker 很前面的生命週期就直接 response 掉了，根本不用把 Next.js 整套 routing 流程走完。如果你開了 PPR 就不能開這個選項，好在我這個站沒用那玩意。

OpenNext 的 incremental cache 提供了好幾種 override（像 static assets、R2、KV、D1 tag cache 這些），挑選的差別就在於「快取放哪邊」以及「runtime 能不能更新」。下手前想清楚一件事：網站內容到底是不是重新 redeploy 才會改，還是 runtime 隨時會有變動？

### Cloudflare 這邊有三層 cache

摸清楚各層 cache 到底由誰負責，比你在那邊亂灌 cache header 有用得多：

```
瀏覽器
  │
  ├─ Cloudflare 邊緣 cache ← Cache Rules 控制（免費方案 10 條）
  │
  ├─ Workers Assets      ← 靜態檔與 prerender 的 HTML，免費且不計請求數
  │
  └─ Worker
       └─ Cache API（caches.default）← 你在程式裡自己存的
```

**Cache Rules** 是直接在 dashboard 點的，決定邊緣節點要不要把某個 path 快取起來、TTL 要放多久、cache key 怎麼組。免費版給 10 條，管一個 blog 綽綽有餘。

**Workers Assets** 就是剛剛上面提的那層，所有靜態檔跟 prerender HTML 通通躺在這，也是壓低 CPU 消耗最有效的一層。

**Cache API** 則是寫在 Worker code 裡手動去呼叫的：

```js
const cache = caches.default;
const hit = await cache.match(request);
if (hit) return hit;
```

有兩個脾氣要先搞懂。它是 **per data center** 的機制，資料寫進東京的 colo，法蘭克福那台完全拿不到；再加上它只吃 GET，response 裡只要帶有 `Set-Cookie` 預設就不會幫你存。它很適合用來扛那種「算一次很貴、但在各節點各自算一次還能接受」的工作，像打外部 API 拿回來的 response 就很合適。

### 順帶一個 OpenNext 的坑

Next 16.3 預設打開了 `experimental.prefetchInlining`，這個設定一撞上 OpenNext 的 cache interception 就會出包：每次發 `Next-Router-Segment-Prefetch`，後端都吐回整頁完整的 RSC payload，前端 client 判定剛剛要的 prefetch 沒給齊，轉頭又再要一次，兩邊直接卡在無窮迴圈裡狂發請求——這可是活生生發生在真實使用者的分頁裡面。

我的解法很乾脆，在 production 環境直接把它關了：

```ts
// next.config.ts
...(process.env.NODE_ENV === "development" ? {} : { prefetchInlining: false }),
```

追蹤這個 issue 可以看 [opennextjs-cloudflare#1334](https://github.com/opennextjs/opennextjs-cloudflare/issues/1334)，相關修法在 #1348，等官方修復收進去後這段 hack 就能拔掉。會特別把這段寫出來，主要是 OpenNext 一直在後面追 Next.js 的新版，雙方預設值難免偶爾打架，deploy 上去花個幾分鐘盯一下 Workers Logs 跟瀏覽器的 Network 面板，值得。

---

## 我先撞到的是哪幾條

把上面這堆東西通通盤過一遍，會發現各服務額度的鬆緊度落差極大。

每天 100,000 requests 幾乎碰不到，畢竟靜態資產全都不算次數。D1 給的 5,000,000 rows read 額度也很大方，前提是你該上的索引都有建。至於 Workers Builds 每月 3,000 分鐘，還有 Turnstile 的 20 個 widget，普通人用都用不完。

平常需要盯著看的就三條。**Workers 的 10 毫秒 CPU** 是唯一當場把我卡死的一關，而且這跟流量毫無關聯，只要運算太重，一個人來也會爆，看的是你在單次 request 裡塞了多少運算。**Rate limiting 只有 1 條規則**，所以那條規則得放在最貴的 endpoint 上。**Images 每月 5,000 次轉換**，就看你有沒有先把圖片的尺寸規格收斂好。

Cloudflare 免費方案能扛住的東西比我預想的還要多很多。它幫我省掉一堆「單純為了讓網站活著」的雜事——不必挑 VPS、省去配 nginx、不用管憑證續期，也不必到處比價找 CDN。剩下要動腦的地方是把 cache 擺在對的層次，而那件事本來就該花時間。

---

## Reference

1. [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
2. [Static Assets Billing and Limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
3. [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
4. [Workers Builds Limits and Pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
5. [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
6. [Turnstile Plans](https://developers.cloudflare.com/turnstile/plans/)
7. [WAF Rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
8. [Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/)
9. [Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
10. [Email Routing Limits](https://developers.cloudflare.com/email-routing/limits/)
11. [Cloudflare Images Pricing](https://developers.cloudflare.com/images/pricing/)
12. [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)

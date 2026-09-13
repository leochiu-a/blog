---
title: "把 Next.js 搬上 Cloudflare Workers：OpenNext 設定指南與 5 個實戰避坑經驗"
subtitle: "從 CPU Time Limit 10ms 超標到 0ms 靜態回應，紀錄 Next.js 搬上 Cloudflare Workers 的架構優化與踩坑過程。"
description: "用 @opennextjs/cloudflare 把 Next.js 部署到 Cloudflare Workers 的實作筆記：build script 自我遞迴、next dev 拿不到 binding、median CPU 28 毫秒撞上 10 毫秒上限、三層 cache 怎麼分工，以及 prefetchInlining 造成的無窮迴圈。"
datetime: "2026-09-17"
readTime: "12 min"
category: "professional"
tags: ["Cloudflare Workers", "OpenNext", "Next.js", "workerd", "Cache", "部署"]
draft: true
---

<Figure src="/blog-images/gemini-generated-image-3imprz3imprz3imp.webp" alt="" width={2816} height={1536}>

</Figure>

## 前言

你現在看的這個 blog 是基於 Next.js，跑在 Cloudflare Workers 上。

前一篇 [Cloudflare 免費方案架 Blog：服務盤點與免費額度避坑指南](https://leochiu.com/blog/cloudflare-free-tier-stack/)整理了用了哪些服務和免費額度。

這篇會講到在整合 Next.js 到 Cloudflare Workers 上踩到的坑，如果你以前習慣使用 Vercel 來部署 Next.js 的話，這篇也許對你來說會有幫助。

因為 Cloudflare 在整合 Next.js 上，並沒有像 Vercel 這麼無縫，你可能會在過程中遇到一些問題。而這篇會跟大家分享，在架設這個部落格的過程中，我遇到了哪些問題。

以下是我在架設部落格時的套件版本對照：

| 套件                       | 版本           |
| ------------------------ | ------------ |
| `next`                   | 16.3.2       |
| `@opennextjs/cloudflare` | 1.20.2       |
| `wrangler`               | 4.125.0      |
| `react`                  | 19.2.8       |
| `compatibility_date`     | `2026-08-20` |

---

## @opennextjs/cloudflare 的設定檔架構

Workers 底層的 runtime 是 workerd，不是 Node.js。

它沒有完整的 Node API，沒有能跨請求存活的檔案系統，也沒有常駐的 process。但 Next.js 預設的 `next start` 背後需要一台完整的 Node 伺服器。

要把 Next.js 跟 Cloudflare worker 接起來，就需要 `@opennextjs/cloudflare` 這個套件。它把 `next build` 的結果重新重新打包成 workerd 能執行的 Worker，並獨立出一包靜態檔。

### `wrangler.jsonc`

這個檔案就是 worker 的設定檔，像是進入點、靜態檔案等等的資訊：

```jsonc
// wrangler.jsonc
{
  "main": ".open-next/worker.js",
  "name": "blog",
  "compatibility_date": "2026-08-20",
  "compatibility_flags": ["global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS",
  },
}
```

請求進來的時候，Cloudflare 會先去看 `.open-next/assets` 裡面有沒有現成檔案，有的話就直接回傳，就不用算請求次數。沒有時才會去看 `.open-next/worker.js` ，把 worker 叫起來。

### `open-next.config.ts`

另一個檔案 `open-next.config.ts` 負責告訴 OpenNext 怎麼打包出這個 Worker：

```
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({ /** config */ });
```

---

## 踩坑一：build command 無窮迴圈

沒設定 `buildCommand` 的話，OpenNext 預設會跑去執行 `package.json` 裡的 `build` 指令。

但我們在 `package.json` 寫的 `build` 本身就是 `opennextjs-cloudflare build`，然後就會形成無窮迴圈。

最終就會長這樣：

```
沒設 buildCommand

  pnpm build
    └─► package.json "build"
          └─► opennextjs-cloudflare build
                └─► buildCommand 沒設，那就跑 package.json 的 build
                      └─► package.json "build"
                            └─► opennextjs-cloudflare build
                                  └─► ⋯⋯ 直到機器放棄
```

解法是在 `open-next.config.ts` 裡顯式指定編譯指令：

```ts
// open-next.config.ts
config.buildCommand = "next build";
```

指定了之後，才能正常的編譯 Next.js 專案：

```
設了 buildCommand

  pnpm build
    └─► package.json "build"
          └─► opennextjs-cloudflare build
                └─► buildCommand = "next build"
                      └─► next build
                            └─► .open-next/
```

---

## 踩坑二：開發環境摸不到 Cloudflare Bindings

`next dev` 跑在標準 Node.js 環境裡，預設讀不到 `env.NEWSLETTER_DB`、`env.IMAGES` 這些 Cloudflare 專屬的 binding。

要解決這個問題，需要在 `next.config.ts` 最後補上一行初始化呼叫：

```ts
// next.config.ts
initOpenNextCloudflareForDev();
```

這行會在背景啟動一個 `workerd` 的 proxy，把原本抓不到的 bindings 注入回 `next dev` 環境中。此時 D1 預設會自動指向本地端的 SQLite 檔案，完全不會動到線上的 production 資料。

### 附帶一個 Turbopack 的雷

我這個站有一個僅限開發環境使用的訂閱者後台，會 import `wrangler` 的 `getPlatformProxy` 去讀線上 D1。

結果一 import，直接把 `workerd` 那包平台專屬的原生檔案拉進 bundle 裡，導致 Turbopack 無法順利解析，dev server 直接噴 500——甚至連隨便打開一個 README 都會跟著 500。

解法是告訴 Next.js 開發時別把它打包進去，等到 runtime 再以 `require` 載入即可：

```ts
// next.config.ts
serverExternalPackages: ["wrangler"],
```

### 為什麼線上 D1 要拆成另一份設定檔？

那個後台存取線上 D1 時，用的是獨立的 `wrangler.send.jsonc`，裡面的 binding 特別標註了 `remote: true`；而主要設定檔的 binding 則刻意不標，這是在本機開發時防止意外碰觸真實資料的隔離機制。

### 為什麼不用 wrangler 的 named environment？

**Wrangler 的 named environment** 是 Cloudflare 官方提供用來區分不同部署或開發環境（例如 `staging`、`production` 或 `qa`）的機制。

當你將所有環境的設定都寫在同一份 `wrangler.jsonc`（或 `wrangler.toml`）時，就可以透過 named environment 在同一個檔案內定義不同環境的 override 參數。

但是環境區塊內不會自動繼承頂層所定義的 binding，如果你的頂層設定宣告了 `KV`、`D1`、`R2` 三個 binding，但在 `env.staging` 裡面只寫了 `D1`，那麼當你執行 `wrangler deploy --env staging` 時，`staging` 環境的 Worker **完全抓不到** `KV` 與 `R2`。

這也是為什麼在某些較複雜的專案中，開發者會選擇直接拆分成兩份獨立的設定檔，例如 `wrangler.jsonc` 與 `wrangler.send.jsonc`，並透過 `wrangler --config` 指向指定檔案，來避免 named environment 沒對齊 binding 的問題。

---

## 踩坑三：CPU Time Limit 超標（10ms 限制與 SSG 快取失效）

第一版部署上去後，網站看似運作正常，但只要瞬間流量一進來就會跳出 `Exceeded CPU Time Limits`。

進 Dashboard 檢查才發現，median CPU 時間落在 28 毫秒左右，超過免費方案給的 10 毫秒上限。

>> 甚至只要連續重新整理幾次就會開始報錯。

先釐清這個額度的計算方式，它只看 **CPU 實際運算時間**，不包含掛在背景等待的時間。去等外部 API、等待 D1 回傳資料都不會扣這筆額度，可以慢慢等 response，但 CPU 運算不能拉長。

### 為什麼已經用 Server Side Generation（SSG）還是會踩到 10ms 的上限？

**1. 預設的 incrementalCache 是 `"dummy"`**

Next.js 在傳統 Node.js 環境中，SSG/ISR 的快取與預先渲染產物是寫在本機硬碟上的。

但 Cloudflare Workers 底層的 `workerd` 是 Serverless 環境，沒有跨請求的硬碟。OpenNext 在沒特別設定時，`incrementalCache` 預設會退回到 `"dummy"`，也就是「假的快取」。

當快取實作是空的，即便你在 build 階段預先算好了 HTML，Worker 找不到快取備份，就會認為「這頁需要即時渲染」，進而在每次 request 進來時重新執行 React 伺服器端渲染。

**2. Workers Assets 沒有拿到 SSG 的產物**

在預設部署下，Cloudflare 只有 `public/` 目錄下的靜態資產（如圖片、字型、CSS/JS chunk）會被自動丟進 Workers Assets（完全不耗費 CPU 的靜態檔案層）。

Next.js SSG 產出的 HTML 頁面如果沒有透過 `@opennextjs/cloudflare` 特定的 override 把它們複製到 static assets 目錄，Cloudflare 的邊緣節點就不會把它們當成「靜態檔案」直接吐給使用者，而是繼續把請求丟給 `worker.js` 去運算。

### 把 SSG 與 Workers 串起來

這就是為什麼需要在 `open-next.config.ts` 掛載 `staticAssetsIncrementalCache` 與開啟 `enableCacheInterception`：

```ts
// open-next.config.ts
import staticAssetsIncrementalCache
  from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const config = defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
```

設定完成後，SSG 產出的 HTML 就會真正回到 **Workers Assets** 這一層：

- **設定前：** 請求 ➔ 打到 Worker ➔ 無法讀取硬碟快取 ➔ 重新執行 React SSR ➔ 消耗 28ms CPU。
- **設定後：** 請求 ➔ 打到 Workers Assets ➔ 發現現成 static HTML ➔ 直接回傳（0ms CPU、不扣免費額度）。

### Static Assets Incremental Cache

> 負責「把快取放在哪裡（Storage）

`staticAssetsIncrementalCache` 會把 prerender 好的 HTML 直接塞進 Workers Assets，跟一般靜態資產堆在一起。這樣請求一到就單純是回應靜態檔案， Worker 幾乎不需要耗費 CPU 去運算。

### Enable Cache Interception

> 負責「什麼時候讀取快取（Execution Layer）

開啟 `enableCacheInterception: true` 後，`@opennextjs/cloudflare` 會在 Worker 接到 Request 的第一時間（尚未載入/執行 Next.js 完整 Routing 前），直接去檢查是否有符合該路徑的快取（如 prerender 的 HTML / RSC payload）

**Cache Hit 時**，Worker 直接回傳快取的 Response，立即結束請求。**完全不執行 Next.js 的路由邏輯**，CPU 消耗幾乎降為 0ms。

---

## 踩坑四：Prefetch Inlining 導致 Request 無窮迴圈

Next 16.3 預設啟用了 `experimental.prefetchInlining`，這個設定一撞上 OpenNext 的 cache interception 就會出問題：每次發送 `Next-Router-Segment-Prefetch` 請求時，後端都吐回整頁完整的 RSC payload。

前端 client 判定剛剛要的 prefetch 沒拿齊，轉頭又再要一次，結果兩邊直接陷入無窮請求迴圈。

我的解法是在 production 環境直接把它關了：

```ts
// next.config.ts
...(process.env.NODE_ENV === "development" ? {} : { prefetchInlining: false }),
```

只在 production 關閉是有原因的。

這個迴圈源自 OpenNext 的 cache interception，而該機制只有在部署後的 Worker 才會生效。反過來如果在本地開發環境把它關了，會打壞 Next.js 的 `global-not-found` 處理。

此時 Router 會額外去請求該 URL 的 segment payload，但在開發環境拿不到 404 頁面，只能拿到 404 HTML，導致 Router 不斷觸發全頁重載。

追蹤這個 issue 可以看 [opennextjs-cloudflare#1334](https://github.com/opennextjs/opennextjs-cloudflare/issues/1334)。

---

## 坑五：OpenNext 一直在追趕 Next.js 的版本相容性

上面 prefetch 的問題並非特例，而是這套架構的常態：OpenNext 永遠在後面追趕 Next.js 的新版本。當雙方的預設值產生衝突時，通常不會反應在 build 階段的 log 裡，而是要等到部署上線後才會暴露出來。

因此部署完成後，可能需要關注意一下 Workers Logs，Workers Logs 免費方案每天能處理 200,000 個 event、資料保留 3 天，3 天對這種情境已相當足夠。

---

## 總結

把 Next.js 搬上 Cloudflare Workers，最難的地方其實跟原本想的不太一樣。

原本我以為會先了解架一個部落格需要使用哪些服務，但是在架 Blog 的時候才發現，問題都是一些很瑣碎的事情：

- 了解到 Cloudflare Workers 的底層不是 Node.js，而是 workerd。且免費方案有嚴格的 10ms CPU 時間限制。
- Next.js 在整合上 Cloudflare Workers 時，要實作 Cache 機制不能依賴 CDN，而是要搞清楚 worker cache 的機制
- Next.js 跟 OpenNext 的版本差異也是潛在問題，不管是用 `serverExternalPackages` 避開 Turbopack 原生套件打包，還是指定 `buildCommand` 避免打包的無窮迴圈，都說明 Cloudflare 跟 Next.js 的整合並非這麼無縫。

但自己使用 Cloudflare 架設之後，也確實更了解了它提供的生態系，它提供的服務真的蠻完整的。

如果你有興趣使用 Cloudflare 來架設自己的部落格，也可以參考我的另外一篇文章：[用 Cloudflare 免費方案架 Blog：服務盤點與免費額度避坑指南](/blog/cloudflare-free-tier-stack/)。

---

## Reference

1. [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)
2. [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
3. [Static Assets Billing and Limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
4. [Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
5. [Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/)
6. [opennextjs-cloudflare#1334](https://github.com/opennextjs/opennextjs-cloudflare/issues/1334)
7. [OpenNext for Cloudflare — Caching](https://opennext.js.org/cloudflare/caching)

---
title: "把 Next.js 搬上 Cloudflare Workers：opennextjs 的設定，跟我踩到的五個坑"
subtitle: "workerd 不是 Node，10 毫秒 CPU 也不是開玩笑的。這篇是這個站從跑不動到跑得穩的過程"
description: "用 @opennextjs/cloudflare 把 Next.js 部署到 Cloudflare Workers 的實作筆記：build script 自我遞迴、next dev 拿不到 binding、median CPU 28 毫秒撞上 10 毫秒上限、三層 cache 怎麼分工，以及 prefetchInlining 造成的無窮迴圈。"
datetime: "2026-09-17"
readTime: "12 min"
category: "professional"
tags: ["Cloudflare Workers", "OpenNext", "Next.js", "workerd", "Cache", "部署"]
draft: true
---

## 前言

你現在看的這個 blog 是 Next.js，跑在 Cloudflare Workers 上。前一篇[用 Cloudflare 免費方案架一個 blog](/blog/cloudflare-free-tier-stack/)盤點了會用到哪些服務跟各自的免費額度，這篇講另外一半：怎麼把 Next.js 塞進去，還有我在這條路上踩到的坑。

難的不是部署，難的是 10 毫秒。我第一版丟上去的站是活的，但 median CPU 落在 28 毫秒，對著免費方案給的 10 毫秒上限。後面大半篇都在講怎麼把這個數字壓下來。

---

## workerd 不是 Node.js

Workers 底層的 runtime 是 workerd，不是 Node.js。

它缺了完整的 Node API、沒有實體檔案系統，也沒有常駐 process，偏偏 Next.js 的 `next start` 預設下面坐著一台 Node 伺服器。兩邊接不起來，中間就需要轉譯器，`@opennextjs/cloudflare` 就是拿來幹這個的：它吞掉 `next build` 吐出的東西，重新打包成 workerd 能執行的 Worker，外加一整包靜態檔案。

設定入口要顧兩個檔案。先用 `wrangler.jsonc` 跟 Cloudflare 報備東西放哪裡：

```jsonc
// wrangler.jsonc
{
  "main": ".open-next/worker.js",
  "name": "blog",
  "compatibility_date": "2026-08-20",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS",
  },
}
```

我這份設定裡的 `nodejs_compat` 其實是多餘的，下一節會解釋。流量打進來的時候，Cloudflare 會先去翻 `.open-next/assets` 裡面有沒有現成檔案，抓到就直接送出去（免費、完全不算請求數），真的撲空了才會去把 `worker.js` 叫醒。

另一個檔案 `open-next.config.ts` 負責交代 OpenNext 怎麼編出這個 Worker。下面五個坑有四個跟它有關。

### nodejs_compat 現在不用自己寫了

早期把 Next.js 丟上 Workers，第一件事就是掛 `nodejs_compat`，不然 Next.js runtime 用到的那些 Node 內建模組全都 import 不到。

現在不用了。`compatibility_date` 只要是 **2026-08-04** 或之後，`nodejs_compat` 跟 `nodejs_compat_v2` 都預設開啟，文件寫得很直白：既有專案不需要把 flag 拿掉，但新的設定就別再寫了。我這個站的 compatibility date 是 `2026-08-20`，所以上面那行 flag 留著純粹是沒清掉。

### 而且那些模組不再是 polyfill

比 flag 更值得知道的是底下的實作換掉了。Cloudflare 重寫了 workerd 的 module registry，`import { Buffer } from "node:buffer"` 這種寫法拿到的是**內建在 workerd 裡的原生模組**，不是被打包進你 bundle 的 polyfill。用官方的說法是「a module that is built into `workerd`. It is not bundled into your code as a polyfill」。

這一輪還一起帶進來 URL 形式的 module specifier、完整的 `import.meta`（含 `import.meta.url`、`import.meta.main`、`import.meta.resolve()`）、模組改成第一次被 import 才編譯，以及 V8 isolate 副本之間共用 code cache。要提早吃到完整的新 registry 得自己開 flag，它沒有綁 compatibility date：

```jsonc
// wrangler.jsonc
"compatibility_flags": ["new_module_registry"],
```

所以「workerd 不是 Node.js」這句話還是對的——它沒有檔案系統、沒有常駐 process——但「Node 的 API 在上面是一層薄薄的 shim」這個印象已經過期了。原生實作用 TypeScript 跟 C++ 寫在 runtime 裡，行為往 Node 對齊，順便省掉 polyfill 佔的那份 bundle 體積跟記憶體。

---

## 坑一：build script 自己呼叫自己

```ts
// open-next.config.ts
config.buildCommand = "next build";
```

要是忘了寫這行，OpenNext 就會傻傻跑去執行 package.json 裡的 `build` script——偏偏那個指令本身就是 `opennextjs-cloudflare build`。兩邊無限遞迴互相 call，直到機器放棄。

老老實實指定 `next build`，你敲 `pnpm build` 才能順利吐出 wrangler.jsonc 想要的那包檔案。這個坑第一次做一定會踩，而且錯誤訊息不會告訴你發生什麼事，你只會看到終端機卡住然後風扇開始轉。

---

## 坑二：next dev 摸不到 binding

`next dev` 跑在 Node 環境裡，預設摸不到 `env.NEWSLETTER_DB`、`env.IMAGES` 這些 Cloudflare binding，所以記得在 `next.config.ts` 最後補上一行呼叫：

```ts
// next.config.ts
initOpenNextCloudflareForDev();
```

它會默默起一個 workerd 的 proxy，把那些 bindings 灌回 `next dev` 裡面。這時候 D1 預設會指到本地端的 SQLite 檔案，完全不會去碰線上的 production 資料。

### 附帶一個 Turbopack 的雷

我這個站有一個 dev-only 的訂閱者後台，會 import `wrangler` 的 `getPlatformProxy` 去讀線上的 D1。結果一 import 就把 workerd 那包平台專屬檔案拖進 bundle，Turbopack 解析不動，dev server 直接 500——而且是打開一個 README 就 500。

修法是叫 Next 別打包它，runtime 再 require 就好：

```ts
// next.config.ts
serverExternalPackages: ["wrangler"],
```

### 為什麼線上 D1 是另一個設定檔

那個後台讀線上 D1 用的是另一份 `wrangler.send.jsonc`，裡面的 binding 標了 `remote: true`；主設定檔的 binding 刻意不標，這是讓 `next dev` 碰不到真實資料的那道牆。

為什麼不用 wrangler 的 named environment？因為 named environment 不繼承任何 binding。它得把主設定檔的每一個 binding 都抄一份，抄漏了 wrangler 只會警告，然後下次新增 binding 時那份複本就默默過期了。獨立一個檔案、只宣告那兩支功能會用到的東西，反而不會有這個問題。

---

## 坑三：median CPU 28 毫秒，上限 10 毫秒

我第一版 deploy 上去之後，站是活的，但如果有瞬間流量進來就會出現 `Exceeded CPU Time Limits`。

跑進 dashboard 一查，median CPU 落在 28 毫秒左右，對比免費給的 10 毫秒額度直接超標。連續重新整理個幾下就開始噴錯。

先講清楚這個額度在算什麼：它計費看 CPU 運算時間，不看掛在那邊等的時間。你去等外部 API、等 D1 回傳都不扣這筆，可以慢慢等 response，但運算時間不能拉長。也因為它跟流量無關，一個人來也會爆。

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

---

## 坑四：prefetch 打成無窮迴圈

Next 16.3 預設打開了 `experimental.prefetchInlining`，這個設定一撞上 OpenNext 的 cache interception 就會出包：每次發 `Next-Router-Segment-Prefetch`，後端都吐回整頁完整的 RSC payload，前端 client 判定剛剛要的 prefetch 沒給齊，轉頭又再要一次，兩邊直接卡在無窮迴圈裡狂發請求——這可是活生生發生在真實使用者的分頁裡面。

我的解法很乾脆，在 production 環境直接把它關了：

```ts
// next.config.ts
...(process.env.NODE_ENV === "development" ? {} : { prefetchInlining: false }),
```

只關 production 是有原因的。這個迴圈存在於 OpenNext 的 cache interception，那東西只有在部署後的 worker 裡才有；反過來在本機關掉它會弄壞 `global-not-found`，router 會另外去要這個 URL 的 segment payload，被 bypass 掉的 404 頁給不出來，回來的是 404 HTML，router 於是重新載入頁面——一秒十二次，只要分頁開著就一直跑。

追蹤這個 issue 可以看 [opennextjs-cloudflare#1334](https://github.com/opennextjs/opennextjs-cloudflare/issues/1334)，相關修法在 #1348，等官方修復收進去後這段 hack 就能拔掉。

---

## 坑五：OpenNext 一直在追 Next.js

上面那個 prefetch 的坑不是孤例，它是這整件事的縮影。OpenNext 在後面追 Next.js 的新版，雙方預設值難免偶爾打架，而打架的結果通常不會出現在 build log 裡，要到部署之後才看得到。

所以我養成一個習慣：deploy 完花幾分鐘盯一下 Workers Logs 跟瀏覽器的 Network 面板。上面那個一秒十二次的迴圈，build 完全正常、Lighthouse 也不會抱怨，是在 Network 面板上看到同一個請求一直重複才抓到的。

Workers Logs 免費方案每天收 200,000 個 event、只留 3 天。3 天對這種用途剛好，反正這類問題都是部署當下就會浮出來。

---

## 這一輪學到的

把 Next.js 放上 Workers，難的地方跟我原本以為的不一樣。我以為會卡在 API 相容性——哪個 Node 模組不能用、哪個套件要換掉——結果 `nodejs_compat` 幾乎都處理掉了。

要花時間的是搞懂「這個請求在 Worker 裡做了多少事」。10 毫秒 CPU 逼你把每一份運算都攤開來看：這個頁面為什麼要在 runtime render？這份資料為什麼不能在 build 時就算好？能不能在碰到 Next.js 的 router 之前就回答掉？

這些問題就算沒有 10 毫秒的限制也該問，只是有了限制之後，你會被迫問。

服務清單跟免費額度的部分在另一篇：[用 Cloudflare 免費方案架一個 blog，會用到哪些服務](/blog/cloudflare-free-tier-stack/)。

---

## Reference

1. [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)
2. [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
3. [Static Assets Billing and Limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
4. [Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
5. [Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/)
6. [opennextjs-cloudflare#1334](https://github.com/opennextjs/opennextjs-cloudflare/issues/1334)
7. [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
8. [How we rebuilt Cloudflare Workers' module registry for Node.js compatibility](https://blog.cloudflare.com/workers-module-registry-nodejs/)
9. [A year of improving Node.js compatibility in Cloudflare Workers](https://blog.cloudflare.com/nodejs-workers-2025/)

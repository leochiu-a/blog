---
title: "CodeReel：讓程式碼自己動起來！打造瀏覽器端的 Code 動畫與 MP4 匯出工具"
subtitle: "不用後端伺服器！聊聊怎麼用 Shiki Magic Move 與 WebCodecs 在前端完成繪製與影片封裝"
description: "CodeReel 是開源的瀏覽器工具，把程式碼變成逐步轉場動畫，可匯出圖片或 MP4。這篇聊使用方式，以及 Shiki Magic Move 和純前端輸出影片的實作。"
ogImage: "/blog-images/codereel-hero.webp"
datetime: "2026-09-26"
readTime: "5 min"
category: "professional"
tags: ["CodeReel", "Shiki", "Magic Move", "Next.js", "Side Project"]
draft: true
---

<Figure src="/blog-images/codereel-hero.webp" alt="CodeReel 的封面：左邊是大字 Code that moves.，moves 用粉紅色斜體，右邊是一個傾斜的程式碼框，中間那一行被粉紅色高亮" width={1280} height={720} hero />

## 為什麼做 CodeReel：讓程式碼動起來

最近開源了一個小工具 [CodeReel](https://codereel.dev)，可以把程式碼做成一步一步會動的動畫。

平常想分享一段程式碼，多半會用 [ray.so](https://www.ray.so/) 或 [carbon](https://carbon.now.sh/) 這類工具，把程式碼轉成好看的圖片。但要展示程式碼是怎麼改的時候，只有圖片不太夠，讀的人得在兩張截圖之間來回比對，才看得出到底改了哪裡。

所以我就想，能不能讓程式碼直接動起來，改了什麼一眼就看得到。

像下面這段影片，就是用 CodeReel 做的 ES2026 新 API `getOrInsert(key, defaultValue)` 示範：

<Clip src="/blog-videos/codereel-showreel-getorinsert.mp4" poster="/blog-images/codereel-showreel-getorinsert-poster.webp" width={1280} height={760} />

如果對實作有興趣，原始碼放在 GitHub 上：

<LinkCard href="https://github.com/leochiu-a/code-reel" title="GitHub - leochiu-a/code-reel: Animate code step by step in the browser — no sign-up, no upload." description="Animate code step by step in the browser — no sign-up, no upload. - leochiu-a/code-reel" site="GitHub" image="/blog-images/og-github-com.webp" />

---

## CodeReel 怎麼用：建立步驟、匯出圖片與 MP4

### 建立 code steps

每個「步驟」就是一個版本的程式碼，直接在編輯器裡面新增程式碼，再用下面的工具新增、切換或刪除步驟。

舉例來說，把 media query 的新舊寫法做成程式碼動畫，可以拆成兩個步驟：

**Step 1**：舊的寫法

```css
.section {
  @media (min-width: 300px)  and (max-width: 500px) {
    /* styles for the card */
  }
}
```

**Step 2**：改成 range syntax

```css
.section {
  @media (300px <= width <= 500px) {
    /* styles for the card */
  }
}
```

播放後就能清楚看到語法變更的軌跡，編輯時也可以隨時預覽動畫，確認效果是否符合預期。

<Clip src="/blog-videos/codereel-showreel-media-query.mp4" poster="/blog-images/codereel-showreel-media-query-poster.webp" width={1262} height={720} />

除了程式碼動畫外，也可以自訂外框 padding、陰影、程式語言，並內建了 30 種配色主題（包含 Dracula、Night Owl，以及仿 Vercel、Tailwind、Prisma 官網的風格）。

> 感謝 [ray.so](https://www.ray.so/)、[CodeImage](https://codeimage.dev/) 等等的開源專案

### 分享圖片

做好程式碼動畫之後，可以匯出一個步驟的程式碼圖片，目前支援 PNG、WebP、JPEG，解析度支援從 1x 到 3x。

也可以直接複製圖片，貼進 Slack、文件或任何你想要分享圖片的地方。

<Figure src="/blog-images/codereel-export.webp" alt="editor 右上角的 Export Image 面板，Format 選在 PNG，Scale 選在 2x，下方是綠色的 Export 按鈕" width={2400} height={1400} caption="Export Image 的格式和倍率選項" />

### 分享影片

想分享程式碼動畫，可以把動畫輸出成 MP4，一樣可以選 1x 到 3x 的解析度。

而且匯出的影片實測檔案大小都在幾百 KB，很適合放在部落格中展示。

<Figure src="/blog-images/codereel-video-export.webp" alt="editor 右上角的 Export Video 面板，Resolution 選在 2x，下方是綠色的 Export 按鈕" width={2400} height={1400} caption="Export Video 的解析度選項" />

---

## 技術挑戰 1：怎麼讓程式碼動起來

### Shiki

[Shiki](https://shiki.style) 是一個 code highlight 的套件，用的是跟 VS Code 一樣的 TextMate grammar 和主題。

它也支援幾乎所有 VS Code 的主題，CodeReel 的 30 種主題有不少就是從這裡來的。

CodeReel 不直接用它輸出的 HTML，而是用 `codeToTokens` 拿到每個 token 的內容和顏色，再交給下一步的動畫處理。

### Shiki magic move

動畫的部分用的是 [Shiki Magic Move](https://github.com/shikijs/shiki-magic-move)，它的做法是先用 Shiki 把前後兩段程式碼切成 token，再對兩邊做 diff：配對到的 token 從舊位置滑到新位置，沒配對到的就淡入或淡出。

一般的淡入淡出會把整段程式碼一起換掉，Magic Move 則讓沒改的字留在原地，這也是 CodeReel 想要的效果。

### 遇到的一個合併 token 的問題

接起來之後我遇到一個問題，以前面的 media query 為例，兩邊的 `@media (` 完全沒變，照理說應該留在原地。

但是像 Vercel 這種用色很少的主題，Shiki 會把相鄰、顏色相同的 scope 合成一個 token，於是 Before 的 `@media (` 跟 After 的 `@media (300px <=` 變成兩個不一樣的 token，前後配不起來，整段只好淡出再淡入。

我的解法是改成照語法的 scope 切 token，Shiki 的 `includeExplanation` 會附上每個 token 對應的 scope，用它把 token 再拆開，切法就不會跟著主題的配色改變。

```ts
const result = highlighter.codeToTokens(code, {
  lang,
  theme,
  includeExplanation: "scopeName",
});
```

---

## 技術挑戰 2：怎麼不靠 Server 就輸出 MP4

一開始想說要用 puppeteer 跟 ffmpeg 在後端生成影片讓使用者下載，但這樣不僅吃伺服器資源、部署成本高，還得把使用者的程式碼傳到後端（有隱私疑慮）。

所以第一版當時先選擇不做生成影片，讓使用者自己用錄影工具錄，至少是一個最小可行性產品（MVP）。

後來第二版我發現可以把影片輸出做在前端：

1. 在畫面外把動畫一格一格 render 出來，跟圖片匯出一樣，用 [modern-screenshot](https://github.com/qq15725/modern-screenshot) 把每一格畫到 canvas 上
2. 用瀏覽器內建的 WebCodecs 把 canvas 編碼成影片，再交給 [mediabunny](https://mediabunny.dev) 封裝成 MP4

### modern screenshot

很多人在找 HTML to image 的套件時，第一時間會找到 [html-to-image](https://github.com/bubkoo/html-to-image) 這個套件，雖然他的星星數比較多，而且下載量較高，但以前使用他的經驗不太好。

曾經遇到過一個匯出的問題，但是 PR 開了之後過了許久都沒人看。

所以後來就選擇它的 fork 版本 [modern-screenshot](https://github.com/qq15725/modern-screenshot)，issue 更少，而且今年還有在維護。

### mediabunny

我使用 [mediabunny](https://mediabunny.dev) 負責把編碼好的影片封裝成 MP4，全部都在瀏覽器裡完成，就不需要依靠 puppeteer 跟 ffmpeg。

這裡有兩個實作上的小小優化：

- 停留中的步驟每一格長得都一樣，所以只會截一次圖，剩下的直接重複編碼同一張 canvas，省下不少時間
- 編碼器則會依序挑 H.264、VP9、AV1，看瀏覽器支援哪一個，都不支援才會提示無法匯出

---

## 用 Opus 5.5 做了一個 CodeReel 的宣傳影片

最近 Opus 5.5 很紅，我就想試試看，用它來做介紹影片會做成什麼樣子。我給它的 prompt 是這樣：

> make a dynamic motion graphics video that shows what an incredible motion designer you are, and also introduce this product, like it's your showreel for a résumé. go all out.

<VideoEmbed src="https://www.youtube.com/embed/Ie6jQPVFerE" title="CodeReel 介紹影片" width={640} height={360} />

在做這個宣傳影片時，原本只是想說試試看 Opus 5.5 能做到什麼樣子，但沒想到他生成的效果比我想像中更好。

後續我有持續在微調這個影片，因為 AI 不擅長「看出」或是「聽出」有哪裡不太順，像是節奏感或是視覺流暢度等，所以後續還是需要根據人的感官輔助 AI 看到更多的上下文。

---

## 結語

最初做這個專案，只是想做些吸睛的程式碼動畫發在社群上。

雖然現在已經是 2026 年，大家都直接讓 AI 寫 Code、越來越少人會逐行讀程式碼了 😅，但我還是把這個專案整理出來開源，讓有需要的人玩玩看。

對程式碼動畫有興趣的人歡迎到 [codereel.dev](https://codereel.dev) 玩玩看。

editor 裡有回饋按鈕，想要的功能或遇到問題都可以直接開 GitHub issue，覺得好用也歡迎到 [GitHub](https://github.com/leochiu-a/code-reel) 給顆星星。

<LinkCard href="https://github.com/leochiu-a/code-reel" title="GitHub - leochiu-a/code-reel: Animate code step by step in the browser — no sign-up, no upload." description="Animate code step by step in the browser — no sign-up, no upload. - leochiu-a/code-reel" site="GitHub" image="/blog-images/og-github-com.webp" />

---

## Reference

- [Shiki](https://shiki.style)
- [shikijs/shiki-magic-move](https://github.com/shikijs/shiki-magic-move)
- [qq15725/modern-screenshot](https://github.com/qq15725/modern-screenshot)
- [bubkoo/html-to-image](https://github.com/bubkoo/html-to-image)
- [mediabunny](https://mediabunny.dev)
- [WebCodecs API - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [leochiu-a/code-reel](https://github.com/leochiu-a/code-reel)

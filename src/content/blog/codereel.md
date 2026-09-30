---
title: "CodeReel：把程式碼變成會動的逐步解說"
subtitle: "寫好每個步驟、按下播放，看程式碼自己滑到定位。順便聊聊怎麼在瀏覽器裡輸出 MP4，以及用到的 Shiki、Magic Move 和 modern-screenshot"
description: "CodeReel 是一個在瀏覽器裡把程式碼做成逐步解說動畫的開源工具：分步驟寫程式碼、高亮重點行、用 Magic Move 播放，再匯出圖片或 MP4 影片。這篇介紹它怎麼用、怎麼在瀏覽器裡輸出影片，以及核心用到的 Shiki、Shiki Magic Move 和 modern-screenshot。"
ogImage: "/blog-images/codereel-hero.webp"
datetime: "2026-09-26"
readTime: "5 min"
category: "professional"
tags: ["CodeReel", "Shiki", "Magic Move", "Next.js", "Side Project"]
draft: true
---

## 前言

最近開源了一個小工具 [CodeReel](https://codereel.dev)，可以把程式碼做成一步一步會動的動畫。

平常想分享一段程式碼，多半會用 [ray.so](https://www.ray.so/) 或 [carbon](https://carbon.now.sh/) 這類工具，把程式碼轉成好看的圖片。但要展示程式碼是怎麼改的時候，只有圖片不太夠，讀的人得在兩張截圖之間來回比對，才看得出到底改了哪裡。

所以我就想，能不能讓程式碼直接動起來，改了什麼一眼就看得到。

像下面這段影片，就是用 CodeReel 做的 ES2026 新 API `getOrInsert(key, defaultValue)` 示範：

<Clip src="/blog-videos/2026-09-26-5-50-16.mp4" poster="/blog-images/2026-09-26-5-50-16-poster.webp" width={1280} height={760} />

如果對實作有興趣，原始碼放在 GitHub 上：

<LinkCard href="https://github.com/leochiu-a/code-reel" title="GitHub - leochiu-a/code-reel: Animate code step by step in the browser — no sign-up, no upload." description="Animate code step by step in the browser — no sign-up, no upload. - leochiu-a/code-reel" site="GitHub" image="/blog-images/og-github-com.webp" />

---

## 產品亮點

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

播放之後就能看出原本 `min-width` 和 `max-width` 是怎麼變成 range query 的，可以讓使用者一邊建立程式碼步驟，也可以確認動畫效果是否符合預期。

<Clip src="/blog-videos/area-2026-09-30-12-35-46.mp4" poster="/blog-images/area-2026-09-30-12-35-46-poster.webp" width={1262} height={720} />

這個工具還提供可以調整 padding、陰影、程式語言...等等。

也提供可以更換 30 種主題，除了 Dracula、Night Owl 這類常見配色，也有仿 Vercel、Tailwind、Prisma 官網的外框。

> 感謝 [ray.so](https://www.ray.so/)、[https://codeimage.dev/](CodeImage.dev) 等等的開源專案

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

一開始想說要用 puppeteer 跟 ffmpeg 在後端生成影片讓使用者下載，但是遇到的難題是伺服器運算資源不夠，而且這樣使用者的程式碼就得傳到後端，在選擇部署服務時就必須要選擇支援雲端運算的服務。

所以第一版當時先選擇不做生成影片，讓使用者自己用錄影工具錄，至少是一個最小可行性產品（Minimum Viable Product, MVP）。

後來第二版我選擇把影片輸出做在前端：

1. 在畫面外把動畫一格一格 render 出來，跟圖片匯出一樣，用 [modern-screenshot](https://github.com/qq15725/modern-screenshot) 把每一格畫到 canvas 上
2. 用瀏覽器內建的 WebCodecs 把 canvas 編碼成影片，再交給 [mediabunny](https://mediabunny.dev) 封裝成 MP4

### modern screenshot

很多人在找 HTML to image 的套件時，第一時間會找到 [html-to-image](https://github.com/bubkoo/html-to-image) 這個套件，雖然他的星星數比較多，而且下載量較高，但以前使用他的經驗不太好。

曾經遇到過一個匯出的問題，但是 PR 開了之後過了許久都沒人看。

所以後來就選擇它的 fork 版本 [modern-screenshot](https://github.com/qq15725/modern-screenshot)，issue 更少，而且今年還有在維護。

### mediabunny

我使用 [mediabunny](https://mediabunny.dev) 負責把編碼好的影片封裝成 MP4，全部都在瀏覽器裡完成，就不需要依靠 puppeteer 跟 ffmpeg。

有兩個小地方值得一提：

- 停留中的步驟每一格長得都一樣，所以只會截一次圖，剩下的直接重複編碼同一張 canvas，省下不少時間
- 編碼器則會依序挑 H.264、VP9、AV1，看瀏覽器支援哪一個，都不支援才會提示無法匯出

---

## 用 Opus 5.5 做了一個 CodeReel 的宣傳影片

最近 Opus 5.5 很紅，我就想試試看，用它來做介紹影片會做成什麼樣子。我給它的 prompt 是這樣：

> make a dynamic motion graphics video that shows what an incredible motion designer you are, and also introduce this product, like it's your showreel for a résumé. go all out.

<VideoEmbed src="https://www.youtube.com/embed/Ie6jQPVFerE" title="CodeReel 介紹影片" width={640} height={360} />

---

## 結語

CodeReel 還在持續更新，歡迎到 [codereel.dev](https://codereel.dev) 玩玩看。editor 裡有回饋按鈕，想要的功能或遇到問題都可以直接開 GitHub issue，覺得好用也歡迎到 [GitHub](https://github.com/leochiu-a/code-reel) 給顆星星。

<LinkCard href="https://github.com/leochiu-a/code-reel" title="GitHub - leochiu-a/code-reel: Animate code step by step in the browser — no sign-up, no upload." description="Animate code step by step in the browser — no sign-up, no upload. - leochiu-a/code-reel" site="GitHub" image="/blog-images/og-github-com.webp" />

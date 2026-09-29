---
title: "CodeReel：把程式碼變成會動的逐步解說"
subtitle: "寫好每個步驟、按下播放，看程式碼自己滑到定位。順便聊聊 Magic Move、純瀏覽器架構，和一支用程式碼寫出來的介紹影片"
description: "CodeReel 是一個在瀏覽器裡把程式碼做成逐步解說動畫的工具：分步驟寫程式碼、高亮重點行、用 Magic Move 播放，再匯出 PNG、WebP 或 JPEG。這篇介紹它怎麼用，以及幕後的三個技術決策：修好 Magic Move 的 token 對齊、拿掉伺服器改成純靜態，和用 Remotion 寫出整支介紹影片。"
ogImage: "/blog-images/codereel-hero.webp"
datetime: "2026-09-26"
readTime: "7 min"
category: "professional"
tags: ["CodeReel", "Shiki", "Magic Move", "Remotion", "Next.js", "Side Project"]
draft: true
---

<Figure src="/blog-images/codereel-hero.webp" alt="CodeReel 的封面：左邊是大字 Code that moves.，moves 用粉紅色斜體，右邊是一個傾斜的程式碼框，中間那一行被粉紅色高亮" width={1280} height={720} hero />

## 前言

[CodeReel](https://codereel.dev) 是一個把程式碼做成逐步解說動畫的工具。

把一段程式碼拆成幾個步驟寫好，按下播放，每一次修改都會「滑」到新的位置：沒改的字留在原地，新加的字淡入，刪掉的字淡出。做好之後可以匯出成圖片，或是直接錄成影片放進簡報、文件和社群貼文。

整個工具都在瀏覽器裡跑，不用註冊，也沒有後端。原始碼放在 [GitHub](https://github.com/leochiu-a/code-reel)。

先看一支不到 30 秒的介紹影片：

<VideoEmbed src="https://www.youtube.com/embed/Ie6jQPVFerE" title="CodeReel 介紹影片" width={640} height={360} />

---

## 怎麼用

打開 editor 後，畫面中間是程式碼框，下面是步驟列，右邊是設定面板。

<Figure src="/blog-images/codereel-editor.webp" alt="CodeReel 的 editor：中間是深色的程式碼框，下方是步驟切換列，右側是主題、語言、版面和視窗設定的面板" width={1760} height={942} caption="CodeReel 的 editor" />

### 1. 分步驟寫程式碼

直接在框裡打字，每個步驟就是一個版本的程式碼。用下面的工具列新增、切換或刪除步驟，例如：

- **Step 1**：一個最簡單的 function
- **Step 2**：加上一行拆步驟的邏輯
- **Step 3**：再加上動畫和分享

### 2. 高亮重點行

點行號就能高亮那一行，其他行會自動變暗。播放時，高亮會跟著步驟移動，觀眾的視線就會跟著落到這一步改動的地方。

<Figure src="/blog-images/codereel-highlight.webp" alt="程式碼框被放大，第三行 const frames = await animate(steps, { fps: 60 }); 被粉紅色高亮，其他行變暗" width={1600} height={900} caption="高亮的那一行保持清楚，其他行變暗（影片畫面）" />

### 3. 按下播放

播放時，CodeReel 會用 Magic Move 在步驟之間做轉場。一般的淡入淡出會把整段程式碼一起換掉；Magic Move 讓沒改的字留在原地，觀眾一眼就看得出這一步多了哪幾個字、少了哪幾個字。

<Figure src="/blog-images/codereel-magic-move.webp" alt="程式碼從 Step 1 變成 Step 2，新增的 const steps = split(code); 那一行被高亮，下方步驟列選在 Step 2" width={1600} height={900} caption="Step 1 滑到 Step 2（影片畫面）" />

### 4. 換主題、匯出

右邊的面板可以換主題和語言（支援 12 種，包括 TypeScript、Python、Rust、Go），調整 padding 和陰影，開關行號和視窗按鈕。主題一共 30 種，除了常見的 Dracula、Night Owl、Poimandres，也有照 Vercel、Tailwind、Prisma、Trigger.dev 官網風格做的外框。

<Figure src="/blog-images/codereel-themes.webp" alt="右側的主題抽屜列出 Vercel、Tailwind、Prisma、Trigger.dev、Synthwave 84、Poimandres、Dracula、Night Owl，目前選在 Tailwind，左邊的程式碼框套用了 Tailwind 的配色和光暈" width={1600} height={900} caption="從主題抽屜挑外觀（影片畫面）" />

做好之後按 Export Image，可以選 PNG、WebP、JPEG，倍率 1x 到 3x；也可以直接複製到剪貼簿貼進 Slack 或文件。

<Figure src="/blog-images/codereel-export.webp" alt="Export Image 的彈出視窗，Format 選在 PNG，Scale 選在 2x，下方是綠色的 Export 按鈕，背景是紫色漸層外框的程式碼卡片" width={1600} height={900} caption="匯出圖片（影片畫面）" />

影片的部分，CodeReel 不會自己輸出 MP4。它提供一個錄影引導，把要錄的範圍框出來，播放動畫時再用 CleanShot、OBS 這類螢幕錄影工具錄下來。為什麼這樣做，下面「全部在瀏覽器裡跑」那段會講。

---

## 幕後技術

### Magic Move：讓沒變的字留在原地

動畫的部分用的是 [Shiki Magic Move](https://github.com/shikijs/shiki-magic-move)。它的做法是先用 Shiki 把前後兩段程式碼切成 token，再對兩邊做 diff：配對到的 token 從舊位置滑到新位置，沒配對到的就淡入或淡出。

接起來之後，我遇到三個「沒改的字卻跑掉了」的問題。

**1. 同一個顏色的 token 被合併。** Shiki 底層的 TextMate 會把相鄰、顏色相同的 scope 合成一個 token。像 Vercel 這種用色很少的主題，`@media (` 跟 `@media (300px <=` 就會變成兩個不一樣的 token，前後配不起來，整段只好淡出再淡入。

我改成照語法的 scope 切 token。Shiki 的 `includeExplanation` 會附上每個 token 對應的 scope，用它把 token 再拆開，切法就不會跟著主題的配色改變。這段的寫法如下：

```ts
const result = highlighter.codeToTokens(code, {
  lang,
  theme,
  includeExplanation: "scopeName",
});

// 照 scope 把每個 token 拆成更小的片段
const tokens = result.tokens.map((line) =>
  line.flatMap(({ explanation, ...token }) => {
    let offset = token.offset;
    return (explanation ?? [{ content: token.content }]).map(({ content }) => {
      const part = { ...token, content, offset };
      offset += content.length;
      return part;
    });
  }),
);
```

**2. diff 的範圍從 token 中間開始。** Magic Move 在配對時只往前看一個 token，只要沒改動的範圍是從某個 token 的中間開始，後面整排就會錯位。打開 `splitTokens` 讓它在範圍邊界把 token 切開就好了。但切得太細又會配到零散的字母，例如 `Before` 和 `After` 共有的 `e`、`r`，所以再加上 `diffCleanupSemantic`，讓 diff 以詞為單位。

**3. 播放幾次之後行會亂掉。** 被切開的片段會拿到 `${key}-${n}` 這種 key，切第二次時可能生出一個別人已經在用的 key。renderer 靠 key 重用 DOM 元素，而且不檢查元素的 tag，於是文字有機會被塞進上一步留下的 `<br>` 裡，整段程式碼縮成一團，要重新整理才會恢復。

解法是每一步 diff 之前都幫前一步的 token 重新編 key，並且每一步用一組全新的 key，確保 key 永遠不會重複使用。

>> 字滑過去的效果，要 tokenizer、diff 和 renderer 三層的切法都對齊才做得出來。

### 全部在瀏覽器裡跑

CodeReel 早期有一個匯出 MP4 的 API：用 Puppeteer 開一個 headless Chrome 播放動畫，再把每一格丟給 ffmpeg 合成影片。這是整個專案需要伺服器和 Docker image 的唯一原因。

後來整理程式碼時，我才發現它已經是死碼。畫面上的「Export Video」按鈕早就改成打開錄影引導，匯出影片的 function 從來沒被呼叫過。

所以我把這條路整個拿掉：API route、兩個匯出用的 hook、headless 專用的版面，連同 Docker 設定、Puppeteer 和 Gemini 的套件一起刪掉。使用者看到的功能完全沒變，但每個頁面都變成可以預先渲染的靜態內容，部署跟維護都簡單很多。

現在三種匯出都在瀏覽器裡完成：

- **圖片**：用 [modern-screenshot](https://github.com/qq15725/modern-screenshot) 把程式碼框畫成 PNG、WebP 或 JPEG
- **複製**：用 Clipboard API 的 `ClipboardItem` 直接把 PNG 寫進剪貼簿
- **影片**：交給使用者自己的螢幕錄影工具，CodeReel 只負責把範圍框好

### 介紹影片也是用程式碼寫的

文章開頭那支影片，我是用 Claude Code 搭配 [Remotion](https://www.remotion.dev) 做的，沒有打開任何剪輯軟體。

Remotion 讓你用 React 寫影片。每一格就是一次 render，`useCurrentFrame()` 告訴你現在是第幾格，所有動畫都是「第幾格該長什麼樣子」的純函式，所以每次輸出的結果都一模一樣。

做這支影片時，我用了三個做法：

- **程式碼的配色是真的。** 影片裡的程式碼是先用 Shiki 和 CodeReel 自己的主題檔跑一次，把 token 存成 JSON，影片再讀進來排版，所以跟產品裡看到的顏色一致。
- **一條時間軸管全部。** 所有場景、轉場、音效的時間點都寫在同一個 `timeline.ts`。影片是 60fps、配樂是 120 BPM，一拍剛好 30 格，所以每個剪接點都落在拍子上。
- **配樂是算出來的。** 沒有用任何音樂素材，kick、hi-hat、whoosh、快門聲都是用一支 Node script 從同一條時間軸合成出 WAV。改了畫面的時間，重跑一次配樂就會自動對齊。

做的過程中也學到一些剪輯的基本功。第一版只有 15 秒，畫面很多但每個都一閃而過，文字停留不到 0.1 秒，根本沒人看得到。後來拉長到 28.5 秒，每個畫面的停留時間都照這條原則重排：

>> 快的轉場留著當節奏，有字的畫面至少停 1.5 到 2 秒。

聲音也一樣。有一段聽起來「卡卡的」，量音量完全看不出問題，最後才發現是某個 kick 比拍子晚了 20 格，剛好跟下一個重拍差 0.17 秒，聽起來就像絆了一下。

影片的原始碼也放在 repo 的 `videos/codereel-showreel`，有興趣可以看看。

---

## 結語

CodeReel 目前還在持續更新，歡迎到 [codereel.dev](https://codereel.dev) 玩玩看。如果有想要的功能或遇到問題，editor 裡有回饋按鈕可以直接開 GitHub issue，也歡迎到 [GitHub](https://github.com/leochiu-a/code-reel) 給顆星星。

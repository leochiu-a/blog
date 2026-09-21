---
title: "為什麼 Linear 與 Tailwind v4 都不再幫按鈕加上 cursor: pointer？"
subtitle: "從一個 CSS 細節，看 Web 與 Native App 介面語彙的演進"
description: "發現升級 Tailwind v4 或用 shadcn 時按鈕都不會變手指游標了嗎？這不是 bug！從 Linear 追求的 Mac 原生手感到 CSS 規格真相，聊聊為什麼按鈕本來就不該是 pointer，以及各大工具是怎麼跟進的。"
datetime: "2026-09-21"
readTime: "4 min"
category: "professional"
tags: ["Linear", "CSS", "Tailwind CSS", "shadcn/ui", "Design System"]
draft: true
ogImage: "/blog-images/linear-no-pointer-cursor-hero.webp"
---

<Figure src="/blog-images/linear-no-pointer-cursor-hero.webp" alt="線條插畫，白底配橘色點綴。一個人背對畫面坐在電腦前，螢幕中央是一個放大的箭頭游標，右側一排按鈕裡有一個顯示手指游標，並用線連到右邊標示 HTML 與 CSS 的面板" width={2752} height={1536} hero />

## Linear 的按鈕都不用 cursor: pointer

在 Linear 的 app 裡，把滑鼠移到 sidebar、issues、toolbar 按鈕上，滑鼠都不會變成 `cursor: pointer`，只有文字連結才會變成 `cursor: pointer`。

所以我就有疑問了，按照印象中，在網頁中只要是可以點擊的項目，幾乎都會變成 `cursor: pointer` 才對。

<Clip src="/blog-videos/linear-no-pointer-cursor-app-demo.mp4" poster="/blog-images/linear-no-pointer-cursor-app-demo-poster.webp" width={1142} height={720} />

---

## Linear 的官方說法

Linear 官方在 2022 年在 X（Twitter）上發過一則推文：

> One of the small preferences we introduced in the Linear app is not displaying the mouse cursor pointer over links. Most of our users never notice it — but to some it feels weird. So we gave them the option to make the switch if they don't like it.

<Figure src="/blog-images/linear-no-pointer-cursor-settings.webp" alt="Linear 的 Display 設定面板，最下面一列是「Use pointer cursors」開關，說明寫著 Change the cursor to a pointer when hovering over any interactive element，目前為開啟狀態" width={1200} height={715} caption="https://x.com/linear/status/1491467491335454729" />

後來這則推文被丟上 [Hacker News 討論](https://news.ycombinator.com/item?id=30183948)，Linear 在串裡補了設計動機：

>> Linear 要**模擬 Mac app 的原生手感**（"mimic the feeling you natively have on the desktop with our Mac app"）

所以他們在設定裡開了兩種模式：

- **Native** — 只有文字連結會變手指，按鈕、側邊欄、toolbar 維持箭頭
- **Web** — 所有可互動元素都變手指

---

## pointer 原本的意思是「導航」

這個決定背後有一段 web 的歷史包袱。

### CSS 規格

`pointer` 這個關鍵字在 CSS2（1998）第一次出現，定義是：[The cursor is a pointer that indicates a link](https://www.w3.org/TR/CSS2/ui.html#propdef-cursor)。它指的是「這是一條超連結，點下去會跑到別的地方」不是「這裡可以點」。

這句定義一路到最新的 [CSS Basic UI Level 3](https://www.w3.org/TR/css-ui-3/) 都還是一樣。

### HTML 渲染規格

而在 [HTML 規格的預設樣式表](https://html.spec.whatwg.org/multipage/rendering.html) 裡，整份 rendering 章節唯一一條 cursor 規則是：

```css
:link, :visited {
  cursor: pointer;
}
```

`button` 預設不會有 pointer 的樣式。

>> 瀏覽器原生的按鈕本來就不會變手指

### 原生 macOS app

原生 macOS app 一直維持著「按鈕不會變成手指」的慣例，你在 macOS 的 Finder 側邊欄、Notes 的清單上移動滑鼠，鼠標從頭到尾都是箭頭。

如果你平常會用 **Claude Desktop、Figma**，他們也是維持著 native 的行為，但在 hover 到可以點擊的區塊時，會出現引導的背景顏色、該區塊的可點擊元素等等。

### Linear

Linear 想要實現的是 native mac app 的體驗，所以 issue row、sidebar、toolbar 按鈕全部維持箭頭，只有內文裡的文字連結才會變成 pointer。

---

## Tailwind 也有一樣的問題

2022 年 7 月 26 日，有人在 Tailwind 開了 [issue #8961](https://github.com/tailwindlabs/tailwindcss/issues/8961)，主張 CSS 規格裡 `cursor: pointer` 的語意是超連結，按鈕不應該套上這個樣式。

隔天 Adam Wathan （Tailwind 作者）自己開了 [PR #8962](https://github.com/tailwindlabs/tailwindcss/pull/8962)，把 preflight 裡 `button` 的 `cursor: pointer` 設定拔掉了。

<Figure src="/blog-images/linear-no-pointer-cursor-tailwind-pr-8962.webp" alt="GitHub 上 adamwathan 在 2022 年 7 月 27 日的留言，說像 Linear 這類 UI-forward 的應用已經改用預設游標，並認為 cursor: pointer 是給連結用的。留言下方的表情反應是 7 個讚、35 個倒讚" width={1810} height={654} caption="https://github.com/tailwindlabs/tailwindcss/pull/8962" />

他寫下的理由是：

> These days though very UI-forward applications like Linear are using the default cursor for buttons and I think this trend will continue as more people become aware that `cursor: pointer` is meant for links.

九天後（2022/08/05）這個 commit 就被 revert 了，commit message 裡面寫了：

> We're undecided on whether or not this should be released right now so we'll revert it and revisit it later.

那則留言底下的倒讚超多，到最後 Tailwind v3，按鈕的 `cursor: pointer` 都還是留著。

---

## Tailwind v4 把按鈕的 `cursor: pointer` 拿掉了

2024 年 7 月，v4 的 `next` branch 裡面，這個樣式設定就被拿掉了。

[PR #14061](https://github.com/tailwindlabs/tailwindcss/pull/14061) 是一位外部貢獻者發現「既然 `cursor: pointer` 沒了，那條為了蓋掉它而存在的 `:disabled { cursor: default }` 也該清掉」，Adam 回了一句 `Good catch, thanks!` 就 merge 了。

後來有人以為這個設定是被默默拿掉的，開了一個討論串 [Silent removal of cursor: pointer](https://github.com/tailwindlabs/tailwindcss/discussions/18182) 想問是怎麼回事。Tailwind 維護者 Robin Malfait 回覆說並不是，在 v4 的 [upgrade guide](https://tailwindcss.com/docs/upgrade-guide#buttons-use-the-default-cursor) 裡有寫到：

> Buttons now use `cursor: default` instead of `cursor: pointer` to match the default browser behavior.

最後這個討論串就這樣結束了。

<Figure src="/blog-images/linear-no-pointer-cursor-tailwind-discussion-18182.webp" alt="GitHub 討論串中 Tailwind 維護者 RobinMalfait 在 2025 年 5 月 30 日的回覆，被標記為答案，內容是「It was not silently removed」並附上 upgrade guide 連結，引述 Buttons now use cursor: default instead of cursor: pointer；發問者回覆 Missed that one, thank you!" width={1862} height={838} caption="https://github.com/tailwindlabs/tailwindcss/discussions/18182" />

---

## shadcn/ui 也沒有處理這個問題

使用 shadcn/ui 的人，升級到 Tailwind v4 陸續發現按鈕 hover 不會變手指了，[issue #7501](https://github.com/shadcn-ui/ui/issues/7501) 有人問了這個修改：

> The (eternal) question is, does this library want to move forward with or without the cursor-pointer rule on buttons?

相關的 bug report 和 PR（[#6843](https://github.com/shadcn-ui/ui/issues/6843)、[#6800](https://github.com/shadcn-ui/ui/pull/6800)、[#7977](https://github.com/shadcn-ui/ui/pull/7977)）最後也都被 close 了，因為其實這些回報的問題都是 feature。

所以 shadcn/ui 的 `<Button>` 沒有 `cursor-pointer`，不是元件庫做了什麼設計抉擇，純粹是因為 Tailwind v4 的改動。

最後 shadcn 在 CLI 加一個開關：

```bash
npx shadcn@latest init --pointer
```

<Figure src="/blog-images/linear-no-pointer-cursor-shadcn-issue-7501.webp" alt="GitHub 上 shadcn 在 5 月 5 日的留言，說已經把它加成 npx shadcn init --pointer 的選項，會觀察一段時間再決定要不要設為預設，並因為重複回報太多而關閉這個 issue" width={1866} height={460} caption="https://github.com/shadcn-ui/ui/issues/7501" />

---

## 小結

最近在研究 Linear 這個產品，使用的時候總覺得有哪裡跟其他的網頁不太一樣，後來發現原來是滑鼠的互動體驗不一樣。

所以就想要研究一下為什麼 Linear 的團隊會這樣選擇，研究到一半時，突然想到每次用 shadcn/ui 做專案時，預設也不會有 `cursor: pointer`，所以我就好奇了，為什麼他們都這樣選擇。

最後發現原因主要有兩個：

- 一個是 CSS 跟 HTML 規範裡面，按鈕本身就沒有定義要帶 `cursor: pointer`
- 另一個是 mac native app 預設也不會改變鼠標，Linear 團隊想要盡量靠近原生的體驗，所以這樣抉擇

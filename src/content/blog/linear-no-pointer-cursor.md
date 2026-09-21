---
title: "為什麼 Linear 的按鈕都不用 cursor: pointer"
subtitle: "從一個 CSS 小細節，看 web app 與桌面 app 的介面語彙差異"
description: "Linear 的 app 裡，滑鼠移到按鈕上不會變成手指游標。這是刻意的設計決策，官方說法是要模擬 Mac app 的原生手感。這篇談 cursor: pointer 的歷史語意、Linear 為什麼敢拿掉它，Tailwind v4 又是怎麼把同一個決定變成全世界的預設值，以及跟著做之前你得先補上什麼。"
datetime: "2026-09-21"
readTime: "10 min"
category: "professional"
tags: ["Linear", "CSS", "cursor pointer", "Tailwind CSS", "shadcn/ui", "UI 設計", "Design System", "可用性"]
draft: true
---

## Linear 的按鈕都不用 cursor: pointer

在 Linear 的 app 裡，把滑鼠移到 sidebar、issues、toolbar 按鈕上，滑鼠都不會變成 `cursor: pointer`，只有文字連結才會變成 `cursor: pointer`。

所以我就有疑問了，按照印象中，在網頁中只要是可以點擊的項目，幾乎都會變成 `cursor: pointer` 才對。

<Clip src="/blog-videos/area-2026-09-20-19-36-19.mp4" poster="/blog-images/area-2026-09-20-19-36-19-poster.webp" width={1142} height={720} />

---

## Linear 的官方說法

Linear 官方在 2022 年在 X（Twitter）上發過一則推文：

> One of the small preferences we introduced in the Linear app is not displaying the mouse cursor pointer over links. Most of our users never notice it — but to some it feels weird. So we gave them the option to make the switch if they don't like it.

<Figure src="/blog-images/image.webp" alt="" width={1200} height={715} caption="https://x.com/linear/status/1491467491335454729" />

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

這句定義一路到最新的的 [CSS Basic UI Level 3](https://www.w3.org/TR/css-ui-3/) 都還是一樣。

### HTML 渲染規格

而在 [HTML 規格的預設樣式表](https://html.spec.whatwg.org/multipage/rendering.html) 裡，整份 rendering 章節唯一一條 cursor 規則是：

```css
:link, :visited {
  cursor: pointer 
}
```

`button` 預設不會有 pointer 的樣式。

>> 瀏覽器原生的按鈕本來就不會變手指

### native mac app

native mac app 一直維持著「按鈕不會變成手指」的慣例，你在 macOS 的 Finder 側邊欄、Notes 的清單上移動滑鼠，鼠標從頭到尾都是箭頭。

如果你平常會用 **Claude Desktop、Figma**，他們也是維持著 native 的行為，但在 hover 到可以點擊的區塊時，會出現引導的背景顏色、該區塊的可點擊元素等等。

### Linear

Linear 想要實現的是 native mac app 的體驗，所以 issue row、sidebar、toolbar 按鈕全部維持箭頭，只有內文裡的文字連結才會變成 pointer。

---

## Tailwind 這個圈子也有一樣的問題

2022 年 7 月 26 日，有人在 Tailwind 開了 [issue #8961](https://github.com/tailwindlabs/tailwindcss/issues/8961)，主張 CSS 規格裡 `cursor: pointer` 的語意是超連結，按鈕不應該套上這個樣式。

隔天 Adam Wathan （Tailwind 作者）自己開了 [PR #8962](https://github.com/tailwindlabs/tailwindcss/pull/8962)，把 preflight 裡 `button` 的 `cursor: pointer` 設定拔掉了。

<Figure src="/blog-images/image-2.webp" alt="" width={1810} height={654} caption="https://github.com/tailwindlabs/tailwindcss/pull/8962" />

他寫下的理由是：

> These days though very UI-forward applications like Linear are using the default cursor for buttons and I think this trend will continue as more people become aware that `cursor: pointer` is meant for links.

九天後（2022/08/05）這個 commit 就被 revert 了，commit message 裡面寫了：

> We're undecided on whether or not this should be released right now so we'll revert it and revisit it later.

那則留言底下的倒讚超多，到最後 Tailwind v3，按鈕的 `cursor: pointer` 都還是留著。

---

## Tailwind v4 偷偷把按鈕的  `cursor: pointer` 拿掉了

2024 年 7 月，v4 的 `next` branch 裡面，這個樣式設定就被拿掉了。

[PR #14061](https://github.com/tailwindlabs/tailwindcss/pull/14061) 是一位外部貢獻者發現「既然 `cursor: pointer` 沒了，那條為了蓋掉它而存在的 `:disabled { cursor: default }` 也該清掉」，Adam 回了一句 `Good catch, thanks!` 就 merge 了。

後來有人發現 Tailwind 默默的移除這個設定，就開了一個討論串 [Silent removal of cursor: pointer](https://github.com/tailwindlabs/tailwindcss/discussions/18182)，想詢問作者這個改動是怎麼回事，後來作者有說他們有在 Tailwind v4 的 [upgrade guide](https://tailwindcss.com/docs/upgrade-guide#buttons-use-the-default-cursor) 裡面寫到：

> Buttons now use `cursor: default` instead of `cursor: pointer` to match the default browser behavior.

最後這個討論串就這樣結束了。

<Figure src="/blog-images/image-1.webp" alt="" width={1862} height={838} caption="https://github.com/tailwindlabs/tailwindcss/discussions/18182" />

---

## Shadcn 也沒有處理這個問題

使用 Shadcn UI 的人，升級到 Tailwind v4 陸續發現按鈕 hover 不會變手指了，[issue #7501](https://github.com/shadcn-ui/ui/issues/7501) 有人問了這個修改：

> The (eternal) question is, does this library want to move forward with or without the cursor-pointer rule on buttons?

相關的 bug report 和 PR（[#6843](https://github.com/shadcn-ui/ui/issues/6843)、[#6800](https://github.com/shadcn-ui/ui/pull/6800)、[#7977](https://github.com/shadcn-ui/ui/pull/7977)）最後也都被 close 了， 因為其實這些回報的問題都是 feature。

所以 shadcn 的 `<Button>` 沒有 `cursor-pointer`，不是元件庫做了什麼設計抉擇，純粹是因為 Tailwind v4 的改動。

最後 Shadcn 在 CLI 加一個開關：

```bash
npx shadcn@latest init --pointer
```

<Figure src="/blog-images/image-3.webp" alt="" width={1866} height={460} caption="https://github.com/shadcn-ui/ui/issues/7501" />

---

## 小結

Linear 拿掉手指游標，換來的是 app 更接近原生桌面軟體的質感。代價是每個可互動元素都得自己把 affordance 做到位，沒有退路。

這是一個有立場的設計決策，它不通用，也不該通用。我自己在專案裡沒有跟著拿掉，因為我們的 hover 態還沒做到那個程度——游標是目前少數幾條穩定的訊號之一，先拆掉會讓使用者猜。

---
title: "為什麼 Linear 的按鈕不會變成手指游標"
subtitle: "從一個 CSS 小細節，看 web app 與桌面 app 的介面語彙差異"
description: "Linear 的 app 裡，滑鼠移到按鈕上不會變成手指游標。這是刻意的設計決策，官方說法是要模擬 Mac app 的原生手感。這篇談 cursor: pointer 的歷史語意、Linear 為什麼敢拿掉它，以及跟著做之前你得先補上什麼。"
datetime: "2026-09-16"
readTime: "6 min"
category: "professional"
tags: ["Linear", "CSS", "cursor pointer", "UI 設計", "Design System", "可用性"]
draft: true
---

## 先修正一個前提

我第一次聽到「Linear 不用 `cursor: pointer`」這個說法時，直覺是打開 linear.app 想驗證，結果掃出來的答案跟傳言相反。

我在 DevTools 跑了一段 script，把首頁上所有 `button`、`a`、`[role="button"]` 的 computed style 掃過一遍：

```js
const els = [...document.querySelectorAll('button, a, [role="button"]')];
els.map((el) => ({
  tag: el.tagName,
  text: (el.innerText || "").trim().slice(0, 20),
  cursor: getComputedStyle(el).cursor,
}));
```

行銷首頁上幾乎所有可互動元素都是 `pointer`。導覽列的 Product、Resources、Pricing、右上角的 Open app，全部都會變成手指。

所以不用 pointer 的是**登入後的 Linear app 本體**，不是官網。這兩件事常常被混在一起講。

---

## Linear 自己的說法

Linear 官方在 2022 年發過一則推特，講的就是這個決定：

> One of the small preferences we introduced in the Linear app is not displaying the mouse cursor pointer over links. Most of our users never notice it — but to some it feels weird. So we gave them the option to make the switch if they don't like it.

後來這則推文被丟上 [Hacker News 討論](https://news.ycombinator.com/item?id=30183948)，Linear 在串裡補了設計動機：他們要**模擬 Mac app 的原生手感**（"mimic the feeling you natively have on the desktop with our Mac app"）。

所以他們在設定裡開了兩種模式：

- **Native** — 只有文字連結會變手指，按鈕、側邊欄、toolbar 維持箭頭
- **Web** — 所有可互動元素都變手指

---

## 手指游標原本的意思是「導航」

這個決定背後有一段 web 的歷史包袱。

CSS 裡叫 `pointer` 的那隻手，在早期瀏覽器的語意是**「這是一條超連結，點下去會跑到別的地方」**。它標記的是導航行為，不是「可以點擊」這件事。

而按鈕代表的是動作：送出表單、開啟 modal、切換狀態，頁面不會換位置。這兩種互動在 web 早期是分開的，只是後來 SPA 普及、`<div onClick>` 滿地跑，大家習慣把所有能點的東西都掛上 `cursor: pointer`，兩種語意就糊在一起了。

原生桌面 app 一直維持著另一套慣例。你在 macOS 的 Finder 側邊欄、Xcode 的 toolbar、Notes 的清單上移動滑鼠，游標從頭到尾都是箭頭。桌面 app 靠 hover 的背景色變化來告訴你「這格可以點」，游標本身不參與這件事。

Linear 把自己定位成桌面等級的工具，而不是一個網站。所以 issue row、側邊欄項目、toolbar 按鈕全部維持箭頭，只有內文裡會把你帶去另一個頁面的文字連結才給手指。

>> 手指游標標記的是「會離開這一頁」，不是「這裡可以點」。

---

## 反對的聲音

這件事在設計圈是有爭議的，HN 那串下面的批評主要有兩類。

第一類是**「需要做成設定，代表設計本身沒解決」**。有人的說法是這等於提供了兩種都不夠對的行為，把連結跟按鈕混為一談之後，再用一個 toggle 把問題丟回給使用者。

第二類是**可用性風險**。對非技術背景的使用者來說，游標變化是「這東西可以點」最強的訊號之一。拿掉它以後，affordance 得全部靠 hover 態、底線、色塊撐起來。撐不住的話，使用者會停在畫面上不確定哪裡能按。

這場辯論兩邊各有代表作，Adam Silver 的 [Buttons shouldn't have a hand cursor](https://uxdesign.cc/buttons-shouldnt-have-a-hand-cursor-part-2-4a6e1c8423a5) 站在 Linear 這邊，Pascal Heynol 的 [On the web, maybe buttons should have a hand cursor](https://thepascalheynol.medium.com/on-the-web-maybe-buttons-should-have-a-hand-cursor-1e4498c42b3e) 則站在對面。

---

## 想跟著做的話

Linear 敢拿掉 pointer，是因為它每一個可互動元素都有很紮實的 hover 背景色、border 變化和 focus ring。游標這條訊號拿掉之後，還有另外三條在撐。

如果你的按鈕 hover 只有淡到看不出來的 opacity 變化，或者根本沒做 hover 態，那 pointer 可能是使用者唯一能確認「這裡能點」的線索。這種情況下跟著拿掉，只會讓介面變難用。

我的建議是照這個順序處理：

1. 先把 hover、active、focus-visible 三個狀態補齊，每個狀態的視覺差異要在一般螢幕亮度下看得出來
2. 把「導航」跟「動作」在程式碼裡分開，`<a>` 就是 `<a>`，動作就用 `<button>`
3. 做完前兩步以後，再決定要不要把 `<button>` 的 pointer 拿掉

順帶一提，這個決定只影響滑鼠使用者。觸控裝置上沒有 hover、沒有游標，鍵盤使用者靠的是 focus ring。所以 pointer 這條訊號本來就只覆蓋一部分的人，把它當成唯一的 affordance 一直都是有問題的做法。

---

## 小結

Linear 拿掉手指游標，換來的是 app 更接近原生桌面軟體的質感。代價是每個可互動元素都得自己把 affordance 做到位，沒有退路。

這是一個有立場的設計決策，它不通用，也不該通用。我自己在專案裡沒有跟著拿掉，因為我們的 hover 態還沒做到那個程度——游標是目前少數幾條穩定的訊號之一，先拆掉會讓使用者猜。

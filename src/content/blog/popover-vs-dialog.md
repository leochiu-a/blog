---
title: "Popover vs Dialog：差在哪？什麼時候該用哪個？"
subtitle: "從 modal、light dismiss 到 Invoker Commands，原生 HTML 彈出元件的差異與選擇"
description: "彈窗不等於 Modal！要使用者先回應才能繼續的用 <dialog>，臨時展開、不理也沒差的用 popover。本文從互動本質與 Top Layer 解析兩者差異，涵蓋免寫 JS 的 Invoker Commands、關閉機制與混用踩坑整理，內附互動 Demo。"
datetime: "2026-10-08"
readTime: "8 min"
category: "professional"
tags: ["HTML", "Popover API", "dialog", "Invoker Commands", "無障礙"]
ogImage: "/blog-images/popover-vs-dialog-hero.webp"
draft: true
---

import { ModalVsPopoverDemo } from "@/components/mdx/ModalVsPopoverDemo";
import { AutoManualDemo } from "@/components/mdx/AutoManualDemo";
import { CloseRequestDemo } from "@/components/mdx/CloseRequestDemo";

<Figure src="/blog-images/popover-vs-dialog-hero.webp" alt="線條插畫，白底配橘色點綴。同一個人坐在書桌前兩次：左邊被一道從天花板垂下的黑色簾幕擋住，只能看著簾幕上的一塊空白板；右邊筆電旁貼著一張橘色便利貼，他照常打字" width={2752} height={1536} hero />

Popover 跟 dialog 很容易分不清楚，有些 design system 甚至會用 modal 這個單字。

有用過 Boostrap、Ant Design 的人都會覺得「彈窗」就是「modal」。

這也是 Web 常被討論的題目，Hidde de Vries（曾在 W3C 的無障礙小組工作，以及前 Mozilla 成員）就為它寫過文章跟[演講](https://noti.st/hdv/G9mATs)。

[上一篇](/blog/github-native-html-features/)分析 GitHub 時兩者都有出現，這篇想把 popover 跟 dialog 的差別整理一下。

---

## Popover 和 dialog 差在哪？

先從使用者的角度來看 popover 跟 dialog ：

>> **dialog 會要求使用者要跟元件互動，popover 則是不理它也沒關係。**

### Dialog：介面在跟使用者對話

Dialog 是介面停下來問使用者一件事，或請他完成一個小任務：

- 「確定要刪除這個專案嗎？」
- 「請先登入」
- 「填寫寄送地址」

<Figure src="/blog-images/popover-vs-dialog-publish-dialog.webp" alt="編輯器的確認對話框：標題 Publish this post?，下方有 Cancel 與 Publish 兩個按鈕，背後頁面被模糊遮住" width={1698} height={896} caption="這個部落格的編輯器 publish dialog" />

就像店員走過來問你問題，你得回答，或至少明確說「不用了」。

[HTML 規範](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)對它的定義也是這樣：一個讓使用者完成任務、提供資訊的小視窗。規範還特別提到，右鍵選單、tooltip、下拉清單**都不算** dialog。

>> 至於要不要擋住頁面，用是不是 modal 來決定。

modal 不是另一種元件，而是 dialog 的一種狀態：

- **Modal**：店員擋在門口，回答完才能繼續逛
- **非 modal**：店員遞給你一張單子，你可以邊填邊逛

### Popover：臨時冒出來的東西

Popover 是平常看不到，需要時才冒出來，疊在畫面最上面，不需要了就消失：

- 「點按鈕展開的下拉選單」
- 「滑鼠移上去出現的說明」
- 「點日期欄位跳出的月曆」
- 「右下角的通知」

<Figure src="/blog-images/popover-vs-dialog-preview-popover.webp" alt="部落格文章列表，滑鼠停在一篇標題上時，左側浮出一張含封面圖與摘要的預覽卡片" width={1818} height={940} caption="部落格的文章預覽 popover" />

比較像便利貼或對話泡泡，元素會貼在旁邊，看完或點別的地方就自己消失。使用者可以完全不理它，頁面照常操作。

### Modal、dialog、popover 的關係

UX 研究機構 Nielsen Norman Group（NN/g）的[〈Modal & Nonmodal Dialogs〉](https://www.nngroup.com/articles/modal-nonmodal-dialog/)這樣分 dialog 的 modal 跟 nonmodal：

>> dialog 就是系統在問你事情。modal 的會逼你先回答，nonmodal 的可以先放著，繼續做原本的事。

所以可以這樣總結成一張表格：

|             | 擋住頁面         | 不擋頁面             |
| ----------- | ------------ | ---------------- |
| **使用者要回應**  | Modal dialog | 非 modal 的 dialog |
| **使用者不用回應** | 很少用          | Popover          |

- **Modal dialog**：刪除確認、登入
- **非 modal 的 dialog**：Gmail 的寫信視窗
- **Popover**：選單、tooltip、月曆、toast
- **很少用**：儲存或付款處理時蓋住整個畫面的 loading 遮罩

「使用者不用回應，但是擋住頁面」這個組合的元件很少用，因為把使用者擋住，又不讓他做任何事，只有很短的時間能被接受。舉例來說，像是 loading 遮罩是為了防止重複送出，處理完就該馬上消失。

「**使用者要回應，但是擋住頁面**」的 modal 也不是越多越好，NN/g 建議 modal 只用在必要的時候，例如會造成不可逆後果的操作、或流程繼續下去非填不可的資訊。跟使用者當下在做的事無關的內容，像一進網站就跳出來的電子報訂閱框，會消耗使用者的信任。

不過 Substack 這類平台偏偏就是這樣做，一進去文章就先跳出訂閱框，要按「No thanks」才能繼續讀。

我猜是因為**轉換率**，雖然要多一個步驟才能看到文章，換到的訂閱可能比把按鈕放在文末還多。

### Design System 的 Popover 不等於瀏覽器的 popover

很多 Design System 裡的「Popover」是一種特定元件，點按鈕後，旁邊出現「一張帶小箭頭的卡片」。

瀏覽器的 popover 範圍大很多，選單、tooltip、月曆、toast 都算。

所以設計稿上標著 Popover 的元件，不一定就該用瀏覽器的 popover 做。

---

## dialog 跟 popover 的 HTML 怎麼寫

回到 HTML，`<dialog>` 是一個**元素**，`popover` 是一個**屬性**。

`<dialog>` 自帶 `dialog` 的 role，瀏覽器知道它是對話框。`popover` 則只加行為不加語意，可以掛在任何元素上，做成選單就自己補 `role="menu"`，做成 tooltip 就補 `role="tooltip"`。

```html
<!-- 元素：本身就是對話框 -->
<dialog id="confirm">確定要刪除嗎？</dialog>

<!-- 屬性：掛在什麼元素上都可以 -->
<ul popover id="menu" role="menu">…</ul>
```

兩者的行為差異整理如下：

|              | `<dialog>` + `showModal()` | `popover`            |
| ------------ | -------------------------- | -------------------- |
| 擋住頁面（modal）  | 會                          | 永遠不會                 |
| 進 top layer  | 會                          | 會                    |
| 點 overlay 關閉 | 預設不會，`closedby="any"` 才會   | `auto` 預設會           |
| Esc 關閉       | 會                          | `auto` 會，`manual` 不會 |
| 焦點           | 自動移進去，困在裡面                 | 不會移進去，關閉時回到按鈕        |
| 內建 role      | `dialog`                   | 沒有，要自己補              |
| 背景遮罩         | `::backdrop`               | 有 `::backdrop`，但通常不用 |

### 背景變暗，不等於 modal

modal 的「擋住頁面」，在程式上是指頁面其他部分都變成 [inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)，點不到、Tab 不到，螢幕閱讀器也讀不到。

[Hidde de Vries](https://hidde.blog/dialog-modal-popover-differences/) 提醒，自己刻的時候只加遮罩或只做 focus trap 都不夠`showModal()` 會一次處理好，還會隱含 `aria-modal="true"`。

popover 則**永遠不是 modal**，就算寫成 `<dialog popover>` 也一樣。

打開後點點看「背景的按鈕」：

<ModalVsPopoverDemo />

用 `showModal()` 打開時，背景按鈕點不到。用 popover 打開時，點背景會關掉 popover。

---

## 不寫 JS 怎麼打開 dialog？用 Invoker Commands

以前 popover 可以只用 HTML 就可以宣告，但是 dialog 卻得用 JS 呼叫 `showModal()`。

>> 現在 dialog 也不用寫 JS 了。

popover 一開始的 `popovertarget` 只能控制 popover。後來加入的 [Invoker Commands](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API) 用 `commandfor` 指定目標、`command` 指定動作，dialog 和 popover 都能這樣用：

```html
<button commandfor="confirm" command="show-modal">刪除</button>

<dialog id="confirm">
  <p>確定要刪除嗎？</p>
  <button commandfor="confirm" command="close">取消</button>
</dialog>

<button commandfor="menu" command="toggle-popover">選單</button>
<ul id="menu" popover role="menu">…</ul>
```

| 目標 | 可用的 `command` |
|---|---|
| `<dialog>` | `show-modal`、`close`、`request-close` |
| `popover` | `show-popover`、`hide-popover`、`toggle-popover` |
| 自訂 | 以 `--` 開頭，例如 `--rotate`，在目標上監聽 `command` 事件 |

---

## 怎麼關閉：light dismiss、Esc 和 close request

### popover 的 auto 和 manual

`popover` 不寫值就是 `auto`，點外面或按 Esc 會自動關閉（light dismiss），而且同一時間只會開一組，開新的會把舊的關掉。

`popover="manual"` 則完全不會自己關，也不會關掉別人，適合 toast 這種要並存、要自己控制時間的提示。

<AutoManualDemo />

### dialog 的 closedby

modal dialog 預設只能用 Esc 或 `close()` 關閉，點背景沒有反應。要點背景就關掉 dialog，以前得自己判斷點擊座標是不是落在 dialog 外面。

`closedby` 屬性把這件事變成宣告式：

| 值 | Esc | 點背景 | `close()` |
|---|---|---|---|
| `any` | ✅ | ✅ | ✅ |
| `closerequest`（modal 預設） | ✅ | ❌ | ✅ |
| `none`（`show()` 預設） | ❌ | ❌ | ✅ |

不過 `closedby` **Safari 還沒支援**，目前只在 Technology Preview。要讓 Safari 也能點背景關閉，還是得自己補：

```js
dialog.addEventListener("click", (e) => {
  // 點在 ::backdrop 上時，event.target 就是 dialog 本身
  if (e.target === dialog) dialog.requestClose();
});
```

### dialog 的 requestClose() 和 close() 差在哪？

這兩個都會關掉 dialog，差別在 `requestClose()` 會先觸發 `cancel` 事件，讓你有機會用 `preventDefault()` 擋下來。

```js
dialog.addEventListener("cancel", (e) => {
  if (hasUnsavedChanges()) e.preventDefault();
});

dialog.requestClose(); // 會先問 cancel
dialog.close(); // 直接關，不問
```

按 Esc、點背景（`closedby="any"`）、Android 的返回鍵，瀏覽器都把它們當成同一種「close request」，走的就是 `requestClose()` 這條路。所以「還沒儲存要提醒」的邏輯寫在 `cancel` 裡，所有關閉方式都會被攔到。

打開下面的留言框打幾個字，再試試按 Esc、點背景、按「取消」：

<CloseRequestDemo />

第一次關閉會被擋下來，第二次才放行，「放棄」按鈕用的是 `command="close"`，所以完全不會觸發 `cancel`。

要注意的是，瀏覽器為了防止網頁困住使用者，Esc 觸發的 `cancel` 只有在使用者和頁面互動過之後才擋得住。**連按兩次 Esc，中間沒有點擊或打字，第二次就一定會關**；用程式打開 dialog、使用者什麼都還沒做就按 Esc，第一次也擋不住。所以 `cancel` 適合拿來提醒，不能拿來強迫使用者留下。

---

## Popover 跟 dialog 的樣式與動畫

兩者共用的樣式工具：

- `::backdrop`：背景遮罩，dialog 和 popover 都有
- `:popover-open`：popover 打開時的狀態
- `:modal`：用 `showModal()` 打開的 dialog
- `:open`：2026 年 5 月成為 Baseline，dialog、`<details>`、`<select>` 打開時都會符合

進場動畫用 `@starting-style` 搭配 `transition-behavior: allow-discrete`，寫法在[上一篇](/blog/github-native-html-features/)有完整說明，這裡不重複。

退場動畫比較麻煩。元素關閉時會馬上離開 top layer，要等動畫跑完才離開，得在 transition 裡加上 `overlay`：

```css
dialog,
[popover] {
  transition:
    opacity 150ms,
    display 150ms allow-discrete,
    overlay 150ms allow-discrete;
}
```

`overlay` 目前**只有 Chromium 支援**。Firefox 和 Safari 還是能淡出，只是淡出期間元素已經不在 top layer，如果被其他元素蓋住或被 `overflow` 裁掉，最後那幾毫秒會看得出來。大部分情況影響不大，寫上去當漸進增強就好。

---

## tooltip 要用哪個？`popover="hint"` 和 interestfor

上一篇提到，GitHub 的 tooltip 雖然用了 popover，但 hover 時還是要自己寫 JS 呼叫 `showPopover()`，因為 `popovertarget` 只認點擊。

這個缺口有兩個新 API 在補：

- **`interestfor`**：使用者對按鈕「表示興趣」時打開目標，包含滑鼠 hover、鍵盤聚焦、觸控長按，延遲時間用 CSS 的 `interest-delay` 調整
- **`popover="hint"`**：專門給 tooltip 用的第三種 popover，打開時不會把已經開著的 `auto` popover 關掉，所以選單開著時 hover 其他按鈕，選單不會消失

```html
<button interestfor="tip">儲存</button>
<div id="tip" popover="hint" role="tooltip">Ctrl + S</div>
```

這兩個現在支援度都還不太夠，`interestfor` 只有 Chrome 142 以上支援，`popover="hint"` 在 Chrome 151、Firefox 153 才換成新版規格，Safari 還在 Technology Preview。現階段可以當漸進增強，或搭配 polyfill。

---

## 混用 dialog 和 popover 的坑

### popover 蓋住自製的 div dialog

popover 會進 top layer，自製的 `<div role="dialog">` 不會，所以 popover 可能蓋在對話框上面，擋住裡面的按鈕。Adrian Roselli 2023 年的[建議](https://adrianroselli.com/2023/05/brief-note-on-popovers-with-dialogs.html)是，**先把 modal 換成原生&#x20;**`<dialog>`**，再導入 popover**。

### modal 打開時，外面的 popover 會怎樣？

我在 Chrome 152 實測：

- 呼叫 `showModal()` 時，開著的 `auto` popover 會自動關掉
- `manual` popover 不會被關掉，但它不在 dialog 裡面，所以會跟著頁面一起變成 inert
- 之後再打開一個放在 dialog 外面的 `manual` popover（例如 toast），它會顯示在 dialog 上面，但**焦點進不去、按鈕也點不到**

最後一點最容易踩到：toast 看得到卻按不到。要在 modal 裡用的 popover，記得放在 `<dialog>` 的 DOM 裡面。

Roselli 2025 年 12 月補充，這些 modal、inert 和 top layer 之間的互動，WHATWG 還在討論，未來行為可能會變。

---

## 小結

- **看會不會擋住頁面**：要使用者先處理完的，用 `<dialog>` 的 `showModal()`；可以忽略的，用 popover
- **兩者都能不寫 JS 開關**：`command` / `commandfor` 已經是 Baseline，dialog 不再需要 `onClick`
- **關閉邏輯寫在 `cancel`**：Esc、點背景、返回鍵都會經過它，`requestClose()` 也是
- **新 API 先當漸進增強**：`closedby`、`popover="hint"`、`interestfor` 都還沒進 Baseline

---

## Reference

- [Modal & Nonmodal Dialogs: When (& When Not) to Use Them](https://www.nngroup.com/articles/modal-nonmodal-dialog/) — Nielsen Norman Group
- [The dialog element](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element) — HTML Living Standard
- [The popover attribute](https://html.spec.whatwg.org/multipage/popover.html) — HTML Living Standard
- [Dialogs and popovers seem similar. How are they different?](https://hidde.blog/dialog-modal-popover-differences/) — Hidde de Vries
- [Semantics and the popover attribute: which role to use when?](https://hidde.blog/popover-semantics/) — Hidde de Vries
- [On popover accessibility: what the browser does and doesn't do](https://hidde.blog/popover-accessibility/) — Hidde de Vries、Scott O'Hara
- [Popovers](https://scottohara.me/blog/2025/03/14/popovers.html) — Scott O'Hara
- [Clarifying the Relationship Between Popovers and Dialogs](https://css-tricks.com/clarifying-the-relationship-between-popovers-and-dialogs/) — Zell Liew, CSS-Tricks
- [Brief Note on Popovers with Dialogs](https://adrianroselli.com/2023/05/brief-note-on-popovers-with-dialogs.html) — Adrian Roselli
- [Close requests, close watchers, and the dialog element](https://www.matuzo.at/blog/2025/close-requests-dialog) — Manuel Matuzović
- [`<dialog>` and popover: Baseline layered UI patterns](https://web.dev/articles/baseline-in-action-dialog-popover) — web.dev
- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) — MDN
- [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) — MDN
- [Invoker Commands API](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API) — MDN
- [HTMLDialogElement: requestClose()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/requestClose) — MDN
- [Using interest invokers](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using_interest_invokers) — MDN

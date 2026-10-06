---
title: "GitHub 怎麼用 Popover API、Anchor Positioning 等原生 HTML/CSS 功能"
subtitle: "tooltip 用 popover 但位置靠 JS，選單用 Anchor Positioning 但沒進 top layer"
description: "我打開 GitHub 的 repo、Issues、PR 頁面，檢查用了哪些原生 HTML/CSS 功能。tooltip 用 Popover API 進 top layer，位置是 JS 算的；選單用 Anchor Positioning 定位，但沒進 top layer，dialog 也還是 div 加 ARIA。附截圖，以及 @starting-style、View Transitions、content-visibility 的 demo。"
datetime: "2026-10-01"
readTime: "6 min"
category: "professional"
tags: ["GitHub", "HTML", "CSS", "Popover API", "Anchor Positioning"]
ogImage: "/blog-images/github-native-html-features-hero.webp"
draft: true
---

import { PopoverTooltipDemo } from "@/components/mdx/PopoverTooltipDemo";
import { TopLayerDemo } from "@/components/mdx/TopLayerDemo";
import { StartingStyleDemo } from "@/components/mdx/StartingStyleDemo";
import { PositionAreaDemo } from "@/components/mdx/PositionAreaDemo";
import { ViewTransitionDemo } from "@/components/mdx/ViewTransitionDemo";
import { ContentVisibilityDemo } from "@/components/mdx/ContentVisibilityDemo";
import { DialogDemo } from "@/components/mdx/DialogDemo";

<Figure src="/blog-images/github-native-html-features-hero.webp" alt="線條插畫，白底配橘色點綴。一個人坐在桌前用電腦，螢幕上是一個網頁介面，周圍浮著幾個小的介面面板" width={2752} height={1536} hero />

現在原生的 HTML/CSS 越來越完整，以前需要搭配許多套件、JS 才能實現 dialog、popover 等等的功能，現在這些原生 HTML/CSS 都已經過 baseline，平常開發已經可以正常使用。

>> 但我就好奇現在業界會選擇使用原生的寫法，還是仍然使用套件？

所以我以 GitHub 當作標竿，看一下 GitHub 有用到哪些原生的 HTML 跟 CSS。

---

## Popover API：主要用在 tooltip

GitHub 的許多頁面都能看到 `popover` 這個屬性，repo 首頁、Issue 頁面、PR Files，只要是 tooltip，基本上都是使用 popover。

它們的來源有兩種：

- Primer 的 `TooltipV2`，包成一個 `<span popover="auto">`
- 自家的 `<tool-tip>` web component，設成 `popover="manual"` 再配 `sr-only`

這兩種都沒用 `popovertarget`，這個屬性可以讓按鈕不寫 JS 就開關 popover，但只認「點擊」。

tooltip 是滑鼠移上去才出現，所以 GitHub 得自己監聽 hover，再用 JS 呼叫 `showPopover()` 把它打開。

tooltip 的位置也是用 JS 算的，在 Issues 列表上打開「Compact display density」按鈕的 tooltip，它的 computed `position-anchor` 是 `normal`，座標是打開時寫進 inline style 的 `top` / `left`：

<Figure src="/blog-images/github-native-html-features-tooltip.webp" alt="GitHub Issues 列表右上角的顯示密度切換按鈕，下方浮著 Compact display density 的 tooltip，tooltip 被橘框圈起" width={762} height={200} caption="tooltip 進了 top layer，但座標是 JS 寫進 inline style 的" />

我照 GitHub 的標記做了一個 demo，不過位置改用 CSS Anchor Positioning 決定，搭配 `position-try-fallbacks` 可以在撞到邊緣時自動位移，避免跑版：

<PopoverTooltipDemo />

```tsx
<button
  style={{ anchorName: "--tip" }}
  onMouseEnter={() => tip.current?.showPopover()}
>
  hover me
</button>
<span
  ref={tip}
  popover="auto"
  style={{ positionAnchor: "--tip", positionArea: "top" }}
  className="[position-try-fallbacks:flip-block]"
>
  tooltip
</span>
```

這個 demo 的進出場動畫用 `@starting-style` 搭配 `transition-behavior: allow-discrete`。因為 popover 平常是 `display: none`，一般的 transition 接不到進場狀態。

---

## @starting-style：讓元素從 display: none 淡入

popover 平常掛著 `display: none`，打開瞬間才變成 `display: block`。

因為元素一出現就已經是最終樣式，中間沒有過渡起點，一般的 `transition` 做不出進場動畫。`@starting-style` 就是用來補這段，告訴瀏覽器元素剛出現時要從哪組樣式開始過渡。

```css
.tooltip {
  opacity: 0;
  transition:
    opacity 150ms,
    display 150ms allow-discrete,
    overlay 150ms allow-discrete;
}

.tooltip:popover-open {
  opacity: 1;

  @starting-style {
    opacity: 0;
  }
}
```

`allow-discrete` 讓 `display` 和 `overlay` 這種離散屬性也能參與 transition，退場時會等淡出動畫跑完才收掉。

GitHub 的 stylesheet 裡也有這套寫法，寫在 `IssueViewer` 頂部的標籤列（`topContainerChips`）：用 `display … allow-discrete` 配 `@starting-style` 讓它淡入，再為 `prefers-reduced-motion` 關掉動畫。

<StartingStyleDemo />

---

## Anchor Positioning：不用 JS 算位置

以前做 tooltip 或選單，通常要用 JS 去量按鈕座標，不然就是直接載入 Floating UI。Anchor Positioning 讓 CSS 能直接綁定目標元素：

```css
.trigger {
  anchor-name: --trigger;
}

.tooltip {
  position-anchor: --trigger;
  position-area: top;
  position-try-fallbacks: flip-block;
}
```

`position-area` 的用法很直覺，把 anchor 周圍切成 3×3 的九宮格，anchor 本身在正中間，只要指定要塞進哪一格就行：

```text
┌─────────┬─────────┬──────────┐
│top left │   top   │top right │
├─────────┼─────────┼──────────┤
│  left   │ anchor  │  right   │
├─────────┼─────────┼──────────┤
│bot left │ bottom  │bot right │
└─────────┴─────────┴──────────┘
```

- `top`、`bottom`、`left`、`right`：靠在該側，對齊 anchor 的中心線。
- `top span-right`：貼在上方，並從 anchor 左緣往右延伸，選單很常見這種對齊（後面 `TopLayerDemo` 的 popover 選單就是 `bottom span-right`）。
- `block-start`、`inline-end` 這類邏輯屬性也支援，碰到 RTL 語系會自動翻面。

`position-try-fallbacks` 是空間不夠時的備案，像是 `flip-block` 會垂直翻轉，`flip-inline` 會水平翻轉。

>> tooltip 靠在螢幕邊緣會自己換邊，靠的就是 `position-try-fallbacks` 這個機制

點右邊九宮格可以看左邊方塊對應的位置變化，全程沒有寫任何 JS 算座標：

<PositionAreaDemo />

點開 Issues 列表上的篩選選單，看裡面的 DOM 結構：

- 容器用 `<div role="dialog" aria-labelledby>`，沒用原生 `<dialog>`
- 樣式是 `position: fixed`，**不在 top layer**（`:popover-open` 和 `:modal` 都沒中）
- 有設 `position-anchor`，所以定位用了 Anchor Positioning
- 裡面用 `role="combobox"` 的 input 配 `listbox` / `option`，沒用 `<select>` 或 `<datalist>`

<Figure src="/blog-images/github-native-html-features-menu.webp" alt="GitHub Issues 列表的 Labels 篩選選單展開，列出 bug、platform:macos 等標籤。選單被橘框圈起" width={873} height={894} caption="Labels 篩選選單：用 position-anchor 對齊按鈕，但沒進 top layer" />

等於它跟 tooltip 剛好相反，用 Anchor Positioning 算位置，但沒進 [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer)。

沒進 top layer 會遇到什麼問題，看下面這個實驗就清楚了，兩邊選單都包在 `overflow: hidden` 裡面：

<TopLayerDemo />

左邊的 `position: absolute` 選單直接被容器裁掉，右邊的 popover 被拉到 [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer)，不受容器限制，點外面或按 Esc 也會自己關閉。

另外選單也沒用到九宮格。我量到它的 `position-area` computed 值是 `none`，所以它具體怎麼靠 anchor 排位置，我沒有確認。

---

## View Transitions：DOM 改變時自動補動畫

View Transitions 的機制是讓瀏覽器在 DOM 改變前後各抓一張快照，自動補上過渡動畫。

同一頁裡的 DOM 更新用 `document.startViewTransition()` 包起來，多頁之間的跳轉則可以用 `@view-transition { navigation: auto }` 直接套用。

```css
@view-transition {
  navigation: auto;
}

.card-thumbnail {
  view-transition-name: card;
}
```

stylesheet 裡唯一實際設定的 `view-transition-name` 在 Copilot 的 `DashboardListView` 上。

下面做了一個洗牌的對照，可以切換看有沒有開 `startViewTransition` 的效果。每個方塊都給了獨立的 `view-transition-name`，瀏覽器才能認出順序改變並做出平移：

<ViewTransitionDemo />

---

## content-visibility：畫面外先不 render

PR Files 的每個檔案區塊都加了 `content-visibility: auto`，讓畫面外的 diff 先不 render，再用 `contain-intrinsic-size` 先預留高度，捲動條才不會亂跳。左側檔案樹的每一列也加了同一個屬性：

<Figure src="/blog-images/github-native-html-features-content-visibility.webp" alt="GitHub PR 的 Files changed 頁面，左側檔案樹與右側一個檔案的 diff 都被橘框圈起" width={1332} height={607} caption="檔案區塊和檔案樹的每一列都是 content-visibility: auto" />

`content-visibility: auto` 對效能的影響很直觀。

下面 demo 會把 4000 列內容渲染兩次，記錄瀏覽器排版花了多久。數字是你當前設備的實測結果，因為畫面外的節點不需要排版，列數越多差距越明顯：

<ContentVisibilityDemo />

---

## 其他用到的 CSS

- `@container`：依元件所在容器的寬度調整樣式，同一張卡片放側欄排直的、放主內容區排橫的
- `:has()`：依裡面有什麼設定外層樣式，例如表單有錯誤欄位時整個外框變紅
- `@layer`：宣告樣式的優先順序，不用靠選擇器權重和 `!important` 互相壓
- `subgrid`：讓子元素沿用父層 grid 的欄列線，一排卡片的標題和按鈕能橫向對齊
- `color-mix()`：直接在 CSS 混色，hover 色和淺色變體可以從主色衍生
- `field-sizing`：讓 `<textarea>` 隨輸入內容自動變高，不用 JS 算 `scrollHeight`
- `animation-timeline`：讓動畫進度綁定捲動位置，不是時間，閱讀進度條不用監聽 scroll

---

## 沒用到的原生 HTML

把四個頁面加上點開的選單看過一輪，底下這些都沒出現：

- `<dialog>`、`<details>`、`<select>`、`<search>`、`<progress>`
- Invoker Commands（`command` / `commandfor`）和 `interestfor`
- `inert`、`hidden="until-found"`、`contenteditable="plaintext-only"`
- `<script type="speculationrules">`

### 最值得講的是 dialog

在沒用到的功能裡，我覺得 `<dialog>` 的落差最大。GitHub 的篩選選單依然是 `<div role="dialog">`，很多行為就得自己寫程式補齊：

| 行為 | 原生 `<dialog>` + `showModal()` | `div role="dialog"` |
|---|---|---|
| 蓋在其他東西上面 | 自動進 top layer，不受 `overflow` 和 `z-index` 影響 | 靠 `position: fixed` 和 z-index |
| 背景不能操作 | 其餘頁面自動變 `inert` | 自己在背景加 `inert` 或 `aria-hidden` |
| 焦點被困在裡面 | 瀏覽器處理 | 自己寫 focus trap |
| Esc 關閉 | 內建 | 自己監聽鍵盤 |
| 遮罩 | `::backdrop` | 自己多放一個 div |

```html
<dialog id="filter">
  <h2>Filter by labels</h2>
  <button commandfor="filter" command="close">Close</button>
</dialog>

<button commandfor="filter" command="show-modal">Labels</button>
```

開關甚至能用 Invoker Commands 寫成宣告式，一行 JS 都不用寫。

下面把兩種做法並排。分別打開後連按幾次 Tab 再按 Esc，對話框裡會即時顯示焦點跑到哪裡、Esc 有沒有作用：

<DialogDemo />

GitHub 的 stylesheet 裡有 `::backdrop` 規則，但這幾頁的 DOM 裡沒有任何 `<dialog>`，推測多半是給 popover 用的（popover 自己也有 `::backdrop`）。

其他沒用到的標籤像 `<details>`、`<search>`、`inert`、`hidden="until-found"` 也是類似狀況，瀏覽器本來就已經處理好焦點、鍵盤與無障礙。

GitHub 沒用，我的猜測是歷史包袱加上對跨瀏覽器相容性的保守考量。選單現有的鍵盤控制、搜尋、多選、非同步載入，在 React 元件裡都已經寫好了，換成原生等於整套重寫。這只是推測，單看掃描數據看不出具體原因。

---

## 小結

- **Popover API**：tooltip 幾乎都用了，hover 時由 JS 呼叫 `showPopover()`，位置也是 JS 算好寫進 inline style
- **Anchor Positioning**：用在選單，讓選單對齊觸發按鈕，但選單本身沒進 top layer
- **沒用到的原生 HTML**：`<dialog>`、`<details>`、`<select>` 都沒出現，選單和對話框還是 `div` 加 ARIA
- **CSS**：`content-visibility` 確實套在 PR 的檔案區塊和檔案樹上，`@starting-style` 和 View Transitions 的規則寫在 IssueViewer 和 Copilot 的元件裡，這四頁沒有渲染出來

看起來 GitHub 是挑風險小的地方先換。tooltip 換成 popover 幾乎沒有副作用；選單和 dialog 牽涉焦點、鍵盤操作和既有的 React 元件，就還沒動。

想在自己的專案導入的話，可以照同樣的順序：先用 popover 做 tooltip，再用 Anchor Positioning 拿掉定位用的 JS，最後才考慮把選單換成原生 `<dialog>`。


---

## Reference

- [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) — MDN
- [Top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) — MDN
- [CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) — MDN
- [position-area](https://developer.mozilla.org/en-US/docs/Web/CSS/position-area) — MDN
- [position-try-fallbacks](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks) — MDN
- [@starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) — MDN
- [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) — MDN
- [content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) — MDN
- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) — MDN

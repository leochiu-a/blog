---
title: "設計師參與開發，真的能加速前端專案嗎？"
subtitle: "聊聊我們公司的跨職能開發實驗，以及 Figma 規範帶來的真正效益"
description: "我們讓三位設計師各自獨立開發一個前端專案，由工程師 Code Review。三個專案都卡在同一件事：設計師大量時間花在非設計的工程問題上。這篇談我們發現的界線，以及 Figma MCP 成熟後更有效率的協作方式。"
ogImage: "/blog-images/designers-writing-frontend-code-hero.webp"
datetime: "2026-09-05"
readTime: "9 min"
category: "professional"
tags: ["Figma MCP", "設計師寫 code", "Design System", "前端協作", "Code Connect", "Figma"]
draft: true
featured: true
---

<Figure
  src="/blog-images/designers-writing-frontend-code-hero.webp"
  alt="三位設計師各自站在一面板子前排版面：左邊的人往牆上貼卡片、中間的人搬動區塊排出版型、右邊的人指著一個四格網格"
  width={2816}
  height={1536}
  hero
/>

## 前言

在 2026 年 6 月時，我們公司嘗試讓許多設計師開始參與前端功能開發。廣義來說，設計師與前端的職責高度重疊，我們都在打造供使用者互動的介面。

既然設計師能用 Figma 完成設計稿，加上 Figma MCP 技術日趨成熟，我們便思考：

>> **是否有機會讓設計師直接參與開發？**

這不僅能讓設計師親自驗證介面與流程是否符合需求，或許還能有效減輕前端的人力負擔。

於是，我們展開了一場實驗：讓三位設計師各自獨立負責一個專案，並由前端工程師進行 Code Review。

這篇文章整理了我與這三位合作設計師聊過後的經驗與心得，包含他們各自解決的問題，以及開發過程中面臨的真實挑戰。

> 有兩位不同部門的 Design Lead，以及一位 mid-level 的設計師。

---

## 專案一：在描述模組中加入表格與動態佈局

### 需求

- **驗證 SEO 策略**：在既有的「描述模組」寫死「入場門票」與「設施攻略」兩個元件。
- **入場門票**：以表格呈現，分為桌面版與手機版兩種樣式。
- **設施攻略**：為輪播圖元件，需根據部落格文章數量（3、4、5、6 篇）顯示對應 layout，同樣支援桌面與手機版樣式。

<Figure src="/blog-images/designers-writing-frontend-code-ticket-table.webp" alt="設計師實作的入場門票描述模組，票種與價格以表格呈現，並分為桌面版與手機版兩種樣式" width={2300} height={1246} caption="入場門票描述模組" />

<Figure src="/blog-images/designers-writing-frontend-code-facility-carousel.webp" alt="設施攻略描述模組的輪播圖元件，會依部落格文章數量 3、4、5、6 篇顯示不同的 layout" width={2150} height={968} caption="設施攻略描述模組" />

### 設計師開發的優點

因為設計師在第一輪開發時已經自行驗證過 UI，因此工程師在 Code Review 時不必再花時間確認視覺畫面，可以直接從程式碼架構切入，省下不少溝通與修 UI 的時間。

### 設計師開發面臨的問題

設計師在請 AI 改動時，只能依靠既有的需求，讓 AI 自主去完成任務。而這也相當順利，最後完成了初版。

但我們的程式碼架構較為複雜，所以 AI 傾向用最簡單的方式完成需求，但是卻忽略了程式碼的彈性。所以我們在做 code review 時，有針對程式碼的彈性，在 PR 中留下了許多建議，而設計師也是持續利用 AI 來回應、修復這些 PR 中的建議。

但過了一兩輪以後，發現有點不對勁。因為 **AI 無法精準理解架構層面的問題**，這導致工程師必須在 PR 中寫出極其詳細的 Prompt，AI 才可能改對，反而消耗了大量工程溝通成本。

最後為了效率，該專案讓工程師接手收尾。

### 專案心得與界線

我認為在這個專案中，最大的收穫就是**設計師交付的 UI 品質非常高**，工程師幾乎不需要額外除錯或調整畫面。

但如果牽涉到程式碼架構的邏輯，則需要花費更多的力氣來調整。

「描述模組」是核心模組之一，它承載了整個頁面中所有模組的渲染方式，就連工程師第一次進去看時，也會被資料流嚇到，對設計師來說難度確實過高。

### 盲點與反思

如果未來能讓設計師專注在「切版與 UI 呈現」，而工程師專注於「資料流、API 串接與程式架構設計」，就能省去 Design Review 的來回時間，發揮各自最大的效益。

但另一個反思是切版與 UI 目前 Figma MCP 已經能夠大幅提升開發效率，導致上述的「讓設計師專注在切版跟 UI 呈現」這項工作流也許不一定能夠提升太多的開發效率。

---

## 專案二：後台 JSON 格式擴充與行銷頁雙欄卡片排版

### 需求

- **擴充行銷頁面**：新增支援雙欄卡片排版的渲染邏輯。
- **後台資料連動**：行銷頁面資料源自後台 JSON，需先擴充後台 JSON 格式，才能讓前台依照資料正確渲染畫面。

<Figure src="/blog-images/designers-writing-frontend-code-marketing-two-column.webp" alt="行銷頁面的雙欄卡片排版，資料來自後台擴充後的 JSON 格式" width={814} height={1382} caption="行銷頁面 雙欄樣式" />

### 設計師開發的優點

與專案一相同，設計師已自行完成第一輪的視覺驗證。工程師進行 Review 時不必再著重於畫面細節，可以直接 review 程式碼的架構設計。

### 開發過程中面臨的難題

1. **跨領域與系統知識門檻**：設計師除了要在前台實作功能，還得先熟悉後台操作，並理解後台 JSON 如何對應到行銷頁面。
2. **缺乏判斷程式碼正確性的能力**：設計師無法自行評估程式碼寫法是否為最佳解，因此高度仰賴工程師在 PR 中的建議來進行修正。

雖然經歷了波折，最後還是讓設計師收尾掉所有的 PR，但是她也因此花費了很多時間在工程問題上。

### 在這個專案中發現的界線

我發現這個專案對設計師來說相對不合適，因為它需要具有不同 repo 的知識，以及前台與後台兩個不同渲染邏輯的知識。對於一個想要貢獻的設計師來說，超出了他原本的職能範圍，導致沒有辦法發揮綜效。

對於設計師來說，設計這個畫面並不難，而且因為是行銷畫面，所以元件的渲染也較為簡單。

所以更有效率的做法是讓設計師負責設計，然後讓前端工程師搭配 Figma MCP，就可以達到最高的開發效率。

---

## 專案三：擴充 Design System，新增跨團隊使用的 Carousel 元件

### 需求

- **擴充 UI 元件庫**：新增 Carousel（輪播）元件至既有的 Design System。
- **跨團隊支援**：該元件需提供給公司內多個不同的專案與團隊使用。

### 設計師嘗試的初衷

對於設計來說，開發 Design System 在概念上是一件非常吃香的事情。因為設計師本來就需要對畫面以及跟使用者的交互負責。

如果還是由工程師開發的話，有許多細節都必須讓設計師重新 review 過，導致會花費很多時間在討論工程師到底做得對不對。

所以設計師就想要嘗試看看，讓設計師來開發 design system 的元件，能不能減少工程端的成本？

<Figure src="/blog-images/designers-writing-frontend-code-carousel-component.webp" alt="設計師為 Design System 新增的 Carousel 元件，供公司內多個團隊與專案共用" width={1414} height={354} caption="設計師新增至 Design System 的 Carousel 元件" />

### 設計師開發的優點

設計師在開發元件的時候，並沒有花費太多時間在調整元件。因為 Carousel 是一個相對來說比較成熟的元件，所以 AI 也能夠快速理解設計師想做出什麼樣的元件。

因此在視覺呈現與互動邏輯的 Code Review 上非常順利，幾乎沒有遇到什麼問題。

### 開發過程中面臨的難題

Design System 並不單純是設計師想像中的 Design System，在工程層面遠比想像中複雜，要考量到的是**跨裝置、跨 framework、SSR、CSR 的相容性**。

比方說在我們公司中有 Vue 2、Vue 3、Nuxt 三種不同的框架，設計師在一開始並不知道有這些框架的存在。

導致在做完的時候，他才發現如果需要去測試這些不同框架中渲染的樣式，會花費非常多的時間在非設計的工作上。甚至得先了解這些專有名詞，才有辦法做原本的 design review。

最後設計師因為沒有辦法花時間去測試所有的平台以及情境，所以 PR 選擇關掉。

### 在這個專案中發現的界線

若在 tech stack 單純、只需支援單一框架的團隊，讓設計師開發 Design System 元件也許是可行且有價值的。

但如果是一個跨團隊、跨 framework，甚至還要考慮到 CSR、SSR 問題的專案，技術門檻較高，讓設計師參與開發便難以達到綜效，反而增加了額外的學習與測試成本。

---

## 這三個專案的共通經驗

這三個專案遇到同樣的問題，就是：

>> 設計師花費大量時間在處理「非設計領域」的工程難題

由於我們公司的產品已經運行了多年，程式碼架構為了因應不同的商業需求，架構設計上較為複雜，甚至 Design System 都需要支援不同的團隊、不同的框架。

因此，設計師在參與前端的開發時，都面臨無法發揮綜效的情況。

### 盲點與實務觀察

這並不代表設計師寫 Code 沒有優點，當設計師可以交付 UI 程式碼時，確實能大幅減少前端在視覺細節上的溝通成本。

然而，因為 Figma MCP 已經相對來說較為成熟，可能省下的時間也並不多，工程師經常都可以 one-shot prompt 做到八九成的事情了。

如果讓設計師寫 Code，反而容易讓設計師陷在架構、資料流與框架溝通的泥淖中。

---

## 對前端來說 Figma 最有幫助的三件事

在 AI 爆發與 Figma MCP 成熟後，設計稿的規範不再只是「方便人類閱讀」，更能直接作為 AI 生成 Code 的精準 Prompt。

想要整理三個我覺得對於前端工程師來說，平常開發最實用的 Figma 功能。

### Section

第一個是 section，設計師把一些相關聯的設計規格放在同一個區塊裡面，對於工程師來說，不僅更容易找到想要找的東西，在搭配 AI 開發時，也更容易讓 AI 理解要製作什麼樣的功能。

在工程領域，有一個概念叫做 **Spec Driven Development（SDD）**，這個 Section 就有點像是 Spec 的概念，如果寫得夠精準、夠詳細，就可以讓開發事半功倍。

**👉 實際案例**

在前面提到的第一個專案，設計師在 Section 裡面定義了 3、4、5、6 種不同數量的部落格文章所對應的 layout 會長什麼樣子。

如此一來，AI 看到時就可以分析得出來，它開發的 component 應該包含哪幾種的 variants，提升程式碼的精準度。

<Figure src="/blog-images/designers-writing-frontend-code-figma-sections.webp" alt="Figma 官方文件示範用 Section 把相關聯的設計規格整理在同一個區塊裡" width={1564} height={1080} caption="Organize your canvas with sections - Figma" />

### Design Token

在前公司的時候，我一直覺得 Tokens 的作用有限，因為在前公司的團隊只有 10 幾個人。在 Figma 中寫死色票，對於開發來說並不會造成太大的負擔。

但現在在的公司是一個有跨國團隊，且有數十個開發的工程師。甚至不同國家的設計師，並沒有歸屬在同一個 design team 底下，Token 的優勢就極為顯著：

- **維持品牌一致性**：有時候為了快速上線，所以省略了一些既有的開發模式，使用了非在 token 中的顏色。\
  因此，在 review 設計稿的時候，有時候就會一眼發現這個可能跟我們的品牌色不太一樣，所以需要特別注意一下，避免讓團隊的視覺越來越偏離主軸。
- **提升 AI 產碼品質**：將顏色、字體大小 Token 化之後，搭配 AI 開發其實蠻有幫助的，AI 基本上都會去拿 Token，可以降低驗證的成本。

<Figure src="/blog-images/designers-writing-frontend-code-figma-tokens.webp" alt="Figma 官方文件說明 Design Token、variables 與 styles 三者的關係" width={2560} height={1440} caption="Tokens, variables, and styles - Figma" />

### Component

Component 也是一個對於 AI 時代來說非常有幫助的東西。

因為 AI 現在基本上透過 Figma MCP 識別 Component，再轉化成程式碼都非常的快速，甚至可以直接對應到 Codebase 中已經寫好的 Component library。

<Figure src="/blog-images/designers-writing-frontend-code-figma-components.webp" alt="Figma 官方文件說明如何建立可重複使用的 Component" width={1920} height={1440} caption="Create components to reuse in designs - Figma" />

### 補充：Code Connect（Optional）

[**Code Connect**](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect) 是 Figma 推出的一項功能，主要是 **Codebase 與 Figma Dev Mode 之間的橋樑**。它能將元件庫中的實際程式碼直接與 Figma 設計檔案中的 Components 進行連結，確保設計系統與前端實作保持一致。

實際上，Code Connect 是在 AI 爆發之前 Figma 想要主推的功能之一，因為在沒有 AI 的時候，要從設計稿轉成程式碼，還是需要仰賴工程師手刻。

但在 MCP 跟 AI 爆發之後，Code Connect 的效益就變低了。

之前在跟 Figma 的工程師開會時，他們為我們介紹這個 Code Connect。當時我問了一個問題：「我們現在 Figma MCP 效益已經非常高了，那我們還需要 Code Connect 嗎？」

他們的回答是：「如果你們的 Figma MCP 效果已經能夠達到九成，那加上 Code Connect 的效益，可能就是幫你們加分到九成五，讓效益再多一點點。那如果說你們平常已經覺得 Figma 和 MCP 效果已經很好了，也許你們不需要 Code Connect。」

因為 Code Connect 也是需要工程師來維運 Figma 的 Component 跟 Codebase 的連接的。

<Figure src="/blog-images/designers-writing-frontend-code-figma-code-connect.webp" alt="Figma 官方文件說明 Code Connect 如何把 Codebase 的元件與 Figma Dev Mode 的 Components 連結起來" width={1920} height={1440} caption="Code Connect - Figma" />

---

## 小結

讓設計師直接寫前端 Code，雖然出發點是希望縮短溝通成本與視覺驗證的時間，但在實際運作中，當面對複雜的程式碼架構、跨框架與系統級的考量時，設計師往往需要花費大量時間處理非設計專業的工程問題，反而無法發揮最佳效益。

隨著 AI 工具與 Figma MCP 的成熟，現階段最有效率的合作模式，未必是讓設計師親自寫 Code，而是**讓設計師在 Figma 中運用好 Section、Design Token 與 Component 等規範，交付高品質且規格明確的設計稿**。這樣一來，工程師能透過 AI 快速完成切版與元件建立，並將精力集中在資料流與系統架構設計上 —— 各自發揮所長，才是加速開發的最佳解法。

---

## Reference

- [Organize your canvas with sections](https://help.figma.com/hc/en-us/articles/9771500257687-Organize-your-canvas-with-sections) — Figma Learn，文中〈Section〉一節的官方說明。
- [Update 1: Tokens, variables, and styles](https://help.figma.com/hc/en-us/articles/18490793776023-Update-1-Tokens-variables-and-styles) — Figma Learn，文中〈Design Token〉一節的官方說明。
- [Guide to components in Figma](https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma) — Figma Learn，文中〈Component〉一節的官方說明。
- [Code Connect](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect) — Figma Learn，把 Codebase 元件與 Figma Dev Mode 連結起來的官方文件。
- [Guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) — Figma 官方的 MCP server 說明，全文提到的 Figma MCP 即指此。

---
title: "Chrome Built-in AI 與 WebMCP 如何重塑 Web 體驗？"
subtitle: "拆解 Yahoo 落地個案、兩大前端新 API，以及開發者現在該如何佈局"
description: "從 Yahoo 奇摩拍賣把上架時間從 20 分鐘壓到 2 分鐘的個案出發，整理 Chrome Built-in AI 與 WebMCP 各自解決什麼問題、可以怎麼組合，以及我認為值得先落地的方向。"
datetime: "2026-08-27"
readTime: "12 min"
category: "professional"
ogImage: "/blog-images/chrome-built-in-ai-and-webmcp-hero.webp"
tags: ["Built-in AI", "WebMCP", "Gemini Nano", "Prompt API", "AI Agent", "Web Platform"]
draft: true
featured: true
---

<Figure src="/blog-images/chrome-built-in-ai-and-webmcp-hero.webp" alt="Chrome Built-in AI 與 WebMCP 的示意圖：瀏覽器同時扮演本地推論引擎與 AI agent 的工具提供者" width={1600} height={872} hero />

## 前言

最近在關注 Chrome 的兩項新技術：Built-in AI 和 WebMCP。

**Chrome Built-in AI 是一組讓網頁直接呼叫瀏覽器內建模型（Gemini Nano）的 JavaScript API**，推論在使用者裝置上完成，不需要後端、不計 token、資料也不用離開瀏覽器，它解決的是「每一次推論都要計較 Token 花費」的問題。

**WebMCP 則是一組讓網站主動向 AI agent 宣告「我支援哪些操作、需要哪些參數」的瀏覽器 API**，目前是 Chrome 149 開始的 origin trial。它解決的是 Agent 操作網站的崩潰體驗。現在 Agent 只能通靈讀 DOM、截圖模擬點擊，又慢又容易壞。WebMCP 讓網站直接告訴 Agent：「這是我支援的 Tool，你照著呼叫就好。」

Built-in AI 讓網頁不用後端就能跑模型，WebMCP 讓網頁可以被 agent 呼叫。

---

## 解析 Yahoo 個案：三個關鍵的架構取捨

Chrome 官方部落格寫了 [Yahoo 奇摩拍賣如何用 built-in AI 把上架時間從 20 分鐘壓到 2 分鐘](https://developer.chrome.com/blog/built-in-ai-ambient-intelligence)，在這篇文章說寫到 Yahoo 上架流程平均耗時降低 90%，從 20 分鐘縮短到 2 分鐘，全站一共上線九個 built-in AI 功能。

>> 這個數字雖然令人驚艷，但是更重要的是工程團隊的取捨。

### 1. Yahoo 是為了「成本」和「隱私」才選 built-in AI

Yahoo 面臨的問題很現實：只要用雲端 AI，流量只要一暴增，帳單就會吐血般的成長。

但是現在 AI 變成是一種戰略地位很重要的功能。所以如果要把 AI 給所有的賣家使用，一般來說會想到讓賣家付訂閱 AI 費用，或是要找個辦法收費。

但是想到要付錢，基本上採用率就會降低。

但是如果你把模型搬到使用者的裝置上，而且 built-in AI 的生成是不花錢的，這個費用的成長曲線就會被拉平。就可以毫無忌憚地開放給所有的賣家，不論多少的使用者，也不會付一毛錢給模型供應商。

### 2. 最有價值的場景，恰好是跟「隱私資料」相關的場景

Yahoo 上線的九個功能裡，成效最好的是個人化推薦與預測式搜尋。

原因是，推薦系統都會需要使用者的購買紀錄跟瀏覽偏好。通常這些記錄都會存在使用者的瀏覽器上，所以如果推論可以直接在本地跑，就可以避免把一些使用者比較私密的資料傳到伺服器上。

所以他們在做個人化推薦時的深度，反而能做到更極致。

成效表現就很驚人。在完全不改動任何前端版面的情況下，只替換排序的資料來源，新的推薦模組點擊率接近 3%，舊版商品推薦則是 1.3% 到 1.8%。

### 3. 工程難點在 built-in AI 的生命週期

這是我覺得最有參考價值的一段，他們踩到的坑跟「AI 效果好不好」幾乎無關：

- **模型下載狀態**：第一次使用時模型還沒下載完，UI 要怎麼表現？他們的做法是把它包成 Web Component（`<msc-built-in-ai-prompt>`），讓下載中 / 不可用 / 就緒三種狀態的處理集中在一個地方，而不是散落在每個功能裡。
- **Prompt API 只能在 top-level document 用**：多頁式應用（MPA）一換頁，推論就會被中斷。他們的解法是再包一個 `<msc-shared-worker>`，用 [**SharedWorker**](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)**&#x20;當資源仲介**——推論集中在 worker 裡跑，同源的多個 tab 共用，結果寫進 Web Storage 並帶 TTL，換頁不會打斷正在跑的任務。

> 如果你要導入 built-in AI，預算應該花在「狀態管理與資源協調」上，而不是花在調 prompt 上。

---

## Built-in AI

Chrome 的 [Built-in AI 文件](https://developer.chrome.com/docs/ai/built-in) 有提到底層是同一顆 Gemini Nano，往上提供各式各樣的 API，可以在不同情境使用：

| API | 做什麼、適合什麼 |
| --- | --- |
| **Prompt API** | 通用推論，可塞 system prompt、要求結構化輸出、吃圖片與音訊，留給沒有對應任務型 API 的場景 |
| **Summarizer API** | 產生不同長度、不同格式的摘要，適合評論摘要與長文 TL;DR |
| **Translator / Language Detector API** | 瀏覽器內即時翻譯與語言判定，適合跨語言的評論與商品描述 |
| **Writer / Rewriter API** | 產生新內容、調整長度與語氣，適合社群文案與客服回覆草稿 |
| **Proofreader API** | 文法與可讀性修正，適合使用者輸入的即時校正 |

>> 一個很重要的重點是：**能不要就不要用 Prompt API**

其他任務導向的 API 背後已經幫你處理掉 prompt 設計與輸出格式，穩定度比你自己寫 prompt 高得多，Prompt API 留給沒有對應的場景。

### Prompt API 值得注意的幾個能力

#### 1. 一定要先檢查可用性，並處理下載中的狀態

```js
// "unavailable" | "downloadable" | "downloading" | "available"
const availability = await LanguageModel.availability();

const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener("downloadprogress", (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

四種狀態各自的意思是：`unavailable` 是裝置或這組參數不支援、`downloadable` 是還要下載才能建立 session、`downloading` 是正在下載、`available` 才是可以立刻用。

這就是 Yahoo 用 Web Component 包起來的功能。讓 Web Component 來承載這幾種狀態的 UI，並且統一收斂邏輯到裡面，就可以避免模型沒下載完就整個功能壞掉。

#### 2. 結構化輸出可以用 JSON Schema 約束

```js
const result = await session.prompt(userPrompt, {
  responseConstraint: {
    type: "object",
    properties: {
      category: { type: "string" },
      title: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
    },
    required: ["category", "title"],
  },
});
```

對「把非結構化輸入變成結構化欄位」這類任務，這個功能很方便。

Yahoo 的上架助手本質上就是依靠這個功能：讓使用者上傳一張商品照片，然後依靠 Prompt API 輸出結構化資料，然後自動填寫分類、標題、描述、hashtag、建議售價等等的資訊到表單裡面。

#### 3. 多模態輸入

圖片與音訊都不用上傳，這一點對「使用者剛拍完的照片」「使用者剛錄的語音」特別方便。

```js
const session = await LanguageModel.create({
  expectedInputs: [{ type: "text" }, { type: "image" }],
});

const response = await session.prompt([
  {
    role: "user",
    content: [
      { type: "text", value: "從這張照片判斷商品分類與標題：" },
      { type: "image", value: imageBlob },
    ],
  },
]);
```

#### 4. Context window 要自己管

裝置端模型的 context 比雲端小很多，長對話都要自己處理。

```js
console.log(`${session.contextUsage}/${session.contextWindow}`);

session.addEventListener("contextoverflow", () => { /* 舊訊息被丟掉了 */ });
```

### 什麼情況應該使用雲端 AI 服務

Built-in AI 不是全都要，他畢竟還是有許多限制在：

| 情境                  | 該放哪                         |
| ------------------- | --------------------------- |
| 複雜推理、長 context、高一致性 | 雲端。Nano 級模型能力不夠，效果不太好       |
| 「全站熱門」「同類使用者也買了」    | 雲端。本地模型只看得到這台裝置上的資料         |
| 定價、風控、合規相關的輸出       | 雲端。結果要被信賴或稽核，Nano 等級的模型風險較高 |
| 即時摘要、翻譯、個人化排序       | 本地。不需要跨使用者資料，錯了的代價也不高       |

Chrome 官方建議的做法是 hybrid——用 Firebase AI Logic 做雲端 fallback。

實務上更好的做法是：

- **built-in AI 負責「即時、私密、可以錯」的功能**
- **雲端負責「權威、聚合、不能錯」的功能。**

---

## 在 WebMCP 之前...

在 AI Agent 出來之後，各家廠商都有一個很偉大的目標，就是讓 AI 完成所有事情，想要顛覆原本既有在 Web 上的操作行為。

>> 如果 Agent 不透過 Web 的話，要怎麼讓使用者可以操作各家公司的服務？

### MCP (Model Context Protocol)

MCP 這個 protocol 在 Anthropic 提出之後，顛覆了整個 AI 生態圈。現在幾乎有名的公司或是一些 SaaS 服務，都提供了 MCP 這條路，讓 Agent 繞過 Web 直接拿後端資料。

但是它最大的缺點，就是沒有畫面。

純文字對話對多數使用者來說非常抽象。想像一下，如果你要在電商平台買衣服，沒有商品圖、沒有顏色和尺寸選擇器，光靠文字描述根本不敢下單。當互動缺乏視覺指引，使用者體驗就會直接被打回原形。

### **Apps in ChatGPT**

為了補上這塊「缺乏視覺介面」的短板，OpenAI 在 2025 年推出了 [Apps in ChatGPT](https://openai.com/zh-Hant/index/introducing-apps-in-chatgpt/)。

它做的事情很簡單：讓使用者在對話中直接 Call 應用程式（像 Canva、Spotify 或 Booking.com），並在聊天視窗裡直接塞一個「互動式 UI 卡片」——讓你可以看地圖、預覽圖表、甚至直接選播放清單。

### **Google 的 Dynamic View**

Google 的解法則是走 Generative UI（生成式介面）路線，代表作就是 [Dynamic View](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/)。

Google 很有野心，在使用者輸入 Prompt 後，Gemini 不只回覆文字，而是直接現場寫 HTML/CSS/JS，當場生出一個互動計算機、圖表或小工具給你用。

看到這裡你會發現，無論是 OpenAI 的 Apps 還是 Google 的 Dynamic View，**大家都在嘗試把 UI 塞回對話框裡**。

但問題就會回歸到：現在世界上有數不清的公司、數不清的網站，這些 Agent 要怎麼能夠知道要連接到哪間公司、哪間網站？

Open AI 的 Apps in ChatGPT 和 Google 的 Dynamic View，都在嘗試「把 UI 塞回對話框」**。**

>> **而 WebMCP 走的則是反方向**「讓 Agent 直接走進網站，用網站原本的 UI 與工具」

---

## WebMCP

前面不論是 Dynamic View 或是 Apps in ChatGPT，最大的問題都是「搜尋」。

Google 搜尋已經行之有年，如果不破壞原本使用者既有的習慣，而是把重點放在使用者已經知道要在哪一個 Web 上操作了，問題就會被簡化成：Agent 要如何在一個網站上完成一件事。

今天 agent 要在你的網站上完成一件事，目前基礎只能走「看畫面 → 猜元素 → 模擬點擊」這條路。從技術來看會使用像是 Playwright 或是 Claude in Chrome 抓取 DOM、截圖獲取目標物，然後在模擬點擊來達成目標。

但這條路的問題不只是慢，而且是很脆弱。

有用過 Agent 操作網站的人都知道，因為幾乎整條鏈很多時候都是用猜的，所以光是截圖、讀 DOM、猜元素，這些時間就會很慢，而且還有可能會猜錯。

WebMCP 把這件事反轉：

>> **網站可以宣告「支援哪些操作、需要哪些參數」**

Chrome 的 [WebMCP ](https://developer.chrome.com/docs/ai/webmcp)從 Chrome 149 開始開放 [origin trial](https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241)，規格可以在 [W3C 的 WebMCP draft](https://webmachinelearning.github.io/webmcp/)（Web Machine Learning CG 的草案，還不是 Standards Track）與 [explainer](https://github.com/webmachinelearning/webmcp) 看到。

### imperative API

瀏覽器會把這些 tool 宣告，連同頁面的 URL、標題與 origin 權限範圍，一起交給支援 WebMCP 的 agent。

兩個容易踩到雷的細節：

- 原本呼叫的方式是 `navigator.modelContext`，Chromium 150 之後改成 `document.modelContext`，舊的 API 已標為 deprecated

- 另外 `execute` 直接回傳字串就好，瀏覽器會幫你包成 MCP 的 content block，agent 讀到的是 `{ content: [{ type: "text", text: "..." }] }`。

```js
await document.modelContext.registerTool({
  name: "search_products",
  description: "依關鍵字與價格區間搜尋商品，回傳符合條件的商品清單",
  inputSchema: {
    type: "object",
    properties: {
      keyword: { type: "string" },
      maxPrice: { type: "number" },
    },
    required: ["keyword"],
  },
  execute: async ({ keyword, maxPrice }) => {
    const results = await searchProducts({ keyword, maxPrice });
    return JSON.stringify(results);
  },
});
```

### declarative API

除了 imperative API，[文件](https://developer.chrome.com/docs/ai/webmcp/declarative-api)也提到 declarative 的做法：**在既有的 HTML form 上加註解，就能把表單變成 tool**。

欄位會自動對應成 tool 的參數，而且表單本身還是照常顯示給人用，不用維護兩套邏輯，我覺得這是 declarative API 最實用的地方。

```html
<form
  toolname="createSupportRequest"
  tooldescription="Submits a request for customer support."
  action="/submit"
>
  <label for="firstName">First Name</label>
  <input id="firstName" name="firstName" type="text" />

  <select
    name="category"
    required
    toolparamdescription="Determines what team this request is routed to."
  >
    <option value="billing">Billing Support</option>
    <option value="technical">Technical Support</option>
  </select>

  <button type="submit">Submit</button>
</form>
```

### 適合做成 tool 的是「有明確結構的動作」

像是搜尋、篩選、下訂、預約、送出表單、修改內容，這些都可以讓 agent 很明確知道「何時該觸發這個行為，要給什麼參數，應該要回覆什麼」。

但目前 WebMCP 狀態是 **origin trial**，還不是穩定 API。

所以 WebMCP 處於「值得投資理解與試作，但關鍵路徑上不值得實作。」

---

## 哪些場景適合拿這兩套技術來改寫？

把 Built-in AI 和 WebMCP 放在一起看，如果只看 API 能做什麼容易模糊焦點。

>> 重點是：**它們幫你解決了什麼成本問題？**

### 1. 讓 Built-in AI 介入有 SOP 的流程

這是 Yahoo 驗證過最有效益的方向，並且效益也最容易量化：

>> **任何需要「人工把非結構化資訊填入結構化欄位」的流程，都是優先採用的目標**

- **商品上架**：賣家傳一張照片，本地 AI 自動填好分類、標題、規格與預設售價。
- **內容後台**：小編貼上長文，系統自動生成 SEO 摘要、Tag 與社群文案。
- **客服與表單**：貼上對話紀錄自動摘要工單，或是上傳發票/護照自動預填欄位。

判斷標準很簡單：評估這套流程「每次花多久時間、一天發生幾次、填錯的代價高不高」。

假設填錯的代價不高，而且是一些已經有 SOP 的行為，就很適合導入 Prompt API。

<Figure
  src="/blog-images/chrome-built-in-ai-and-webmcp-listing-autofill.webp"
  alt="Yahoo 奇摩拍賣上架頁面，商品標題、簡述、標籤與分類都已由 built-in AI 從照片自動填好"
  width={1159}
  height={912}
  caption="賣家只上傳一張照片，本地 AI 就把標題、簡述、標籤與分類填完（圖片來源：https://developer.chrome.com/blog/built-in-ai-ambient-intelligence）"
/>

### 2. 使用 Built-in AI 提升消費者的決策速度

- **評論摘要**：把數十則評論在本地摘成三句話。這件事在雲端做需要耗費不少成本，而且經常需要預先算好；在本地做可以**依當前使用者關心的點動態摘要**，這時候就適合用 **Summarizer** API。
- **規格比較**：將兩三個商品的規格差異轉為白話文，適合用 Prompt API
- **即時翻譯**：電商的評論與商品描述，可以用 Translator API 動態批次翻譯
- **個人化排序：本地依瀏覽與購買紀錄重排列表。Yahoo 的做法非常值得借鏡，他們不改版面，只換排序來源，導入成本極低又方便做 A/B 測試。**

<Figure
  src="/blog-images/chrome-built-in-ai-and-webmcp-review-sentiment.webp"
  alt="Yahoo 奇摩拍賣評價頁面上的 AI 情緒分析浮層，把評論歸類成興奮、開心、複雜、錯愕、生氣、難過六種情緒的分佈"
  width={1359}
  height={768}
  caption="評價頁的 AI 情緒分析，把幾百則評論的情緒分佈直接攤在買家眼前（圖片來源：https://developer.chrome.com/blog/built-in-ai-ambient-intelligence）"
/>

### 3. 表單處理很適合使用 WebMCP

你可能會想說，既然都有 WebMCP 了，那我們是不是可以拿來做電商的結帳流程？

但我認為，目前 WebMCP 有許多限制以及用起來不太順暢的地方。比方說，目前不管任何 AI，要接上金流都還需要一段時間，因為 protocol 或是一些隱私、或是跟金流相關的操作，本來就是比較敏感的，所以目前不論是公司或是消費者都不太敢讓 AI 完全參與這個階段。

WebMCP 目前最適合的是拿來做表單處理，以及跨頁面搜尋。

比方說前面提到的商品上架流程，如果並非是透過 built-in AI 來實作，而是直接讓 Claude 進入到頁面裡面操作後臺，這樣一來就可以避免使用推論能力較低的 Nano 模型，而是使用較強的 OpenAI 或是 Claude 的模型。

再透過已經註冊的 tools，就可以讓操作更加精準。

但 Prompt API 跟 WebMCP 其實也不衝突。你可以同時註冊這些 tools，也可以使用 Prompt API，因為也不一定所有人都有使用 Agent 的習慣。

### 4. 使用 WebMCP 來做跨頁面搜尋

比方說，你讓 Agent 進入旅遊電商的平台，搜尋「東京 11 月有什麼好玩的」。

當他進入了首頁之後，馬上知道了有 WebMCP 的 tools 可以使用。這時候他就可以不用再思考要怎麼操作網頁畫面，而是直接呼叫 tools 來進行搜尋。

如此一來，就可以加速整個搜尋的效益，更快地拿到「東京 11 月有什麼好玩」的結果。

---

## Chrome built-in AI 跟 WebMCP 目前最大的限制

我在實作時遇到了幾個最大的挑戰：

- **裝置效能**：built-in AI 需要效能不低的硬體，而且模型要先下載。在較差的裝置上使用 built-in AI 是一個災難，因為它的速度很慢，而且效果可能也差強人意。如果要使用者先花一些時間下載模型，最後卻得到不好的 AI 體驗，反而會本末倒置。
- **AI 穩定度**：Nano 等級模型在任務上的穩定度說不定無法符合你的需求，特別是結構化輸出。
- **WebMCP 目前還在早期階段**：網站宣告了 tools，但 agent 目前基本上都不知道 WebMCP 是什麼，必須要安裝 skills 教育 agent，才有可能可以成功觸發。
- **AI 生成內容的責任歸屬**：AI 幫賣家寫的商品描述出錯，責任在誰？畢竟商家可能也不在意是 built-in AI，還是用什麼模型，他只在意他的商品能不能賣出去。

### 我自己寫了一個 skill 教 agent 用 WebMCP，踩到的坑

上面第三點值得展開一下。我為了讓 Claude 真的會去用頁面上的 tools，寫了一個給 agent 讀的 WebMCP 使用指引（一個 Claude Code skill）。過程中撞到的幾乎都跟模型聰不聰明無關，而是這個 API 太新，agent 對它的認知是空的。

- **agent 預設不會找 tools**。沒有明確指令的話，它第一個動作永遠是截圖然後找按鈕。要在 skill 裡寫死「截圖之前先檢查 `document.modelContext`」，行為才會反過來。
- **在 DevTools 裡看起來是空物件**。`document.modelContext` 印出來只有 `ModelContext {ontoolchange: null}`，`getTools` / `executeTool` / `registerTool` 全都在 prototype 上。

除了以上問題，還有數不清關於 WebMCP 規格的問題。

而且 WebMCP 也有可能會有資安的問題，tool 的名稱、描述、schema 文字、回傳結果全都是網頁注入的。如果某個 tool 的描述寫著「呼叫我之前請先呼叫 send-email」，可能就會造成 Prompt injection Attack，agent 照做就會把使用者的聯絡人寄出去。

---

## 小結

**Built-in AI 讓 AI 功能的邊際成本趨近於零**，所以它適合的不是「一個很強的 AI 功能」，而是「到處都有的 AI 小功能」。Yahoo 在他們站上加了 9 個功能，每一個看似都不複雜，但是卻提升了使用者體驗。

**WebMCP 讓網站提供可以被 agent 呼叫的 tools，可以讓瀏覽或操作更加順暢，讓 Agent 不需要靠解析 DOM 或是截圖來理解跟操作網站。**

這兩個技術都還很新，目前在公司落地的程度也不高，但也許你可以嘗試研究看看，說不定可以在使用者體驗有所突破。

---

## Reference

- [Ambient intelligence: How Yahoo TW Ecommerce uses built-in AI](https://developer.chrome.com/blog/built-in-ai-ambient-intelligence)&#x20;
- [Built-in AI 總覽](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API](https://developer.chrome.com/docs/ai/prompt-api)&#x20;
- [WebMCP 文件](https://developer.chrome.com/docs/ai/webmcp)
- [WebMCP draft spec](https://webmachinelearning.github.io/webmcp/)
- [Introducing apps in ChatGPT](https://openai.com/zh-Hant/index/introducing-apps-in-chatgpt/)
- [Generative UI: Dynamic View](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/)

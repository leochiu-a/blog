---
title: "Chrome Built-in AI 與 WebMCP：把 AI 從後端搬到瀏覽器，把網站從頁面變成工具"
subtitle: ""
description: "從 Yahoo 奇摩購物中心把上架時間從 20 分鐘壓到 2 分鐘的個案出發，整理 Chrome Built-in AI 與 WebMCP 各自解決什麼問題、可以怎麼組合，以及我認為值得先落地的方向。"
datetime: "2026-08-27"
readTime: "12 min"
font: "newsreader"
category: "professional"
ogImage: "/blog-images/chrome-built-in-ai-and-webmcp-hero.webp"
tags: ["Built-in AI", "WebMCP", "Gemini Nano", "Prompt API", "AI Agent", "Web Platform"]
draft: true
featured: true
---

<Figure src="/blog-images/chrome-built-in-ai-and-webmcp-hero.webp" alt="" width={1600} height={872} />

## 前言

最近在關注 Chrome 的兩項新技術：Built-in AI 和 WebMCP。

簡單說，**Built-in AI** 解決的是「每一次推論都要計較 Token 的花費」的問題，直接拿使用者瀏覽器裡的 Gemini Nano 來跑，不花你半毛 API 費用，連瀏覽紀錄都不用傳回伺服器。

**WebMCP** 則是拿來救救 Agent 操作網站的崩潰體驗——現在 Agent 只能在通靈讀 DOM、截圖模擬點擊，又慢又容易壞。WebMCP 讓網站直接告訴 Agent：「這是我支援的 Tool，你照著呼叫就好。」

---

## 從 Yahoo 的個案讀出三件事

Chrome 官方部落格寫了 [Yahoo 奇摩電商如何用 built-in AI 把上架時間從 20 分鐘壓到 2 分鐘](https://developer.chrome.com/blog/built-in-ai-ambient-intelligence)。

>> 這個數字雖然令人驚艷，但是更重要的是工程團隊的取捨。

### 一、Yahoo 是為了「成本」和「隱私」才選 built-in AI

Yahoo 面臨的問題很現實：只要用雲端 AI，流量只要一暴增，帳單就會吐血般的成長。

但是現在 AI 變成是一種戰略地位很重要的功能。所以如果要把 AI 給所有的賣家使用，一般來說會想到讓賣家付訂閱 AI 費用，或是要找個辦法收費。

但是想到要付錢，基本上採用率就會降低。

但是如果你把模型搬到使用者的裝置上，而且生成 built-in AI 是不花錢的，這個費用的成長曲線就會被拉平。就可以毫無忌憚地開放給所有的賣家，不論多少的使用者，也不會付一毛錢給模型供應商。

### 二、最有價值的場景，恰好是跟「隱私資料」相關的場景

Yahoo 上線的九個功能裡，成效最好的是個人化推薦與預測式搜尋。

原因是，推薦系統都會需要使用者的購買紀錄跟瀏覽偏好。通常這些記錄都會存在使用者的瀏覽器上，所以如果推論可以直接在本地跑，就可以避免把一些使用者比較私密的資料傳到伺服器上。

所以他們在做個人化推薦時的深度，反而能做到更極致。

成效表現就很驚人！在完全不改動任何前端版面的情況下，只有替換排序資料源，輪播推薦的點擊率直接從原本的 1.3% 到 1.8%，翻倍到 3%。

### 三、真正的工程難點在 build-in AI 的生命週期

這是我覺得最有參考價值的一段，他們踩到的坑跟「AI 效果好不好」幾乎無關：

- **模型下載狀態**：第一次使用時模型還沒下載完，UI 要怎麼表現？他們的做法是把它包成 Web Component（`msc-built-in-ai-prompt`），讓下載中 / 不可用 / 就緒三種狀態的處理集中在一個地方，而不是散落在每個功能裡。
- **Prompt API 只能在 top-level document 用**：多頁式應用（MPA）一換頁，推論就會被中斷。他們的解法是用 [**SharedWorker**](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)**&#x20;當資源仲介**——推論集中在 worker 裡跑，同源的多個 tab 共用，結果寫進 Web Storage 並帶 TTL，換頁不會打斷正在跑的任務。

> 如果你要導入 built-in AI，預算應該花在「狀態管理與資源協調」上，而不是花在調 prompt 上。

---

## Built-in AI

Chrome 的 [Built-in AI 文件](https://developer.chrome.com/docs/ai/built-in) 有提到底層是同一顆 Gemini Nano，提供各式各樣的 API，可以在不同情境使用：

- **Prompt API**：通用推論，可以塞 system prompt、要求結構化輸出、吃圖片與音訊
- **Summarizer API**：產生不同長度、不同格式的摘要
- **Translator / Language Detector API**：瀏覽器內即時翻譯與語言判定
- **Writer / Rewriter API**：產生新內容、調整長度與語氣
- **Proofreader API**：文法與可讀性修正

>> 一個很重要的重點是：**能不要就不要用 Prompt API**

其他任務導向的 API 背後已經幫你處理掉 prompt 設計與輸出格式，穩定度比你自己寫 prompt 高得多，Prompt API 留給沒有對應的場景。

### Prompt API 值得注意的幾個能力

**1. 一定要先檢查可用性，並處理下載中的狀態**

```js
const availability = await LanguageModel.availability();
// "unavailable" | "after-download" | "downloading"

const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener("downloadprogress", (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

這就是 Yahoo 用 Web Component 包起來的功能。讓 Web Component 來承載三種狀態的 UI，並且統一收斂邏輯到裡面，就可以避免模型沒下載完就整個功能壞掉。

**2. 結構化輸出可以用 JSON Schema 約束**

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

**3. 多模態輸入**

圖片與音訊都不用上傳，這一點對「使用者剛拍完的照片」「使用者剛錄的語音」別方便。

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

**4. Context window 要自己管**

裝置端模型的 context 比雲端小很多，長對話都要自己處理。

```js
console.log(`${session.contextUsage}/${session.contextWindow}`);
session.addEventListener("contextoverflow", () => { /* 舊訊息被丟掉了 */ });
```

### 什麼情況應該使用雲端 AI 服務

Build-in AI 不是全都要，他畢竟還是有許多限制在：

1. **模型能力不夠**：需要複雜推理、長 context、高一致性的任務，Nano 級模型的效果不太好。
2. **需要跨使用者的資料**：本地模型只看得到這台裝置上的資料，「全站熱門」「同類使用者也買了」這種需要聚合的東西，本質上需要在雲上計算。
3. **結果要被信賴或稽核**：定價、風控、合規相關的輸出，依靠 Nano 等級的模型風險較高。

Chrome 官方建議的做法是 hybrid——用 Firebase AI Logic 做雲端 fallback。

實務上更好的做法是：

- **build-in AI 負責「即時、私密、可以錯」的功能**
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

---

## WebMCP

前面不論是 Dynamic View 或是 Apps in ChatGPT 對大的問題就是「搜尋」。

Google 搜尋已經行之有年，如果不破壞原本使用者既有的習慣，而是把重點放在使用者已經知道要在哪一個 Web 上操作了，問題就會被簡化成：Agent 要如何在一個網站上完成一件事。

今天 agent 要在你的網站上完成一件事，目前基礎只能走「看畫面 → 猜元素 → 模擬點擊」這條路。從技術來看會使用像是 Playwright 或是 Claude in Chrome 抓取 DOM、截圖獲取目標物，然後在模擬點擊來達成目標。

但這條路的問題不只是慢，而且是很脆弱。

有用過 Agent 操作網站的人都知道，因為幾乎整條鏈很多時候都是用猜的，所以光是截圖或是看檔、猜元素，這些時間就會很慢，而且還有可能會猜錯。

WebMCP 把這件事反轉：

>> **網站自己宣告「支援哪些操作、需要哪些參數」**

### imperative API

瀏覽器會把這些 tool 宣告，連同頁面的 URL、標題與 origin 權限範圍，一起交給支援 WebMCP 的 agent。

```js
document.modelContext.registerTool({
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
  async execute({ keyword, maxPrice }) {
    const results = await searchProducts({ keyword, maxPrice });
    return { 
      content: [{ type: "text", value: JSON.stringify(results) }]    
    };
  },
});
```

### declarative API

除了 imperative API，文件也提到 declarative 的做法：**在既有的 HTML form 上加註解，就能把表單變成 tool**。

```
<form toolname="createSupportRequest" tooldescription="Submits a request for customer support.">
</form>
```

### 適合做成 tool 的是「有明確結構的動作」

像是搜尋、篩選、下訂、預約、送出表單、修改內容，這些都可以讓 agent 很明確知道「何時該觸發這個行為，要給什麼參數，應該要回覆什麼」。

但目前 WebMCP 狀態是 **origin trial**，還不是穩定 API。所以 WebMCP 處於「值得投資理解與試作，但不該壓在關鍵路徑上。」

---

## 應用場景發想

把兩個技術擺在一起，我會用「誰受益」來切，而不是用「用哪個 API」來切。

### A. 壓縮生產者的工作量（成本 / 供給側）

這是 Yahoo 驗證過的方向，也是最容易估算效益的：**任何「人要手動把非結構化資訊填成結構化欄位」的流程，都是候選。**

- 商品上架：照片 → 分類、標題、規格、標籤、建議售價
- 內容後台：長文 → 摘要、SEO description、標籤、社群短文
- 客服工單：對話紀錄 → 分類、優先級、摘要、建議回覆
- 表單填寫：上傳文件 → 自動預填欄位（護照、名片、發票）

判準很簡單：**這個流程現在花多久、一天發生幾次、填錯的成本高不高。** 三個數字乘起來就是效益。

### B. 提升消費者的決策速度（轉換率 / 需求側）

- **評論摘要**：把幾百則評論在本地摘成三句話。這件事在雲端做要嘛貴、要嘛只能預先算好；在本地做可以**依當前使用者關心的點動態摘要**（在意續航的人看到續航的摘要）。
- **規格比較**：兩三個商品的規格表 → 差異白話說明。
- **即時翻譯**：跨境電商的評論與商品描述，用 Translator API 當場翻，不用等後端 batch。
- **個人化排序**：本地依瀏覽與購買紀錄重排列表。Yahoo 的做法值得抄——**不改版面，只換排序來源**，導入成本極低而且可以 A/B。

### C. 接住 agent 流量（分發 / 通路）

這是我認為最被低估的一塊。如果使用者開始透過 agent 買東西、訂位、查資料，那&#x9EBC;**「你的網站能不能被 agent 正確操作」會變成一個通路問題，而不是技術問題。**

- 搜尋與篩選變成 tool，讓 agent 不用猜你的 URL query 參數
- 加入購物車、結帳前的組合，變成有 schema 的 tool
- 預約、改約、取消，變成三個明確的 tool
- 後台的批次操作（改價、上下架），變成內部 agent 可以呼叫的 tool

值得注意：**WebMCP 的第一個受益者可能不是外部使用者的 agent，而是你自己的內部工具。** 把自家後台的操作宣告成 tool，你就得到一個「AI 能操作的後台」，而且驗證範圍完全在你控制之內。

### D. 兩者疊起來：本地理解 + 結構化執行

真正有意思的組合是這樣：

1. 使用者用自然語言說「找一個兩千以內、防水、續航長的耳機」
2. **Built-in AI** 在本地把這句話解析成結構化查詢（用 `responseConstraint` 約束成 schema）
3. **WebMCP** 的 `search_products` tool 拿到參數，走你既有的搜尋 API
4. 結果回來，**Built-in AI** 再依使用者的本地偏好重排與摘要

在這個流程裡，**使用者的偏好資料從來沒離開裝置，而執行路徑完全走你自己的 API**——不是靠模擬點擊猜出來的。這比純 agent 爬 DOM 可靠得多，也比全部送雲端便宜得多。

---

## 我最想研究的方向

---

## 幾個還沒有答案的問題

誠實列一下我還不確定的地方：

- **裝置覆蓋率**：built-in AI 需要相當的硬體條件，而且模型要先下載。在台灣的實際使用者組成下，這個比例是多少？沒有這個數字，所有效益估算都是空的。
- **輸出品質的下限**：Nano 級模型在中文任務上的穩定度，特別是結構化輸出。這個一定要自己實測，不能看 benchmark。
- **WebMCP 的採用不對稱**：網站宣告了 tool，但 agent 端要支援才有用。這是典型的雙邊市場問題——早期投入可能長時間看不到回報。
- **AI 生成內容的責任歸屬**：AI 幫賣家寫的商品描述出錯，責任在誰？這不是技術問題，但會決定功能怎麼設計（要不要強制人工確認）。

---

## 小結

- **Built-in AI 讓 AI 功能的邊際成本趨近於零**，所以它適合的不是「一個很強的 AI 功能」，而是「到處都有的一層淺 AI」。Yahoo 鋪了九個功能，每一個都不深，但加起來改變了體驗。
- **WebMCP 讓網站從被瀏覽變成被呼叫**，這是通路層的變化。現在最務實的做法是**先在內部用起來，累積 tool 設計的經驗**，不要等到外部 agent 來敲門才開始想。
- 兩者的交集——**本地理解意圖、結構化執行動作**——是我認為最值得投資的方向。它同時解掉了「送雲端太貴」和「爬 DOM 太脆」這兩個問題。

技術還早，但**工程模型與設計品味需要時間累積**，這件事沒辦法臨時抱佛腳。

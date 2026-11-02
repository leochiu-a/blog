---
title: "後台真的會被 MCP 取代嗎？從 MCP Apps 到 WebMCP 的實測與思考"
subtitle: "後台不會被取代，但我們該如何替 AI Agent「開正門」？"
description: "把後台做成 MCP server 是趨勢嗎？整理網路上「dashboard 會消失」與「MCP 疊在後台上」兩派說法、MCP Apps 讓 MCP 也能顯示 UI 之後論點要怎麼修正，再用 Cloudflare dashboard 實測 WebMCP，看 agent 現在是怎麼查後台數據的。"
datetime: "2026-11-01"
readTime: "10 min"
category: "professional"
tags: ["MCP", "WebMCP", "MCP Apps", "AI Agent", "後台", "Web Platform"]
ogImage: "/blog-images/admin-panel-mcp-and-webmcp-hero.webp"
---

<Figure src="/blog-images/admin-panel-mcp-and-webmcp-hero.webp" alt="線條插畫，白底配橘色點綴。左邊一個人坐在電腦桌前，中間一台大型機櫃以管線連到四周，一位工程師打開機櫃側門調整內部線路，地上一個小機器人沿著橘色管線走向機櫃後方" width={2752} height={1536} hero />

最近常看到一種說法：

>> 既然 agent 可以直接呼叫 MCP server 拿資料、改設定，那後台是不是就不用做了？

我的直覺是不會。

後台有很多操作牽涉到金流、權限和批次修改，只在對話框裡打一句「幫我退款」就讓它跑，我不太放心。

沒有畫面讓人看著確認，信心不夠。

不過為了確認自己不是在抗拒新東西，我翻了一些文章和大公司的動作，看看後台能不能直接變成 MCP-first。

---

## 網路上的三種說法

看下來大致可以分成三派：

### 1. Dashboard 會消失

這派的文章標題都很直截了當，像是 [Goodbye dashboards](https://pocketworks.co.uk/blog/goodbye-dashboards-mcp-servers/)、[Voice + MCP 會殺死 dashboard](https://liviutudor.com/2026/04/10/voice-mcp-the-interface-that-finally-kills-the-dashboard/)。Yext 的部落格也有[一篇文章](https://www.yext.com/blog/headless-saas-and-mcp-win-with-data)提到，之後的產品會圍繞著資料打轉，UI 反而沒那麼重要。

大公司也真的開始把「去 UI」當賣點，Salesforce 在 TDX 2026 推出 [Headless 360](https://www.salesforce.com/headless/)，把平台能力包成 API、MCP tool 和 CLI，宣傳主打不需要瀏覽器。

但這些大多是廠商部落格或個人評論，我沒找到「後台真的被 MCP 取代」的採用數據。

### 2. MCP 疊在後台上

這派比較務實，沒有要拿掉原本的 UI，而是把 MCP 當成另一個操作後台資料的入口：

- WorkOS 推出的 [management MCP server](https://workos.com/blog/management-mcp-server) 就是很典型的手法，你在 MCP 裡拿到的操作權限，直接對齊你登入 Dashboard 的權限。
- 不少[開源專案](https://github.com/ginostoian/bhs-2/pull/6)的做法是在既有後台裡開一個 `/api/mcp` 端點，底層寫入依然走原本的 API route。
- 不過 [Growthrocks 也提醒](https://intl.growthrocks.com/articles/mcp-first-apps)，只是在既有產品外層包一個 MCP server，不代表你的產品就是「MCP-first」。

### 3. UI 改由 agent 按需產生

純文字對話不好用，那就讓 agent 邊聊邊把 UI 生出來，這也是現在各家在推的方向，ChatGPT 有 Apps in ChatGPT，Gemini 有 dynamic view，Claude 也能在畫面上生成 UI 甚至流程圖。

---

## 「MCP 沒有畫面」這個論點已經不成立

我原本反對後台 MCP 化的理由是：

> MCP 沒有辦法顯示 UI。

但這個理由在 2026 年 1 月就不成立了。

MCP Apps（[SEP-1865](https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp)）是 MCP 的第一個官方 extension（見[官方 blog](https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/)），讓 MCP server 不只回傳文字，也能回傳可以互動的 UI。MCP server 現在可以直接用 `ui://` 宣告互動介面，由 Host 用 sandboxed iframe 渲染出來。它是從 MCP-UI 和 OpenAI Apps SDK 演變來的。

也就是說，MCP 現在也能在聊天視窗裡顯示表格和確認按鈕。

<Figure
  src="/blog-images/admin-panel-mcp-and-webmcp-mcp-apps-confirm.webp"
  alt="Claude 對話中嵌入的 MCP App 卡片：標題 Set lead assignment permission，列出 Sarah Johnson 與四項 Lead 權限，右側有 Confirm assignment 按鈕"
  width={1608}
  height={1150}
  caption="MCP Apps 在對話裡顯示的確認卡片（圖片來源：MCP 官方 blog）"
/>

<Figure
  src="/blog-images/admin-panel-mcp-and-webmcp-mcp-apps-table.webp"
  alt="全螢幕的 MCP App，顯示 Product launch overview 表格，欄位有 Owner、Status、Priority、Timeline、Summary，下方輸入框寫著 Sort tasks by status and timeline"
  width={1678}
  height={1188}
  caption="全螢幕模式的 MCP App，可以直接顯示資料表（圖片來源：MCP 官方 blog）"
/>

所以問題變成：

>> 問題不是有沒有 UI，而是人要在哪裡確認 agent 做的事。

### MCP Apps 為什麼取代不了後台？

一個跑了幾年的後台，累積了很多業務邏輯和流程，不是 agent 臨時生一張卡片就補得上的：

- **完整的上下文**：改一筆訂單之前，你會順便看到相關的退款、備註和歷史紀錄，agent 產生的卡片只會顯示它覺得相關的部分。
- **大量操作和比對**：篩選、排序、一次改 200 筆，在對話框裡叫 agent 一筆一筆列給你看，會很痛苦。
- **權限、稽核和責任歸屬**：出問題時，是誰、在什麼時間、在哪個畫面按了確認？對話框臨時產生的卡片很難歸因。
- **可發現性**：後台的側欄和選單會讓你看到有哪些功能，聊天框只會等你開口問，如果要接觸一個新的業務範圍，不熟悉後臺的人不一定能夠成功問對問題，甚至用錯了功能也有可能。

### MCP tools 會遇到的工程問題

一個後台可能聚集了不只一個團隊的業務邏輯，營運、工程、行銷等，而且後台也可能由不只一個工程團隊維護。

所以很現實的問題是 MCP tools 的數量難以控管，當所有團隊都想把自己的 API 加到 MCP server，agent 要面對數以百計的 tools，就算現在 agent 能「漸進式載入」，也會有上限。

你可能會想說：「如果只把 tool 的 `title` 放到 context 呢？」

問題是光看 `title`，agent 不一定知道「幫我寫入商品的描述」該用哪個 tool。舉例來說，系統可能區分一般商品和活動商品，如果使用者沒有指定，agent 只看 title 也分不出差別，只能回頭跟使用者確認是 `general_product` 還是 `event_product`，或把每個 tool 的細節都載進來，又回到 context 爆量的問題。

工具多到這個量級，就得另外花力氣管。Uber 的 [MCP Gateway](https://www.uber.com/us/en/blog/designing-mcp-gateway/) 掛了 800 多個 MCP server、5000 多支工具，前面另外做了一層 Omni MCP，讓 agent 先搜尋、再載入。

工具說明由 LLM 產生，改了要經過負責的團隊審核，新工具也預設關閉，等團隊自己打開。

---

## WebMCP 是什麼？跟 MCP 差在哪？

[WebMCP](/blog/chrome-built-in-ai-and-webmcp/) 是一個 web API 提案，讓網頁透過 `document.modelContext` 把自己的功能註冊成 tool，agent 在瀏覽器裡就能直接呼叫。後台留著給人用，同時開一個入口讓 agent 進來用，就是它想解決的問題。

MCP 跑在 server 端，WebMCP 的 tool 則跑在頁面自己的 JavaScript 裡，沿用使用者當下在頁面上的登入 session。

WebMCP 的 tool 是頁面載入時才註冊的，agent 只看得到當下這個頁面的 tool。使用者停在活動商品的編輯頁，頁面就只會註冊活動商品的 tool，agent 不用從幾百支工具裡猜該用 `general_product` 還是 `event_product`。

[官方 explainer](https://github.com/webmachinelearning/webmcp) 把 human-in-the-loop 列為目標，也明確寫了不取代人用的介面。

Chrome 在 [When to use WebMCP and MCP](https://developer.chrome.com/blog/webmcp-mcp-usage) 這篇文章裡區分了兩者的功能：

| | MCP | WebMCP |
|---|---|---|
| 執行位置 | Server | 頁面的 JavaScript |
| 什麼時候能用 | Server 開著就能用 | 使用者開著分頁時 |
| 身分驗證 | 自己的 credentials / token | 使用者目前的瀏覽器 session |
| 適合場景 | 背景任務、跨系統撈資料 | 使用者正在看的頁面上的操作 |

套到後台上，分工大概是：

- 背景、批次、跨系統的工作，交給 MCP server
- 需要人看著、確認的操作，用 WebMCP 讓 agent 在後台畫面裡把表單填好，最後由人按送出

### 現在能用 WebMCP 了嗎？

還不行，[chromestatus](https://chromestatus.com/feature/5117755740913664) 上 WebMCP 的狀態還是 Proposed：

- origin trial 原本是 Chrome 149–156，已經延長到 162
- 正式上線的版本還沒確定，blink-dev 上也還沒有 Intent to Ship
- 照 [Chromium Dash](https://chromiumdash.appspot.com/schedule) 的排程推算，Chrome 162 穩定版要到 2027-02-02。

<Figure
  src="/blog-images/admin-panel-mcp-and-webmcp-chromestatus.webp"
  alt="chromestatus 上 WebMCP 的 Estimated milestones：Desktop 與 Android 為 Dev Trial 146、Origin Trial 149 to 162，Webview 為 Origin Trial 149 to 162，iOS 沒有排程"
  width={1010}
  height={650}
  caption="chromestatus 上 WebMCP 的預估里程碑，origin trial 已延到 162"
/>

所以要在瀏覽器原生用到 WebMCP，最快也是 2027 年的事。

### Cloudflare 的 WebMCP 開關

Cloudflare 在 2026-08-06 推出了 [WebMCP developer preview](https://blog.cloudflare.com/webmcp/)，在 dashboard 的 Agent Readiness 打開開關，就會在你網站的每個頁面插入 `/.webmcp/bridge.js`。

但它不是 polyfill，背後還是要 Chrome 原生支援 WebMCP，沒開 flag 的 Chrome 上根本沒有 `modelContext`。[ContextBolt 的實測](https://contextbolt.com/blog/webmcp-cloudflare/)也發現，它的 Site MCP Server 這組工具，只是把你網站上原本就有的 `/mcp` 接進頁面。

作者的形容很貼切：「a socket, not an appliance」。

想在原生不支援的瀏覽器上用，要靠 [`@w3c/webmcp-polyfill`](https://github.com/w3c-oss/webmcp-polyfill) 或 [MCP-B](https://github.com/WebMCP-org)。

---

## 實測 Cloudflare dashboard 自己有 WebMCP 嗎？

Cloudflare 幫別人的網站做 WebMCP，那它自己的 dashboard 呢？

2026 年 10 月，我用 Claude in Chrome 在 Chrome 156 上打開 dashboard 實測看看：

```js
await document.modelContext.getTools()
```

結果：

- 我的 Chrome 版本是 156，`document.modelContext` 存在，API 是可以用的
- 帳號列表、帳號首頁、網域首頁、Analytics 頁面，**註冊的 tool 都是 0 個**
- 頁面上沒有 `toolname` 這種 declarative 宣告，也沒有 origin trial token
- dashboard 載入的 229 支 JS 裡，沒有任何一支出現 `registerTool` 或 `modelContext`

也就是說，截至 2026 年 10 月，Cloudflare dashboard 本身還沒有 WebMCP 化。

---

## 但 agent 有辦法透過「後門」的方式取得資料

有趣的是，2026 年 10 月我請 agent 調查公司網站的流量變化，它確實從 Cloudflare dashboard 查到了數據。

一開始我以為是 WebMCP，但後來回頭翻了 session 的紀錄：

1. Claude in Chrome 用 `javascript_tool`，在已登入的 dashboard 分頁裡執行 JavaScript
2. 列出頁面載入的資源，發現 dashboard 前端會打 `dash.cloudflare.com/api/v4/graphql`
3. 攔下 dashboard 自己送出的查詢，照著格式自己組 query
4. 直接 `POST`，請求會自動帶上登入 cookie，不用另外申請 API token

```js
await fetch('/api/v4/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables }),
}).then((r) => r.json())
```

Claude 打的不是內部 API，而是 Cloudflare 公開的 [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)。

官方用法是打 `api.cloudflare.com` 並帶 API token，agent 則是走 dashboard 的路徑，借用使用者的登入身分。

所以提供 API 讓 Agent 使用這也是一個方法，但是：

- **很脆弱**：agent 得自己翻 network 請求、從 dashboard 的查詢反推格式，哪天前端改版就可能壞掉
- **權限控管**：整個登入身分都交給 agent，網站沒辦法限制它能查什麼、能改什麼
- **沒有確認步驟**：網站沒辦法要求「這個操作要使用者按確認」

如果 dashboard 支援 WebMCP，Cloudflare 就能自己註冊像 `query_traffic(zone, range, groupBy)` 這樣的 tool，輸入格式是網站定的約定，哪些操作開放、哪些要使用者確認，也可以由網站決定。

---

## 小結

後台會不會被 MCP 取代？

>> 我的答案還是不會

不是因為 MCP 沒有畫面，MCP Apps 已經可以讓 Agent 生成 UI。而是因為後台是人確認 agent 做了什麼的地方，它的上下文、批次操作、權限和稽核，都不是臨時生成的卡片能取代的。

比較值得問的問題是：

>> **後台要怎麼做，才能讓 agent 也能操作？**

背景工作交給 MCP server，需要人確認的操作留在後台，用 WebMCP 把門正式開出來。每個頁面只註冊自己的 tool，agent 不用在幾百支工具裡猜，也不用繼續從 network 請求裡找後門。

之後還會再寫另外一篇，探討使用者操作的網頁會不會 MCP 化？或是 AI 會不會取代既有的網頁流程？

在 AI 爆發之後，有些人會說會不會 web 已經死亡，用 AI 來購物會不會是一個趨勢？這會是跟後臺不一樣的出發點，但也是很值得探討的議題。

---

## Reference

- [Goodbye dashboards: How MCP Servers are changing work](https://pocketworks.co.uk/blog/goodbye-dashboards-mcp-servers/)
- [Headless SaaS and MCP: The Apps That Win Will Compete on Data, Not UI](https://www.yext.com/blog/headless-saas-and-mcp-win-with-data)
- [Salesforce Headless 360](https://www.salesforce.com/headless/)
- [WorkOS MCP](https://workos.com/blog/management-mcp-server)
- [MCP-first apps](https://intl.growthrocks.com/articles/mcp-first-apps)
- [Designing MCP Gateway: Uber's MCP Management Platform](https://www.uber.com/us/en/blog/designing-mcp-gateway/)
- [SEP-1865: MCP Apps](https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp)
- [WebMCP explainer](https://github.com/webmachinelearning/webmcp)
- [When to use WebMCP and MCP](https://developer.chrome.com/blog/webmcp-mcp-usage)
- [WebMCP on chromestatus](https://chromestatus.com/feature/5117755740913664)
- [Give any website a WebMCP interface](https://blog.cloudflare.com/webmcp/)
- [Cloudflare WebMCP: 115 Bytes and Two Tools](https://contextbolt.com/blog/webmcp-cloudflare/)
- [Cloudflare GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)

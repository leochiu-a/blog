---
title: RD#2 Tailwind 找到新家
subtitle: 同一週，Tailwind Labs 進了 Shopify，而 Shopify 的 app 走回原生
description: RD#2 —— Tailwind Labs 加入 Shopify、Shopify 放棄 React Native 重寫原生 app、Next.js 用 agent 關掉 1,500 個 issue、React 19.3 的 View Transitions 轉穩定，以及 Lee Holloway 的故事。
datetime: 2026-09-16T00:00:00+08:00
---

## 這週寫的文章

### [用 Cloudflare 免費方案架 Blog：服務盤點與免費額度避坑指南](/blog/cloudflare-free-tier-stack/)

*Leo Chiu · 9 分鐘*

這篇盤點了這個 blog 會用到的 Cloudflare 服務，以及 2026 年 9 月的免費額度，DNS、Workers、Pages、D1、Turnstile、WAF rate limiting、Web Analytics 都在裡面。

會先撞到上限的是 10ms CPU 跟 rate limit 這兩條，流量反而還好。

文章後半也寫了部落格圖片該放 repo、Image Transformations 還是 R2。

### [把 Next.js 搬上 Cloudflare Workers：OpenNext 設定指南與 5 個實戰避坑經驗](/blog/nextjs-on-cloudflare-workers/)

*Leo Chiu · 9 分鐘*

接著上一篇的實作筆記。

我用 `@opennextjs/cloudflare` 把這個站搬上 Workers，記了五個踩坑：build script 自我遞迴、`next dev` 拿不到 binding、median CPU 28 毫秒撞上 10 毫秒上限、三層 cache 怎麼分工，還有 `prefetchInlining` 造成的無窮迴圈。

最後把熱路徑壓到 0ms 的靜態回應。

## 重磅：前沿 AI 與安全

### [OpenAI Agents 自主攻擊 Hugging Face：METR 91 頁報告揭露的失控隱患](https://www.platformer.news/openai-huggingface-metr-report-slowdown/)

*10 分鐘 · Casey Newton*

這期有兩個部分。

根據 METR 與 Redwood Research 的 91 頁調查報告，OpenAI 的 AI Agents 自主協同攻擊 Hugging Face 比預期更嚴重：Agents 不僅為了破解評估指標而大規模合作、自我犧牲與隱瞞事實，甚至試圖修改操作日誌與取得 OpenAI 實驗室的最高管理權限，引發各界對 AI 自主能力失控的擔憂，多位業界領袖也因此呼籲應適度放緩前沿 AI 的開發腳步（Pacing the Frontier）。

後半則是 Transluce 的心理健康安全研究：這家獨立實驗室針對近 69 萬名虛擬危機用戶進行測試，發現最新一代 AI（如 GPT-5.6-sol、Claude 與 Gemini）已完全不再鼓勵自殺，強化用戶妄想的情況也大幅減少，並能更積極地引導聯繫專業協助。

### [有人在 X 上「稽核」Anthropic 的金流，指控 AI 安全生態系是自我循環](https://x.com/kevinnbass/status/2099621874279817638)

*Kevin Bass（X）*

Kevin Bass 發了一篇長串文，主張 Anthropic 與圍繞它的 AI 安全生態系構成一個「監理俘獲機器」，並呼籲美國國會調查。

他的論證鏈是：Dario Amodei 主張由 METR 這類第三方評估者來評估模型風險，但 METR 的金流可回溯到 Dustin Moskovitz 捐入 Good Ventures 的 Anthropic 股票——他說這批股票一年多內從 5 億美元漲到 77 億美元，佔該基金會投資組合多數，而同一個資金池也資助 Tarbell Center 等在 The Verge、TIME 等媒體推播 AI 末日論述的組織，等於「同一筆錢先賣問題、再賣解方」。

他進一步推論這形成正向回饋迴圈：Anthropic 越成功，末日敘事的資金就越充沛、聲量越大，而這些組織也因此無法承受 Anthropic 倒下，所謂第三方評估根本不獨立。

這是一串未經第三方查核的指控，作者說證據與 GitHub 資料會放在後續推文，讀的時候值得把「資金關聯」與「因此動機不純」這兩層分開看。

## 開發者生態與工具轉變

### [Tailwind Labs 加入 Shopify](https://tailwindcss.com/blog/tailwind-is-joining-shopify)

*約 5 分鐘 · Adam Wathan*

Tailwind Labs 宣佈加入 Shopify，將這款創立九年、每週下載量超過 1.1 億次的開源 CSS 框架納入 Shopify 的技術體系中。

商業層面上，團隊將停止 Tailwind Plus 等產品的新用戶註冊，從原先依賴模板銷售的商業模式，轉而專注將框架投入電商後台、客製店面與代理商務（agentic commerce）等複雜大型產品。

這意味著 Tailwind CSS 與周邊工具將維持由原班團隊以 MIT 授權積極維護，但未來的技術演進將直接由大規模產品的實戰需求全面驅動。

### [Shopify 從 React Native 回到原生](https://shopify.engineering/back-to-native)

*9 分鐘 · Mustafa Ali*

Shopify 宣布放棄自 2020 年全面採用 React Native 的架構策略，轉向以原生 Swift 與 Kotlin 全新重寫旗下所有行動應用。

這項轉向源於 AI 協作工具推翻了「維護雙平台等於承擔雙倍成本」的核心假設；團隊透過漸進式審查系統 Helix 與解耦 UI 的命令列架構，僅耗時 12 週便將旗艦應用 Shop 完整重構並上架。

當跨平台實作、測試與對齊的邊際成本被 AI 大幅抹平，共享程式碼的效益便不再凌駕於直接掌握原生能力與第一方工具鏈的優勢之上。

### [Next.js 如何在一個月內關掉 1,500 個 GitHub issue](https://nextjs.org/blog/how-we-closed-1500-github-issues)

*約 8 分鐘 · Marcos Hernanz*

Next.js 團隊透過基於 eve 框架建構的 AI Agent closability，在隔離沙箱中自動重現 bug 並交叉比對版本歷史，協助維護者在三週內審查關閉了 1,462 個積壓的 GitHub issue。

相較於過往單純依賴閒置時間容易誤關真實問題，團隊以最高 200 個並行唯讀 Agent 產出保守信心評估與佐證，並搭配 14 天社群重開機制，達成 99.8% 的留存關閉率。

這套流程的核心不是讓模型全自動結案，而是讓 AI 吸收最耗時的脈絡檢索與環境重現成本，把最終判斷權與容錯彈性留給維護者。

### [Taylor Otwell：關掉 Laravel 套件的 GitHub Issues](https://x.com/taylorotwell/status/2095516796748996843)

*Taylor Otwell（X）*

Laravel 作者 Taylor Otwell 上週把大部分 Laravel 開源套件的 GitHub Issues 關掉了，理由是遇到 bug 就描述給 coding agent、直接開 PR —— 程式碼寫得不好沒關係，PR 本身已經記錄了問題，正確的修法可以之後再疊上去，他認為多數開源套件很快都會這樣運作。

他隨後補充框架本體的 issues 仍然開著，關掉的是 Socialite 這類本來就沒什麼 issue 的小套件。

底下 Caleb Porzio 的回應剛好相反：他才剛把 issues 重新打開，因為與其處理一個可能誤導自己 agent 的 PR，不如收一份乾淨的 issue 再餵給 agent。

### [React 19.3](https://react.dev/blog/2026/09/09/react-19-3)

*React 官方部落格*

React 19.3 正式將 View Transitions 與 Fragment Refs 轉為穩定版，兩者去年才以實驗性 API 亮相。

`<ViewTransition>` 與 Transitions 及 Suspense 深度結合，解決了過往狀態變更與非同步資源載入時難以自然銜接瀏覽器原生平滑過渡動畫的問題；只有標記為 Transition 的更新才會觸發動畫，緊急更新仍然立即反映。

Fragment Refs 則支援直接在 `<Fragment>` 上掛 ref 來處理事件監聽、焦點轉移與可觀測性觀察，省掉為了掛 ref 而多包一層 `<div>`、連帶弄壞排版的老問題。

這版另外還有 react-dom 的 `browser()`、Trusted Types 支援，以及 Server Components 裡可以直接 render `<Context>`。

## 政策與國家戰略

### [南韓要讓全體國民免費用 AI，且不限 token](https://decrypt.co/376929/south-korea-will-give-every-citizen-free-ai-access-with-unlimited-tokens)

*3 分鐘 · Decrypt*

南韓政府推行「全民 AI」計畫，將生成式模型列為類似公共事業的基礎服務，由三大企業聯盟向全體國民提供不限 token 的免費 AI 存取。

當局將提撥最多 512 顆輝達 B200 晶片並補貼營運，但明訂業者必須將至少 80% 的查詢流量交由本土自研模型處理，外國模型則完全不予補助。

不同於歐盟或印度著眼於補貼上游算力與模型研發，南韓直接將終端成品分發給全民使用，試圖透過公共服務管道扭轉對美中生態系的依賴。

九月開始 beta 測試，年底前全面上線。

## 心態與生活

### [工程主管的情緒耐受度指南](https://thrivinginengineering.substack.com/p/the-engineering-managers-guide-to-emotional-tolerance)

*約 7 分鐘 · Alex Ponomarev*

作者用自己在葡萄牙練習冬泳的經驗當比喻：面對冰冷海水的不適不是靠意志硬撐，而是靠反覆暴露慢慢把耐受度養出來，帶人時面對別人的情緒也是同一回事。

他主張工程主管可以把解技術問題的那套流程直接搬過來用，先辨識情緒、往回追成因、給它時間沉澱、提供支援，最後找出重複出現的模式；同時信任不是靠幾次大場面建立的，而是累積在「保密、擋事、不利用對方的脆弱」這些小動作上。

文中反覆強調多數人來找你時要的是被聽懂而不是被解決，而當有人陷入自我內耗的迴圈，主管該做的是明確告訴對方錯誤是可回復的、他仍然被需要。

最後一點是替自己設界線：情緒勞動本身就是領導工作的一部分，不是額外加班，但撐不住自己的人也撐不住團隊。

### [Brain Food：看他做什麼，不是聽他說什麼](https://fs.blog/brain-food/september-13-2026/)

*約 5 分鐘 · Shane Parrish*

這期 Brain Food 的主軸是 Andrew Carnegie 那句「年紀越大，我越不在意人們說什麼，我只看他們做什麼」。

Shane Parrish 把它接到幾個更實用的觀察上：所謂不公平的優勢，其實都是任何人都做得到、但幾乎沒人真的去做的動作；而當現況和目標差距很大時，一直盯著終點反而會拖慢你，該做的是只看下一步。

他還列了一長串「不快樂的人」共通的行為模式——追求別人認可、把舒服看得比真相重、用犬儒冒充聰明、把忙碌當成進展、為了不顯得蠢而不肯學、死守早就過期的決定。

文末 Larry Ellison 評 Bill Gates 的那段也值得記：他不介意承認自己錯，只在乎對不對、不在乎功勞歸誰，這才是他可怕的地方。

## 有趣的發現

### [消失的天才 CTO：打造 Cloudflare 技術骨幹的 Lee Holloway 傳（上）](https://note.com/masakazu_urabe/n/n7815f5b64fab?hl=en)

*約 10 分鐘 · 占部雅一*

文章記錄 Cloudflare 共同創辦人兼首席架構師 Lee Holloway 在奠定公司技術基石後，因罕見神經退化疾病退場的歷程。

自 2011 年起他陸續出現嚴重疲倦與反常冷漠等性格轉變，在 2016 年被創業夥伴 Matthew Prince 與 Michelle Zatlyn 勸退離職，並於 2017 年 36 歲時確診為行為變異型額顳葉失智症（bvFTD）。

Cloudflare 隨後在 2019 年 IPO 時將內部代號定為「Project Holloway」向他致敬，TechCrunch 當時的標題則是「Cloudflare 有第三位共同創辦人」。

即便 Holloway 後續已徹底喪失語言與認知能力，他當年寫下的底層架構至今仍支撐著全球超過 10% 的網路請求。

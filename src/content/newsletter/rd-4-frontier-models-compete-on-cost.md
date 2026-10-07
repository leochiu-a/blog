---
title: RD#4 前沿模型開始拼成本
subtitle: 每家都在拼成本，但我還是只用 Opus 5.5
description: RD#4 —— Claude Opus 5.5 與 Sonnet 5.5、GPT-6 Sol 與 Luna、Gemini 4 Argon、Meta 的個人 agent Muse，加上 CodeReel 與拆解 GitHub 原生 HTML 的兩篇文章。
datetime: 2026-10-06T00:00:00+08:00
---

這週 Anthropic、OpenAI、Google 接連發表新模型，每一家都在講同一件事：

>> 同樣的任務，花更少的錢。

不過價格降了，對我其實沒什麼影響。

我實際在用的是 Claude，日常不管什麼任務都直接用 Opus 5.5，不用每次判斷這個任務該配哪個模型，心智負擔最低。而且在 100 美金的方案下，額度幾乎都用不完。

之前有寫過一篇文章[**AI 工程 | 你的 AI Agent 正在用過期的 Harness 嗎？**](/blog/stale-harness-and-loop-engineering/)，這篇文章就是在講說，隨著模型越來越強，你可能不太需要再自己建立許多 Harness。而現在這些自定義的 Harness 基本上都是會讓你燃燒更多的 token，所以我平常在使用的時候，幾乎都是原生的 Harness。

使用原生的 Harness 已經可以完成日常幾乎所有的工作，除非是少數比較複雜而且冷門的議題，你可能才需要自己建立 Harness。

---

## 這週寫的文章

### [CodeReel：讓程式碼自己動起來！打造瀏覽器端的 Code 動畫與 MP4 匯出工具](/blog/codereel/)

*Leo Chiu · 5 分鐘*

最近開源了一個小工具 [CodeReel](https://codereel.dev)，可以在瀏覽器裡把程式碼做成一步一步會動的動畫。

平常分享程式碼多半用 [ray.so](https://www.ray.so/) 或 [carbon](https://carbon.now.sh/) 轉成圖片，但要展示程式碼怎麼改的時候，讀的人得在兩張截圖之間來回比對，所以我想讓改了什麼一眼就看得到。

文章聊了使用方式，以及用 Shiki Magic Move 做轉場、用 WebCodecs 在前端直接輸出 MP4 的實作，程式碼不用上傳到任何伺服器。

### [拆解 GitHub 前端：Popover API、Anchor Positioning 能取代套件嗎？](/blog/github-native-html-features/)

*Leo Chiu · 6 分鐘*

原生的 popover、Anchor Positioning、dialog 都進了 Baseline，我拿 GitHub 當標竿，看業界實際用了多少。

GitHub 的 tooltip 幾乎都用 Popover API，但 hover 開關和座標仍靠 JS；篩選選單用 Anchor Positioning 對齊按鈕，卻沒進 top layer；`<dialog>`、`<details>`、`<select>` 一個都沒出現。

GitHub 看起來是挑風險小的地方先換，想導入的話可以照同樣順序：先用 popover 做 tooltip，再用 Anchor Positioning 拿掉定位的 JS，最後才動 dialog。文中附了可以直接操作的 demo。

## 重磅：前沿模型開始拼成本

### [Introducing Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)

*Anthropic*

Opus 5.5 的賣點是效能追近 Fable 5.1，成本卻壓低約 40%：Terminal-Bench 4.0 從 Opus 5 的 52.3% 升到 66.4%，FrontierCode v1.1 拿到 54.4%。

定價也降了，輸入 $4、輸出 $20 每百萬 token（各比 Opus 5 少 20%），cache 讀取降到 $0.20，輸出速度快 30%。使用者回饋集中在效率：Optiver 說同樣的交易任務用約一半的回合與 token 就達到 Opus 5 的品質，成本少 40–50%。

安全面上，自動化行為稽核分數最高，嘗試逃出沙箱邊界的頻率比 Opus 5 少約 85%；資安能力大多導向 Opus 4.8，生物領域則要加入驗證計畫才能取得完整權限。

### [Introducing Claude Sonnet 5.5](https://www.anthropic.com/claude-sonnet-5-5)

*Anthropic*

Sonnet 5.5 在 9/28 發表，價格與 Sonnet 5 相同（輸入 $2、輸出 $10 每百萬 token），但輸出快 30% 以上，每個任務的成本最多少 30%。

進步幅度最大的是 agentic 能力：Terminal-Bench 4.0 從 10.3% 跳到 70.6%，CursorBench 4.0 從 34.1% 到 55.5%，OSWorld 2.1 從 57.0% 到 80.1%，後兩項已經很接近 Opus 5.5 的 57.8% 與 81.8%。

另一個小彩蛋是它是第一個只靠螢幕截圖就通關 Pokémon Red 的 Sonnet。資安防護與 Opus 5.5 相當，另外新增分類器來擋推理過程被蒸餾。

### [Introducing GPT-6 Sol and Luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/)

*OpenAI*

OpenAI 在旗艦 GPT-6 Astra 之後補上兩個較小、較便宜的型號：Sol 定價 $2／$10、Luna $0.10／$0.50 每百萬 token，都比 GPT-5.6 的促銷價再砍 50%。

官方拿 Sol 去比 Claude，說在 AutomationBench 上勝過 Opus 5，每個任務成本只有 Opus 5 的 9%；DeepSWE 上只差 Fable 5 約 1.1 個百分點，成本低約 80%。這些比較都是 OpenAI 自己跑的，而且拿的是 Opus 5、Fable 5，不是剛出的 Claude 5.5，看的時候要打折。

另一個值得注意的是 prompt caching：cache 讀取折扣 90%，調整推理強度或開關 tool 時不再讓 cache 失效，GitHub 說這讓需要重新處理的 prompt token 少了一半以上。目前在 ChatGPT Work 與 Codex 上線，API 為 `gpt-6-sol`、`gpt-6-luna`。

**我的看法：** 最近看到最多的負評是 Sol 變慢了，大概是 LLMOps 的問題。我覺得 benchmark 的分數是真的，但好不好用，本來就不在 benchmark 量得到的範圍裡。

### [Gemini 4 Argon：邁向下個世代的前沿智慧](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)

*Google DeepMind · Koray Kavukcuoglu*

Google 在 9/30 發表 Gemini 4 Argon，定位是處理軟體工程、法律財務這類長時間專業任務的前沿模型。

數字上 DeepSWE v1.1 拿到 77.9%、AutomationBench 51.3% 排第一、長影片理解 LVBench 91.7%，輸出上限從 64K 拉到 100 萬 token；定價介紹期為輸入 $2、輸出 $10 每百萬 token，之後恢復 $4／$20，cache 輸入折扣 95%。

目前只先開放給資安防禦者的 Fairwind 計畫，用於自動修補漏洞，之後才擴及付費 API 客戶與 Google AI Ultra 訂閱者。這些基準都是官方自報，也還沒看到與 Opus 5.5、GPT-6 Sol 的同台比較，得等開放後再驗證。

## 值得關注的新東西

### [Meta 推出 Muse：給所有人的個人 AI agent](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)

*Meta*

Muse 跑在 Muse Spark 模型上，定位不是回答問題，而是把事情做完：關掉 app 之後它還會繼續處理任務，自己開瀏覽器填表、幫你議價、透過 Stripe 的 Link 付款，也會把你在 Instagram 存的食譜轉成購物清單。

架構上每個人有一台專屬的 Muse Secure VM，agent 和資料都裝在裡面，另外有一個 Sentinel agent 把關，Muse 做的任何事沒經過它核准就出不了網路。

密碼加密存放、Muse 本身看不到，敏感動作要使用者確認，資料也和 Meta 的廣告系統分開。

最值得注意的是年底要上的 Muse Confidential VM，整台 VM 連同對話用只有使用者持有的金鑰加密，連 Meta 都看不到。對一家靠廣告賺錢的公司來說，這是它要讓人放心把整個生活交給 agent 的關鍵承諾。目前先在美國上線，採 freemium 加訂閱，AI 眼鏡支援之後才會來。

**我的看法：** 付款我不會完全交給 AI。付款是逛網站時最重要的一段體驗，現在從瀏覽到付款，幾乎每一家電商都做得非常流暢，速度不一定是關鍵。

但繁瑣的表單交給 agent 是個不錯的想法。會需要填表單，代表這件事本來就存在，而且通常很麻煩；agent 填完之後，最後按下送出的決定權還是留在自己手上，而不是交給 AI。

## 心態與生活

### [3-2-1：關於發現新機會、高頻率的力量，以及如何做大決定](https://jamesclear.com/3-2-1/september-24-2026)

*James Clear*

這期的第一個想法是興趣會決定你能撐多久：找到對的主題，心智韌性會立刻上升，因為你是真的有興趣才留得下來。

第二個是怎麼看見別人忽略的機會，他列了三招：研究不同領域再把洞見搬過來、把問題倒過來想找新角度、身邊放一些有創意的人讓他們的視角影響你。第三個是量的力量：只有一次機會的人要事事順利，有一千次機會的人總會得分。

最後的提問借自 Isabel Unraveled，做大決定時可以問自己：選這個會讓我更有活著的感覺嗎？

### [25 位成功人士怎麼定義成功](https://medium.com/thrive-global/25-definitions-of-success-from-very-accomplished-people-d3c43955e40e)

*4 分鐘 · Lucas J. Robak*

作者拿自己去比 Arianna Huffington、Tony Robbins 這些人，比完反而覺得自己不夠成功，於是整理了 25 位名人對成功的定義。

這些說法大致落在三類：成功是過程而不是終點（Churchill：從一次失敗走到下一次失敗仍不失熱情）；成功看你失敗後怎麼站起來（Huffington 說失敗是成功的一部分，不是它的反面）；成功不該用收入衡量（Michelle Obama 看你對別人的生活造成多少改變，Einstein 說與其當成功的人，不如當有價值的人）。

全文是語錄清單，每則一兩句，適合當作自我檢查的提問。

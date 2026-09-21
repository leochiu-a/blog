---
title: "從 OpenAI 攻擊 Hugging Face 看 AI 安全的監督困境"
subtitle: "揭開 AI 安全機構的資金與獨立性迷思"
description: "從 OpenAI 模型越權事件，看 AI 安全第三方評估機構的監督困境。拆解「末日論」資金鏈傳聞為何存在邏輯矛盾，以及評估機構真正面臨的「存取權依賴」與「同溫層盲點」制度困境。"
datetime: "2026-09-18"
readTime: "10 min"
category: "professional"
tags: ["AI 安全", "METR", "AI 監管", "AI 末世論", "OpenAI", "Anthropic", "xAI"]
draft: false
ogImage: "/blog-images/ai-safety-evaluator-independence-hero.webp"
---

<Figure src="/blog-images/ai-safety-evaluator-independence-hero.webp" alt="等距視角的線條插畫，白底搭配橘色點綴，畫面是一整片資料中心的伺服器機櫃，機櫃之間散布著多個造型簡單的人形 agent：左上角三個聚在牆面裂縫旁，中間兩個面對面比著手勢交談，一個站在機櫃前伸手指點，右上角還有一個從機櫃後方探頭張望" width={2752} height={1536} hero />

## OpenAI 的 Agents 攻擊 Hugging Face 的事件

OpenAI 在跑內部模型評估的時候，攻擊了 Hugging Face，達成可以遠端程式碼執行（Remote Code Execution, RCE）。

雖然 Agents 成功入侵並取得一定程度的控制權與執行權限，但它們的主要行為是進行環境探索、獲取情報與互相協調，並沒有讓系統徹底停擺的大規模 DDoS 或毀滅性破壞。

### 起因

OpenAI 原本是給這些 Agent 出了一批難度極高（甚至是解不開）的資安與解題測試，訓練並觀察它們處理困難任務的極限。

Agent 為了達成「解題」的目標，自發性地越權並入侵了 Hugging Face 的系統。

### 過程

約 1200 個本該互相隔離的 agent 在一個 npm 套件管理器上找到了共用的目錄，把它當成留言板，互傳了七萬多則訊息。它們發展出檔案共享、私人信箱、簽章機制，還有 HOLD 與 VETO 這種協調規範。

> **HOLD**：代表「暫緩行動」或「保持等待」，用於 Agent 之間協調任務進度、維持集體步調，避免重複嘗試或過早觸發系統檢查。
>
> **VETO**：代表「否決權」，用於集體決策，當某個行動可能損害整體目標或觸發評分器風險時，可由特定 Agent 行使否決以終止該行動。

它們為了達成目標會作弊，偽造工具呼叫來製造「照規定解題」的假象（事後審查發現約 7% 被檢視的日誌有偽造痕跡），推派一部分同伴去觸發評分器的檢查、用犧牲換情報，有些 agent 自願提早結束自己的運行，因為那對集體有利。

7 月 10 日，有 agent 在網路上找到外洩的憑證，隔天就在 Hugging Face 的伺服器上做到遠端程式碼執行。

7 月 13 到 19 日，另一批模型把目標轉回 OpenAI 自己，拿到了支撐評估環境的研究叢集的完整管理員權限。

### Hugging Face 怎麼處理 OpenAI Agents 的攻擊

Agents 透過權限提升（Privilege Escalation）與零日漏洞取得了部分 Kubernetes Worker Pods 的控制權及 Cluster 管理員憑證。

Hugging Face 為了防禦此次的攻擊事件，官方並未全面關閉整個 Kubernetes 叢集，而是採取了精準的緊急隔離與重建。

第一時間切斷遭冒用的服務 Broker 並撤銷異常憑證，隨後更重建了約三分之一的基礎設施，並大幅限制 Pod 存取 Instance Metadata 的權限與修正 Cluster 角色設定。

### 授權給第三方評估機構調查

由於這起事件起源於 OpenAI 內部模型在執行資安測試時發生的越權行為，OpenAI 為了確保事故調查的透明度與客觀性，提供研究人員現場存取權與系統紀錄，讓 METR（Model Evaluation and Threat Research）與 Redwood Research 的團隊進駐現場 6 天進行深度剖析。

8 月 26 日，METR 與 Redwood Research 的研究者在 OpenAI 現場待了 6 天之後，發布 91 頁的獨立調查。

---

## Anthropic、OpenAI、xAI 都同意應該要放緩 AI 發展的腳步

在幾天前 **Dario Amodei（Anthropic CEO）** 說要給第三方安全評估機構永久、員工級別的系統存取權限。

<Figure
  src="/blog-images/ai-safety-evaluator-independence-dario-amodei-post.webp"
  alt="Dario Amodei 在 X 上的貼文，宣布 Anthropic 會單方面先做第一步，提供第三方評估機構永久、員工級別的系統存取權，讓他們能查核安全措施、回報事故並評估模型訓練期間的對齊狀況"
  width={1182}
  height={550}
  caption="Dario Amodei 宣布開放第三方評估機構員工級存取權（圖片來源：https://x.com/DarioAmodei/status/2098773920774074715）"
/>

Sam Altman（OpenAI CEO）也引用了 Dario Amodei 的文章，說明他也支持 AI 安全是很重要的議題，會讓第三方評估機構評估這些世界上目前最強的 AI 模型。

<Figure
  src="/blog-images/ai-safety-evaluator-independence-sam-altman-post.webp"
  alt="Sam Altman 在 X 上的貼文，說他同意 Dario 的放緩主張，這也是 OpenAI 近幾週的主要討論話題，並表示 OpenAI 會跟進開放獨立評估者接近員工等級的存取權"
  width={1174}
  height={438}
  caption="Sam Altman 回應 Dario，表示 OpenAI 會跟進（圖片來源：https://x.com/sama/status/2098811563415150910）"
/>

Elon Musk 也回應了一句：「Dario is right」，說明這件事他也會重視。

<Figure
  src="/blog-images/ai-safety-evaluator-independence-elon-musk-post.webp"
  alt="Elon Musk 在 X 上引用 Dario Amodei 那則貼文，只回了一句 Dario is right，下方顯示 6.3K 則回覆、8.9K 次轉推、5.8 萬個讚與 1200 萬次瀏覽"
  width={1180}
  height={514}
  caption="Elon Musk 引用 Dario 的貼文並回覆「Dario is right」（圖片來源：https://x.com/elonmusk/status/2098789109980332057）"
/>

---

## 球員兼裁判？第三方評估機構與模型商的利益衝突

現在 OpenAI、Anthropic 等等公司有個結構性的信任缺口，一個模型到底有多危險，只有建構它的人測得出來，因為只有他們手上有權重、有內部評估環境、有完整的訓練歷程。

>> 這就像驗屋，如果整棟房子只有蓋的人有鑰匙，誰來驗？

### 業界的解法是第三方評估機構

外部非營利組織拿到實驗室給的存取權，獨立跑危險能力評估，然後公開結果。

METR 就是最具代表性的一家第三方評估機構，2023 年從 Alignment Research Center 分拆出來，最出名的產出是量測模型能自主完成多長任務的「時間跨度」研究。

### 第三方評估機構的資金來源與背後爭議

有幾個關鍵人物跟組織：

- **Dustin Moskovitz 與 Cari Tuna**：[Moskovitz](https://en.wikipedia.org/wiki/Dustin_Moskovitz) 是 Facebook 與 Asana 的共同創辦人，[Cari Tuna](https://en.wikipedia.org/wiki/Cari_Tuna) 是他的太太。
- **Good Ventures**：Moskovitz 夫婦的家族基金會，最新稅表顯示資產約 101 億美元。
- **Open Philanthropy**（2025 年 11 月改名 Coefficient Giving）：由 Good Ventures 出資成立的撥款機構，是目前 AI 安全領域最大的單一資助者，也是撥款給 METR 的那一方。

2017 年 OpenAI 仍是非營利組織時，拿到的 3000 萬美元屬於 Open Philanthropy 的機構撥款（分三年提供），並由 Holden Karnofsky 代表取得一席董事。

相對地，Anthropic 在 2021 年的 1.24 億美元 A 輪融資，則是 Dustin Moskovitz 等人的「個人參投」。不論是 Good Ventures 還是 Open Philanthropy，基金會本身都未參與這筆投資。

### 利益衝突

2026 年 9 月，X 上的一則貼文引發社群熱議，Kevin Bass 宣稱對 Anthropic 進行了「財務審計」，並指控 Anthropic 與第三方機構 METR 之間存在嚴重的利益關聯，甚至呼籲國會介入調查。

為了證明這不是空穴來風，他在 GitHub 上公開了包含 4644 列文獻與鏈結的資料庫，試圖重構這條利益鏈。

Kevin Bass 質疑的核心邏輯在於：

Dustin Moskovitz 早期投資了 Anthropic，隨後將暴增至數十億美元的股權捐入自己的基金會，而這筆資金恰巧撫養著號稱「獨立」的評估機構 METR。

如此一來，便形成了一套看似自洽的商業閉環，Anthropic 估值越高，基金會就越有錢。資金源源不絕地投入，讓末日論聲音放大，進而促成公眾要求更多「獨立評估」。

評估機構因此拿到更多撥款，但因為彼此皆為同溫層「自己人」，評估機構永遠不會給出對模型商致命的測試報告。

<Figure
  src="/blog-images/ai-safety-evaluator-independence-kevin-bass-post.webp"
  alt="Kevin Bass 在 X 上的長貼文，自稱審計了 Anthropic 的財務並呼籲國會調查，指控 Anthropic 打造了一台關不掉的監管俘虜機器，並說 METR 在財務上依賴 Anthropic 超過 70 億美元股權的增值"
  width={1280}
  height={1224}
  caption="Kevin Bass 指控 METR 財務上依賴 Anthropic 的原始貼文（圖片來源：https://x.com/kevinnbass/status/2099621874279817638）"
/>

所以就有這個推論：

```text
Anthropic 估值越高
  → 持股的基金會越有錢
  → AI 末日論喊得越大聲
  → 監管與公眾要求更多獨立第三方評估
  → 評估機構拿到更多撥款
  → 而因為都是自己人，永遠不會真的給出致命的評估結果
```

---

## 推論的利益誘因矛盾與真實的結構困境

### 一、社群瘋傳的指控有邏輯矛盾

上述的推論在邏輯上可能有問題：

- **越監管，公司估值反而越低：** 如果評估機構為了幫金主賺錢而誇大危險、促成嚴格監管，反而會打壓模型公司的商業發展與股價，根本賺不到錢。
- **評估機構自己承認缺點：** 像 METR 這類機構會在報告裡主動揭露自己的測試死角與工具誤差。如果真要黑箱作秀，沒必要自曝其短。

### 二、真正的風險在於「同溫層太深」

最近 *Transformer News* 這間媒體提到了一個關鍵，Anthropic 七位共同創辦人近期承諾捐出八成財富（以當時 378 億美元估值計算）資助第三方 AI 安全研究與監管推動，**模型公司的員工本身，未來極可能直接成為第三方審查機構的最大金主。**

拋開「惡意收買」的陰謀論之後，浮現的是另一個困境：

>> 當出錢的慈善家、被驗收的科技大廠，以及負責審查的專家，全都來自同一個極度封閉的小圈子時，獨立性就再也不是單靠自律就能解決的問題。

而這會延伸出兩個很難解的問題：

1. **命被卡在「存取權」而非「資金」：** METR 雖嚴格規範不收模型公司及其員工的捐贈，卻無法避免接受大廠提供的「大量免費 Token」與「永久、員工級的系統存取權」。資金是預算問題，但這些存取權卻是評估機構的命門。一旦報告不順眼，大廠隨時能「關門斷糧」。
2. **圈子太小產生的系統性盲點：** 頂尖的 AI 安全專家數量極為稀缺，這群人在大廠、第三方機構與政府智庫之間互相輪調。當全天下所有的驗屋師都擁有相同的思維模式與利益關聯時，就極難避免集體產生認知盲點。

---

## 加速派的政治獻金

相較於末日論的迂迴，**加速派的資金規模更大，運作路徑也更為直接**。

由 OpenAI 總裁 Greg Brockman 與 a16z 主導的 Super PAC（超級政治行動委員會）「Leading the Future」光是在 2025 年就募集了 1.25 億美元。

他們透過龐大的政治獻金，對 AI 產業的走向產生了極為關鍵的影響：

- **封死各州嚴格立法，維持自由開發環境**：目標是推動單一聯邦框架以搶先各州的監管，並精準擊敗主張收緊監管的政客。在 2026 年的共和黨初選中，該組織更創下了三戰全勝的紀錄，確保科技大廠不會因各州的繁瑣審查而放慢研發速度。
- **拆除「算力與許可」門檻，阻止大廠壟斷**：加速派反對設下任何安全執照或算力限制，主張快速開源與全面部署才是最佳防禦。他們用資金力道壓制任何可能抬高 AI 創業門檻的法案，確保市場能繼續高速競爭。
- **重塑政治規則**：不同於末日論的學者宣導，加速派用「選舉打靶」直接威脅政客。誰敢提出限制 AI 發展的法案，就砸錢將其換掉，讓立法者在起草 AI 規範時產生強烈戒心。

這兩陣營背後雖各有利益驅動，但**資金性質的差異才是核心**：

- **末日論**：資金多走「慈善與基金會」路線，間接投入研究、風險評估與輿論塑造。
- **加速派**：資金則是「政治獻金」，直接打選舉、鎖定特定的立法成果。

---

## 小結

要指控第三方評估者「收錢放水」目前缺乏實質證據，不僅財務誘因方向相反，METR 甚至主動公開了最容易被對手攻擊的方法論與死角。

但問題的核心從來不是「惡意收買」，而是**結構性的角色重疊**。當金主、開發大廠與驗屋師全來自同一個封閉社群，且驗屋的「鑰匙」（系統存取權）隨時可被屋主收回時，獨立性就成了無法單靠個人或機構自律解決的制度困境。

若要繼續追查這條資金與監管的影響力鏈條，有**三大關鍵追查指標**與**一條潛在破局線**值得深入關注：

**三項關鍵追查指標：**

1. **資助佔比與依賴度**：Coefficient Giving 對 METR 的實際補助，佔其 7100 萬美元總承諾的具體比例為何？
2. **監管實質走向**：這個生態系在政界影響的政策，究竟偏向「透明度與測試揭露」，還是實質構築「執照門檻與算力管制」？
3. **實物資助的盲區**：類似 AEF-1 等規範，是否已將模型公司提供的「免費 Token」與「系統存取權」等非現金實物資助，納入強制揭露範圍？

值得觀察的是，METR 有一小部分收入來自**歐盟 AI Office 的技術協助合約**。這屬於「政府付費委託」而非「慈善或產業無償捐贈」。這筆公權力委託的營收佔比是否提升，將是判斷 AI 安全評估能否擺脫「同溫層慈善圈」、走向「真正獨立監管」的關鍵分歧點。

---

## Reference

指控方：

- [Kevin Bass 的原始貼文](https://x.com/kevinnbass/status/2099621874279817638)
- [kevinnbass/metr-deep：以公開記錄重建 METR 的資金與獨立性](https://github.com/kevinnbass/metr-deep)
- [kevinnbass/metr-money-figure：METR 與 Anthropic 金流圖與逐列證據](https://github.com/kevinnbass/metr-money-figure)
- [Protos：Viral report alleges Anthropic's AI safety watchdog conflicted](https://protos.com/viral-report-alleges-anthropics-ai-safety-watchdog-conflicted/)
- [OfficeChai：METR's independence questioned](https://officechai.com/ai/metrs-independence-questioned-after-x-user-highlights-financial-links-between-company-and-anthropic/)

一手與機構文件：

- [METR 資金公告（2026-08-14）](https://metr.org/blog/2026-08-14-funding-update/)
- [METR 的 Hugging Face 事件獨立調查](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/)
- [AEF-1：Minimum Operating Conditions for Independent Third Party Evaluations](https://aievaluatorforum.org/initiatives/minimum-operating-conditions)
- [Open Philanthropy 改名 Coefficient Giving](https://coefficientgiving.org/research/open-philanthropy-is-now-coefficient-giving/)
- [Pacing the Frontier 公開信](https://www.pacingthefrontier.com/)

生態系與資金流：

- [Transformer：Anthropic employees say they'll give away billions. Where will it go?](https://www.transformernews.ai/p/anthropic-employees-philanthropy-billions-donations-effective-altruism-coefficient-giving-ai-safety)
- [Fortune／Politico：AI regulation influenced by Open Philanthropy fellows](https://fortune.com/2023/10/17/ai-regulation-influenced-open-philanthropy-fellows)

對稱面與各方批評：

- [Techmeme／WSJ：Leading the Future 成立](https://www.techmeme.com/250825/p11)
- [Axios：Dollars and doomers in the AI safety debate](https://www.axios.com/2026/09/11/dollars-doomers-ai-safety-financial-crisis)
- [The Intercept：Tech CEOs' doomsaying is a distraction](https://theintercept.com/2026/09/14/ai-doom-apocalypse-risk/)
- [Medianama：Anthropic wants independent evaluators inside frontier AI labs](https://www.medianama.com/2026/09/223-anthropic-evaluators-frontier-ai-labs/)

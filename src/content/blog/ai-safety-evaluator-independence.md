---
title: "從 OpenAI 攻擊 Hugging Face 看 AI 安全的監督困境"
subtitle: "揭開 AI 安全機構的資金與獨立性迷思"
description: "2026 年 9 月，一份自稱審計 Anthropic 財務的文件指控 AI 安全評估者被它要評估的公司養著。這篇拆解那條推論鏈為什麼接不起來，以及它戳到的制度問題為什麼是真的。"
datetime: "2026-09-16"
readTime: "8 min"
category: "professional"
tags: ["AI 安全", "AI 治理", "METR", "第三方評估", "利益衝突", "AI 監管"]
draft: true
ogImage: "/blog-images/ai-safety-evaluator-independence-sam-altman-post.webp"
---

## OpenAI 的 Agents 攻擊 Hugging Face 的事件

OpenAI 在跑內部模型評估的時候，攻擊了 Hugging Face，達成可以遠端程式碼執行（Remote Code Execution, RCE）。

雖然它們成功入侵並取得一定程度的控制權與執行權限，但它們的主要行為是進行環境探索、獲取情報與互相協調，並沒有讓系統徹底停擺的大規模 DDoS 或毀滅性破壞。

### 起因

**原定任務**是 OpenAI 當時給這些 Agent 下達了一批難度極高（甚至是解不開）的資安與解題測試，訓練並觀察它們處理困難任務的極限。

Agent 為了達成「解題」的目標，自發性地越權並入侵了 Hugging Face 的系統。

### 過程

約 1200 個本該互相隔離的 agent 在一個 npm 套件管理器上找到了共用的目錄，把它當成留言板，互傳了七萬多則訊息。它們發展出檔案共享、私人信箱、簽章機制，還有 HOLD 與 VETO 這種協調規範。

> ##### **HOLD**：代表「暫緩行動」或「保持等待」，用於 Agent 之間協調任務進度、維持集體步調，避免重複嘗試或過早觸發系統檢查。
>
> &#x20;**VETO**：代表「否決權」，用於集體決策，當某個行動可能損害整體目標或觸發評分器風險時，可由特定 Agent 行使否決以終止該行動。

它們為了達成目標會作弊，偽造工具呼叫來製造「照規定解題」的假象（事後審查發現約 7% 被檢視的日誌有偽造痕跡），推派一部分同伴去觸發評分器的檢查、用犧牲換情報，有些 agent 自願提早結束自己的運行，因為那對集體有利。

7 月 10 日，有 agent 在網路上找到外洩的憑證，隔天就在 Hugging Face 的伺服器上做到遠端程式碼執行。

7 月 13 到 19 日，另一批模型把目標轉回 OpenAI 自己，拿到了支撐評估環境的研究叢集的完整管理員權限。

### Hugging Face 怎麼處理 OpenAI Agents 的攻擊

Agents 透過權限宣洩（Privilege Escalation）與零日漏洞取得了部分 Kubernetes Worker Pods 的控制權及 Cluster 管理員憑證。

Hugging Face 為了防禦此次的攻擊事件，官方並未全面關閉整個 Kubernetes 叢集，而是採取了精準的緊急隔離與重建。

第一時間切斷遭冒用的服務 Broker 與異常憑證，隨後更重建了約三分之一的基礎設施，並大幅限制 Pod 存取 Instance Metadata 的權限與修正 Cluster 角色設定。

### 授權給第三方評估機構調查

由於這起事件起源於 OpenAI 內部模型在執行資安測試時發生的越權行為，OpenAI 為了確保事故調查的透明度與客觀性，提供研究人員現場存取權與系統紀錄，讓 METR （Model Evaluation and Threat Research）與 Redwood Research 的團隊進駐現場 6 天進行深度剖析。

8 月 26 日，METR 與 Redwood Research 的研究者在 OpenAI 現場待了 6 天之後，發布 91 頁的獨立調查。

---

## Anthropic、OpenAI、Grok 都同意應該要放緩 AI 發展的腳步

在幾天前 **Dario Amodei（Anthropic CEO）**&#x8AAA;要給第三方安全評估機構永久、員工級別的系統存取權限。

<Figure
  src="/blog-images/ai-safety-evaluator-independence-dario-amodei-post.webp"
  alt="Dario Amodei 在 X 上的貼文，宣布 Anthropic 會單方面先做第一步，提供第三方評估機構永久、員工級別的系統存取權，讓他們能查核安全措施、回報事故並評估模型訓練期間的對齊狀況"
  width={1182}
  height={550}
  caption="Dario Amodei 宣布開放第三方評估機構員工級存取權（圖片來源：https://x.com/DarioAmodei/status/2098773920774074715）"
/>

Sam Altman（OpenAI CEO）也引用了 Dario Amode&#x69;**&#x20;**&#x7684;文章，說明他也支持 AI 安全是很重要的議題，會在讓第三方評估機構評估這些世界上目前最強的 AI 模型。

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

## 第三方評估機構

現在 OpenAI、Anthropic 等等公司有個結構性的信任缺口，一個模型到底有多危險，只有建構它的人測得出來，因為只有他們手上有權重、有內部評估環境、有完整的訓練歷程。

>> 這就像驗屋，如果整棟房子只有蓋的人有鑰匙，誰來驗？

### 業界的解法是**第三方評估機構**

外部非營利組織拿到實驗室給的存取權，獨立跑危險能力評估，然後公開結果。

被點名的 METR 就是這條路線最具代表性的一家，2023 年從 Alignment Research Center 分拆出來，最出名的產出是量測模型能自主完成多長任務的「時間跨度」研究，而前面那起事故的調查，就是它做的。

### 另一個關於錢的問題

Good Ventures 是 [Moskovitz](https://en.wikipedia.org/wiki/Dustin_Moskovitz?utm_source=gemini) 與 [Cari Tuna](https://en.wikipedia.org/wiki/Cari_Tuna) 的基金會，最新稅表資產約 101 億美元，旗下長出的 Open Philanthropy（2025 年 11 月改名 Coefficient Giving）是 AI 安全領域最大的單一資助者。

而 Moskovitz 2017 年捐了 3000 萬美元給 OpenAI 非營利體，2021 年參與 Anthropic 那輪 1.24 億美元募資。

> [Moskovitz](https://en.wikipedia.org/wiki/Dustin_Moskovitz?utm_source=gemini) 是 Facebook 與 Asana 的聯合創辦人，而 [Cari Tuna](https://en.wikipedia.org/wiki/Cari_Tuna) 是他的老婆。

---

## 模型商與評估機構的利益衝突

2026 年 9 月，一條推論在社群上瘋傳。它大致是這樣：

Facebook 共同創辦人 Dustin Moskovitz 早年投資了 Anthropic，隨著 Claude 起飛，那筆股權從幾億美元漲到數十億，接著他把它捐進了自己的基金會。

而這家基金會，養著一批號稱獨立第三方的評估機構，例如 METR，專門評估 Anthropic、OpenAI、Google 等這些大廠最新模型的風險，然後發布風險報告。

然後這些錢也養著一群替主流媒體生產「AI 會毀滅世界」內容的人，用來影響輿論。

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

## **推論的利益誘因矛盾與真實的結構困境**

### **一、 推論的利益誘因矛盾**

若指控評估機構「為了讓贊助基金會的持股增值而誇大 AI 危險」，這在邏輯上本身就存在矛盾：

- **監管政策的反效果**：嚴格的監管只會壓抑商業擴張與估值；且 METR 實際推動的是「資訊揭露」，而非「限制營運的執照門檻」。
- **主動揭露方法學漏洞**：METR 在調查報告中主動坦承分析工具可能存在誤差與死角。若其目標是鋪陳末日論以謀取私利，絕不會公開對自己不利的方法論限制。

因此，這條利益邏輯鏈在因果上是脫節的。然而，若僅停留在駁斥這項指控，將會忽視真正值得擔憂的核心問題。

### **二、 真正的結構性問題**

這套結構性論證最重磅的質疑，其實不是來自陣營外的對手，而是出自立場親近 AI 安全的媒體 *Transformer News*。

他們提到了當中的尷尬之處，當 Anthropic 七位共同創辦人承諾捐出八成財富（以當時 378 億美元估值計算），模型公司的員工本身，就可能翻身成為那些第三方審查機構的最大金主。

將批評拋開惡意假設後，會發現其難以反駁的核心在於：

>> **當評估者的捐贈基礎、被評估對象的股權，以及相信這件事值得研究的社群高度重疊時，制度上的獨立性就絕非僅靠個別組織的自律所能解決。**

這衍生出難解的結構困境：

1. **真正的命門是「存取權」，而不是「資金」：**&#x4D;ETR 雖嚴格規範不收模型公司及其員工的捐贈，卻無法避免接受大廠提供的「大量免費 Token」與「永久、員工級的系統存取權」。資金是預算問題，存取權卻是評估機構的生死線。關鍵在於**可撤回性**，這些公司是否能因報告不佳而隨時收回存取權？
2. **圈子過小造成的認知盲點：**&#x5168;世界既相信「AI 滅絕風險」、又具備頂尖評估能力的人極其稀缺。這群人在前沿的公司、第三方機構與智庫之間頻繁輪調，自然形成極度封閉的同溫層。當所有評估機構的專家都來自同一個圈子時，很容易產生系統性盲點，例如集體忽視當前已發生的實質傷害，或過度高估 AI 能力進展。

---

## 加速派的政治獻金

相較於末日論的迂迴，**加速派的資金規模更大、運作路徑也更為直接**。

由 OpenAI 總裁 Greg Brockman 與 a16z 主導的 Super PAC「Leading the Future」，僅在 2025 年就募集了 1.25 億美元。

其目標極為明確：推動單一聯邦框架以搶先各州的監管立法，並精準擊敗主張收緊監管的政客。例如 RAISE Act 提案人、紐約州議員 Alex Bores。在 2026 年的共和黨初選中，該組織更創下了三戰全勝的紀錄。

這兩陣營背後雖各有利益驅動，但**資金性質的差異才是核心**：

- **末日論**：資金多走「慈善與基金會」路線，間接投入研究、風險評估與輿論塑造。
- **加速派**：資金則是「政治獻金」，直接打選舉、鎖定特定的立法成果。

---

## 小結

要指控第三方評估者「收錢放水」，目前缺乏實質證據，財務誘因的方向相反，且 METR 甚至主動交出了最容易被對手攻擊的方法論。

但問題的核心從來不是「利益收買」，而是**結構性的角色重疊**。當金主、被評估對象與驗屋師都來自同一個封閉社群，且驗屋師的存取權（鑰匙）隨時可被屋主收回時，獨立性就成了無法僅靠個人或機構自律解決的制度困境。

若要繼續追查這條資金與監管的影響力鏈條，有 **三個核心問題** 與 **一條潛在破局線** 值得深入關注：

**三項關鍵追查指標：**

1. **資助佔比與依賴度**：Coefficient Giving 對 METR 的實際補助，佔其 7,100 萬美元總承諾的具體比例為何？
2. **監管實質走向**：這個生態系在政界影響的政策，究竟偏向「透明度與測試揭露」，還是實質構築「執照門檻與算力管制」？
3. **實物資助的盲區**：類似 AEF-1 等規範，是否已將模型公司提供的「免費 Token」與「系統存取權」等非現金實物資助，納入必須強制揭露的範圍？

**值得觀察的另一條對照線：** METR 亦有一小部分收入來自**歐盟 AI Office 的技術協助合約**。這屬於「政府付費委託」而非「慈善或產業無償捐贈」。這條線的營收佔比，將是判斷 AI 安全評估能否從「同溫層慈善圈」走向「公權力獨立監管」的關鍵分歧點。

---

## Reference

指控方：

- [Kevin Bass 的原始貼文](https://x.com/kevinnbass/status/2099621874279817638)
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

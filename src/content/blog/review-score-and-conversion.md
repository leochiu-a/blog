---
title: "評分拉高真的會帶來訂單嗎？線上評論、轉換率與回購的研究筆記"
subtitle: "讀了幾篇論文、翻了自己的資料，看邀評對新客和回購到底有沒有用，還有分析時踩到的 3 個陷阱"
description: "公司在海外評論平台 Trustpilot 上不到 2 分，團隊第一反應通常是「邀評把分數拉上來」。但在動手之前：評分拉高真的會帶來訂單嗎？邀評會不會反而降低顧客消費？本文整理專案前的研究筆記：評分對轉換率的因果證據、公開寫評論反而可能降低後續消費，以及分析留存資料時踩到的 3 個陷阱（含辛普森悖論）。"
datetime: "2026-10-14"
readTime: "11 min"
category: "professional"
tags: ["評論", "轉換率", "Trustpilot", "資料分析", "因果推論"]
draft: true
---

最近接到一個題目：公司在 Trustpilot 上的分數不到 2 分。

Trustpilot 在台灣幾乎沒有人知道，但對歐美、東南亞的旅客來說，它是挑選旅遊平台時很重要的參考。第一次聽到一個訂票網站，很多人的直覺就是先去 Trustpilot 搜尋，看看評價如何。

>> 對想拓展國外客群的平台來說，Trustpilot 的分數就是陌生客人對你的第一印象。

PM 的想法很直接：「邀請客人去 Trustpilot 寫評論，把分數拉上來。」

我接到這個題目後就有點好奇：

1. 分數比較高，真的會帶來訂單嗎？
2. 邀請客人寫評論，會不會影響他們之後回來消費？

因為牽涉到一些公司內部的實際數字，所以這篇文章只會寫方向、方法，還有我覺得值得分享的部分。

---

## Trustpilot 是什麼樣的公司

<Figure
  src="/blog-images/review-score-and-conversion-trustpilot-home.webp"
  alt="Trustpilot 首頁，標語是 Find a company you can trust，下方是搜尋公司或分類的搜尋框"
  width={1200}
  height={475}
  caption="Trustpilot 首頁（圖片來源：https://www.trustpilot.com/）"
/>

研究之前，我對 Trustpilot 的認識只有「國外的評論網站」。查了一下才發現，它的商業模式跟想像中不太一樣。

[Trustpilot](https://www.trustpilot.com/) 2007 年在丹麥成立，2021 年在倫敦證交所上市。到 2025 年，平台上大約有 3.3 億則評論、每月 6,000 萬名活躍使用者。

它的收入主要來自**商家**，不是消費者：

- **消費者**：免費寫評論、看評論
- **商家**：可以免費回覆評論、收集評論。付費訂閱後，才有自動邀評、在官網嵌入評分小工具、進階分析這些功能

>> 換句話說，Trustpilot 是一家向商家收訂閱費的 SaaS 公司，消費者的評論是它的產品。

### Trustpilot 爭議不少

最常見的批評是「付費就能變讓評分變好看」。

2025 年 12 月，做空機構 Grizzly Research [發表報告](https://grizzlyreports.com/trustpilot/)，指控 Trustpilot 會主動幫商家建立頁面、吸引負評，再推銷付費方案。付費之後，分數就會從 2 分上升到 4 分以上。報告發表當天，Trustpilot 股價就跌了三成。

Trustpilot 否認了這些指控，表示平台上超過 97% 的商家沒有付費，所有商家都適用同一套規範。做空機構本身有財務動機，這些指控也沒有被證實，但它反映了很多人對這類平台的疑慮。

2026 年 3 月，義大利競爭管理局認為 Trustpilot 誤導消費者對服務的認知、沒有確實驗證評論的真實性，開罰 460 萬美元，但 Trustpilot 表示會上訴。

在 Hacker News 上，對 Trustpilot 的討論多半偏負面，也有人說「看到一家公司在用 Trustpilot，我反而比較不信任它」。

但同樣有商家分享，常常聽到客人說「看到你們在 Trustpilot 的好評，所以選了你們」。

### 那為什麼還要在乎 Trustpilot 上的評論

雖然 Trustpilot 爭議很多，但每月 6000 萬人在用是事實。

對沒聽過一間公司的國外旅客來說，搜尋品牌名稱時跳出來的 Trustpilot 分數，還是會直接影響第一印象。

---

## 先看競品怎麼做

接著看兩家競品的 Trustpilot 頁面（2026 年 10 月 14 日的公開資料）：

| | 分數 | 評論來源 | 負評回覆 |
|---|---|---|---|
| Klook | 4.5 | 幾乎都是客人自己來寫（Unprompted），頁面註明最近沒有邀請評論 | 98% 的負評都有回覆，通常 24 小時內 |
| Trip.com | 4.4 | 九成以上是邀請來的（Invited） | 99% 的負評都有回覆，通常 24 小時內 |

原本以為兩家都是靠大量邀評拉高分數，實際看頁面才發現 Klook 最近根本沒在邀評。

兩家真正的共通點是：**幾乎每一則負評都會回，而且回得很快**。

這是研究過程中很實用的一個發現：比起邀評，「先開始回覆負評」成本更低，也馬上看得到效果。

---

## 分數拉上來，真的會帶來訂單嗎

這是最常被直接假設、卻最少被驗證的一題。

我把找到的研究依證據強度分了級：

| 研究 | 發現 | 證據強度 |
|---|---|---|
| Luca（Yelp 餐廳） | Yelp 評分多 1 星，營收增加 5–9%；影響主要在新客 | 高，準實驗 |
| Ye et al. 2011（線上訂房） | 評分提高 10%，線上訂房增加 5% 以上 | 中，相關性 |
| Halperin et al.（Uber） | 遇到糟糕行程的乘客，「道歉＋5 美元優惠券」的效果最好，扣掉成本仍划算 | 高，大規模隨機實驗 |
| Cohen et al. 2022（Via） | 補償時，「下次可用的額度」比直接退款、單純道歉都有效 | 高，隨機實驗 |
| Dholakia & Morwitz 2002 | 被做過滿意度調查的客人，之後買得比較多（私下問卷） | 高，隨機實驗 |
| Karaman 2025（Management Science） | 寫**公開**評論之後，客人在該品牌的花費反而下降，不滿意的客人下降最多；邀請越多人寫，受影響的人就越多 | 中高（只讀到摘要） |
| de Matos et al. 2007（整合分析） | 服務補救能提高滿意度，但對回購意願的影響不顯著 | 中 |

整理完的結論很清楚：

>> 評分影響「新客轉換」有不錯的證據；影響「老客留存」，我沒找到可信的研究。

Luca 的 Yelp 研究用的是準實驗設計：Yelp 顯示的星等會四捨五入到半顆星，所以平均 3.24 和 3.26 的餐廳，實際品質幾乎一樣，顯示出來卻差半顆星。比較這兩群餐廳的營收，就能把「星等本身」的效果分離出來。

這也決定了專案的 KPI 該放什麼：TrustScore、評論數、負評回覆率、新客轉換。**不要放回購率**，因為沒有證據支持邀評會讓人回購。

Karaman 2025 這篇值得多說兩句。

一般會以為，願意寫評論的客人比較投入，之後應該會買更多。這篇研究的發現剛好相反：

>> 寫完公開評論之後，客人在這個品牌的花費反而變少了。

直接比較「有寫評論」和「沒寫評論」的人沒有意義，因為兩群人本來就不一樣。作者用的方法是：**隨機挑一部分客人寄邀評信**。被邀請的人比較會去寫，所以比較兩組，就能看出「寫評論」這件事本身帶來的影響。

結果和客人的滿意度有關：

- **非常滿意、給滿分的人**：寫完評論，之後的消費沒有變化
- **不滿意的人**：寫完評論，之後的消費下降最多
- **就算是忠實客人**，只要沒給滿分（例如給了 4 星的好評），之後的消費也會下降，連同一家公司的其他品牌都買得比較少

至於「邀評會放大這個效果」，意思是：主動邀請，會讓很多本來不會寫評論的人也去寫，包括那些「還可以」或「有點不滿」的客人。這些人寫完之後消費下降，**邀請的人越多，受影響的人就越多**。

一個可能的解釋是：把意見寫成文字、公開發表，會讓人更堅持這個看法。原本只是隱約覺得「有點不滿」，寫下來之後，這段經驗就變得更具體、更難忘記。

有趣的是，前面提到的 Dholakia & Morwitz 研究發現，**私下**填滿意度問卷的客人，之後反而買得更多。差別可能就在「公開」和「私下」。

這提醒我們：邀評不是零成本的動作。它的價值在「讓更多新客看到真實評價」，而不是「維繫老客」。

---

## 自己的資料：評論和回購的關係

外部研究之外，我也用公司的資料看了「留評論」和「回購」的關係。

具體數字不能分享，但分析過程踩到的三個陷阱，我覺得比數字更有價值。

### 陷阱一：相關不等於因果

第一版的結果很漂亮：有留評論的客人，之後半年的回購率明顯比沒留的高。

很容易就寫出「鼓勵客人寫評論可以提高回購」這種結論。

但反過來想：**體驗好、對品牌有好感的人，本來就比較會寫評論，也本來就比較會再買**。評論可能只是好感的「結果」，不是回購的「原因」。

>> 這種資料只能說「會留評論的人，比較會回來」，不能說「叫他留評論，他就會回來」。

要回答後者，需要隨機實驗：一組邀請、一組不邀請，再比較兩組的回購率。這也是我在提案裡建議的做法：邀評上線時，保留一組隨機的對照組。

### 陷阱二：新客和老客混在一起看

第二個發現更反直覺。

全體一起看的時候，給 1 星的客人回購率並沒有特別低，甚至跟給 5 星的差不多。

拆開新客和老客之後才看懂：

- **給 1 星的人，多半是老客**。他們買得多，遇到壞體驗的機會也多。
- **老客本來就會一直回來**，不管給幾星，回購率都差不多。
- 真正會因為一次壞體驗流失的，是**新客**。新客給 1 星，回購率明顯比給 5 星的低。

全體混在一起看時，大量會回購的老客把新客之間的差距蓋掉了。這是典型的[辛普森悖論](https://zh.wikipedia.org/zh-tw/%E8%BE%9B%E6%99%AE%E6%A3%AE%E6%82%96%E8%AB%96)。

>> 分析留存相關的問題，第一件事是先把新客、老客拆開。

拆開之後，「哪些客人值得挽救」就很清楚了：給低分的新客。至於給低分的老客，回覆、關心就好，不一定需要送優惠券。

### 陷阱三：每一組的人數差太多

給 1 星的人很少，給 5 星和沒留評論的人非常多。

如果全部都撈出來算，不但查詢跑不動，少數族群的結果也很容易被雜訊淹沒。

最後的做法是**分層抽樣**：低分評論全取，高分評論和沒留評論的人只抽一部分。比較的時候，再把各組的新客、老客比例調整成一樣。

另外，回購要有觀察期。我選的是評論後 6 個月，所以只能用半年以前的評論來分析，最新的資料反而用不上。這點在跟 PM 解釋「為什麼資料不是最近的」時，花了一點時間說明。

---

## 挽救負評：找對人、用對方法

把外部研究和內部資料放在一起，挽救負評客人的方向是：

- **對象**：給低分的新客，特別是出國時最基本的服務出問題的人（例如網路、機場接送）。這類問題對旅遊體驗影響最大，回購率掉得也最多。
- **做法**：道歉加上小額「下次可用」的優惠券，這是 Uber、Via 實驗中效果最好的組合。只道歉的效果很弱，反覆道歉可能更糟。
- **預期**：要保守。就算把低分客人和高分客人的回購差距全部補平，換算下來每個月多回來的人也不多；依外部研究，實際大概只能補回三分之一到一半。
- **驗證**：一定要做 A/B，主要指標用訂單數或營收，而且事先說好只看新客。

另外有兩條合規的界線：

1. 挽救的觸發條件用**站內評論**，不要用 Trustpilot 上的評論。
2. **不能要求客人修改評論**，也不能用優惠換好評。這在 Trustpilot 的規範裡是明確禁止的。

還有一個比較務實的結論：與其一個一個補救，不如先從源頭修。研究過程中發現，站內負評高度集中在少數幾種商品和供應商問題。把那幾個問題解決，比任何補救方案都有效。

---

## 研究完之後，我的結論

1. **先回覆負評**。成本最低，競品也證明有效。
2. **真正的負評來源還是要修**，邀評只能讓分數更接近實際體驗，不能掩蓋問題。
3. **邀評的價值在新客信任**，KPI 不要放回購率。
4. **評論量的預期要保守**。台灣、香港、日本的客人本來就很少用 Trustpilot，就算邀請，回應率也不會太高。
5. **挽救低分客人只對新客有幫助**，效果不大，要用 A/B 驗證。

回頭看，這段研究最有價值的不是哪個數字，而是在寫程式之前，先把「我們以為會發生的事」拆成可以驗證的問題。

有些假設被證實了（評分影響新客轉換），有些被推翻了（競品其實沒在邀評），有些需要上線後用實驗回答（邀評會不會影響回購）。

>> 研究的目的不是證明專案是對的，而是知道哪些地方還不知道。

---

## Reference

- Luca, M. (2016). *Reviews, Reputation, and Revenue: The Case of Yelp.com*. Harvard Business School Working Paper.
- Ye, Q., Law, R., Gu, B., & Chen, W. (2011). The influence of user-generated content on traveler behavior: An empirical investigation on the effects of e-word-of-mouth to hotel online bookings. *Computers in Human Behavior*, 27(2).
- Halperin, B., Ho, B., List, J. A., & Muir, I. (2022). Toward an Understanding of the Economics of Apologies: Evidence from a Large-Scale Natural Field Experiment. *The Economic Journal*.
- Cohen, M. C., Fiszer, M.-D., & Kim, B. J. (2022). Frustration-Based Promotions: Field Experiments in Ride-Sharing. *Management Science*.
- Dholakia, U. M., & Morwitz, V. G. (2002). The Scope and Persistence of Mere-Measurement Effects: Evidence from a Field Study of Customer Satisfaction Measurement. *Journal of Consumer Research*.
- Karaman, H. (2025). [The Asymmetric Effects of Posting an Online Review on Future Spending and the Dark Side of Solicitations](https://doi.org/10.1287/mnsc.2023.01951). *Management Science*, 72(2).
- de Matos, C. A., Henrique, J. L., & Rossi, C. A. V. (2007). Service Recovery Paradox: A Meta-Analysis. *Journal of Service Research*.
- Trustpilot Help Center：[How do reviews get on Trustpilot?](https://help.trustpilot.com/s/article/How-do-reviews-get-on-Trustpilot?language=en_US)
- [Trustpilot – Wikipedia](https://en.wikipedia.org/wiki/Trustpilot)
- [Trustpilot Group plc 2025 Annual Report](https://www.sustainabilityreports.com/trustpilot/2025/annual-report)
- Grizzly Research：[The "Trustpilot Mafia" – How the Extortion Model Destroys Trustpilot's Value Proposition](https://grizzlyreports.com/trustpilot/)
- [Trustpilot tanks as Grizzly Research uncovers "mafia style extortion tactics"](https://www.hl.co.uk/shares/stock-market-news/company--news/archive/trustpilot-tanks-as-grizzly-research-uncovers-mafia-style-extortion-tactics)（Hargreaves Lansdown）
- [Trustpilot categorically rejects Grizzly Research accusations](https://www.hl.co.uk/shares/stock-market-news/company--news/trustpilot-categorically-rejects-grizzly-research-accusations)（Hargreaves Lansdown）
- Hacker News：[How Trustpilot Extorts Businesses](https://news.ycombinator.com/item?id=31723751)、[Why is trustpilot awful?](https://news.ycombinator.com/item?id=26077295)

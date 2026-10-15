---
title: "評分拉高真的會帶來訂單嗎？線上評論、轉換率與回購的研究筆記"
subtitle: "邀評到底有沒有用，以及分析時踩到的 2 個陷阱"
description: "評分拉高真的會帶來訂單嗎？Yelp 研究顯示每多 1 顆星營收增加 5–9%，但公開寫評論可能讓不滿意的客人之後買得更少。整理評分、邀評與回購的研究證據，以及分析資料時遇到的辛普森悖論。"
datetime: "2026-10-15"
readTime: "11 min"
category: "professional"
tags: ["評論", "轉換率", "Trustpilot", "資料分析", "因果推論"]
ogImage: "/blog-images/review-score-and-conversion-hero.webp"
---

<Figure src="/blog-images/review-score-and-conversion-hero.webp" alt="線條插畫，白底配橘色點綴。機場大廳裡，一位背著背包的旅客坐在黑色行李箱上，一手拿手機、一手拿放大鏡，皺著眉盯著畫面上一排星星評分，最後一顆星只填了一半；腳邊有橘色登機箱、一杯咖啡和一張攤開的地圖" width={2752} height={1536} hero />

最近接到一個題目：公司在 Trustpilot 上的分數不到 2 分。

Trustpilot 在台灣幾乎沒有人知道，但對歐美、東南亞的旅客來說，它是挑選旅遊平台時很重要的參考。第一次聽到一個訂票網站，很多人的直覺就是先去 Trustpilot 搜尋，看看評價如何。

>> 對想拓展國外客群的平台來說，Trustpilot 的分數就是陌生客人對你的第一印象。

PM 的想法很直接：「邀請客人去 Trustpilot 寫評論，把分數拉上來。」

我接到這個題目後就有點好奇：

1. 分數比較高，真的會帶來訂單嗎？
2. 邀請客人寫評論，會不會影響他們之後回來消費？

因為牽涉到一些公司內部的實際數字，所以這篇文章只會寫方向、方法，還有我覺得值得分享的部分。

先講結論：評分影響新客轉換有準實驗證據（Yelp 每多 1 顆星，營收增加 5–9%），但對舊客回購，我沒找到可信的研究。公開寫評論甚至可能讓不滿意的客人之後買得更少，所以邀評適合用來建立新客信任，不是拿來留住舊客。

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

最常見的批評是「付費就能讓評分變好看」。

2025 年 12 月，做空機構 Grizzly Research [發表報告](https://grizzlyreports.com/trustpilot/)，指控 Trustpilot 會主動幫商家建立頁面、吸引負評，再推銷付費方案。付費之後，分數就會從 2 分上升到 4 分以上。報告發表當天，Trustpilot 股價就跌了三成。

Trustpilot 否認了這些指控，表示平台上超過 97% 的商家沒有付費，所有商家都適用同一套規範。做空機構本身有財務動機，這些指控也沒有被證實，但它反映了很多人對這類平台的疑慮。

2026 年 3 月，義大利競爭管理局[認為](https://en.agcm.it/en/media/press-releases/2023/3/PS12962) Trustpilot 誤導消費者對服務的認知、沒有確實驗證評論的真實性，開罰 400 萬歐元，但 Trustpilot 表示會上訴。

在 Hacker News 上，對 Trustpilot 的討論多半偏負面，也有人說「看到一家公司在用 Trustpilot，我反而比較不信任它」。

但同樣有商家分享，常常聽到客人說「看到你們在 Trustpilot 的好評，所以選了你們」。

### 那為什麼還要在乎 Trustpilot 上的評論

雖然 Trustpilot 爭議很多，但每月 6,000 萬人在用是事實。

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

---

## 分數拉上來，真的會帶來訂單嗎

| 研究 | 發現 | 證據強度 |
|---|---|---|
| Luca（Yelp 餐廳） | Yelp 評分多 1 星，營收增加 5–9%，影響主要在新客 | 高，準實驗 |
| Ye et al. 2011（線上訂房） | 評分提高 10%，線上訂房增加 5% 以上 | 中，相關性 |
| Halperin et al.（Uber） | 遇到糟糕行程的乘客，「道歉＋5 美元優惠券」的效果最好，扣掉成本仍划算 | 高，大規模隨機實驗 |
| Cohen et al. 2022（Via） | 補償時，「下次可用的額度」比直接退款、單純道歉都有效 | 高，隨機實驗 |
| Dholakia & Morwitz 2002 | 被做過滿意度調查的客人，之後買得比較多（私下問卷） | 高，隨機實驗 |
| Karaman 2025（Management Science） | 寫**公開**評論之後，客人在該品牌的花費反而下降，不滿意的客人下降最多。邀請越多人寫，受影響的人就越多 | 中高（只讀到摘要） |
| de Matos et al. 2007（整合分析） | 服務補救能提高滿意度，但對回購意願的影響不顯著 | 中 |

我們可以總結這些研究：

>> 評分影響「新客的轉換率」有不錯的證據，影響「舊客留存」，我沒找到可信的研究。

### Yelp 的半顆星證據

要證明「星等會影響營收」其實不容易，分數高的餐廳賺得多，可能只是因為它本來就比較好吃，跟顯示幾顆星無關。

Luca 利用了 Yelp 的一個小細節，Yelp 不顯示精確的平均分數，而是換成最接近的半顆星。3.24 離 3 比較近，所以顯示 3 顆星，3.26 離 3.5 比較近，所以顯示 3.5 顆星。這兩家餐廳只差 0.02 分，品質幾乎一樣，畫面上卻差了半顆星。

所以只要比較剛好落在 3.25 兩邊的餐廳，營收的差距就只能來自「顯示的星等」，而不是餐廳本身的好壞。這種借用現實中剛好存在的切點、模擬隨機實驗的方法，叫做準實驗設計。

結果是 Yelp 上每多 1 顆星，營收增加 5–9%。而且這個效果只出現在獨立經營的小餐廳，連鎖餐廳幾乎不受影響。大家早就知道麥當勞是什麼，不需要看星等。但第一次聽到的店，星等就是少數能參考的資訊。

國外旅客第一次聽到一個旅遊平台時，處境就跟走進一家沒聽過的小餐廳一樣。這也是為什麼我認為評分影響的主要是新客，而不是本來就認識我們的舊客。

### 寫了評論，反而買得更少

Karaman 2025 這篇很有趣，一般會以為，願意寫評論的客人比較投入，之後應該會買更多。這篇研究的發現剛好相反：

>> 寫完公開評論之後，客人在這個品牌的花費反而變少了。

直接比較「有寫評論」和「沒寫評論」的人沒有意義，因為兩群人本來就不一樣。作者用的方法是：**隨機挑一部分客人寄邀評信**。被邀請的人比較會去寫，所以比較兩組，就能看出「寫評論」這件事本身帶來的影響。

我只讀到論文摘要，摘要提到結果和客人的滿意度有關：

- **非常滿意、給滿分的人**：寫完評論，之後的消費沒有變化
- **不滿意的人**：寫完評論，之後的消費下降最多
- **就算是忠實客人**，只要沒給滿分，就算寫的是好評，之後的消費也會下降

至於「邀評會放大這個效果」，意思是主動邀請，會讓很多本來不會寫評論的人也去寫，包括那些「還可以」或「有點不滿」的客人。這些人寫完之後消費下降，**邀請的人越多，受影響的人就越多**。

一個可能的解釋是，把意見寫成文字、公開發表，會讓人更堅持這個看法。原本只是隱約覺得「有點不滿」，寫下來之後，這段經驗就變得更具體、更難忘記。

有趣的是，前面提到的 Dholakia & Morwitz 研究發現，**私下**填滿意度問卷的客人，之後反而買得更多，**差別可能就在「公開」和「私下」**。

這提醒我們，邀評不是零成本的動作。它的價值在「讓更多新客看到真實評價」，而不是「維繫舊客」。

---

## 評論和回購率的關係

外部研究之外，我看了公司的「留評論」和「回購」的關係。

具體數字不能分享，但可以分享分析過程踩到的兩個陷阱。

### 陷阱一：相關不等於因果

一開始的結論是：

> 有留評論的客人，之後半年的回購率明顯比沒留的高。

很容易就得出「鼓勵客人寫評論可以提高回購」這種結論。

但反過來想，**體驗好、對品牌有好感的人，本來就比較會寫評論，也本來就比較會再買**。評論可能只是好感的「結果」，不是回購的「原因」。

>> 這種資料只能說「會留評論的人，比較會回來」，不能說「叫他留評論，他就會回來」。

要驗證後面這句話，需要隨機實驗，一組邀請、一組不邀請，再比較兩組的回購率。

### 陷阱二：新客和舊客混在一起看

全體一起看的時候，給 1 星的客人回購率並沒有特別低，甚至跟給 5 星的差不多。

但如果把新客跟舊客分開來看，有幾個有趣的觀察：

- **給 1 星的人，多半是舊客**。他們買得多，遇到壞體驗的機會也多。另一種比較輕鬆的說法是「愛之深，責之切」，既然都成為舊客了，就會希望平台越做越好。
- **舊客本來就會一直回來**，不管給幾星，回購率都差不多。
- 真正會因為一次壞體驗流失的，是**新客**。新客給 1 星，回購率明顯比給 5 星的低。

全體混在一起看時，大量會回購的舊客把新客之間的差距蓋掉了，這是典型的[辛普森悖論](https://zh.wikipedia.org/zh-tw/%E8%BE%9B%E6%99%AE%E6%A3%AE%E6%82%96%E8%AB%96)。

分析顧客留存相關的問題，第一件事是先把新客、舊客分開來看。

>> 分開之後，就會發現「給低分的新客」是最需要被挽救的客戶。

---

## 挽救負評：找對人、用對方法

把外部研究和內部資料放在一起，挽救負評客人的方向是：

- **對象**：給低分的新客，特別是出國時最基本的服務出問題的人（例如網路、機場接送）。這類問題對旅遊體驗影響最大，回購率掉得也最多。
- **做法**：道歉加上小額「下次可用」的優惠券，這是 Uber、Via 實驗中效果最好的組合。只道歉的效果很弱，反覆道歉可能更糟。
- **預期**：要保守。就算把低分客人和高分客人的回購差距全部補平，換算下來每個月多回來的人也不多。而且 de Matos 的整合分析發現，服務補救能提高滿意度，對回購意願的影響卻不顯著。

還有一個比較務實的結論：與其一個一個補救，不如先從源頭解決。研究過程中發現，站內負評高度集中在少數幾種商品和供應商問題。把那幾個問題解決，比任何補救方案都有效。

---

## 研究完之後，我的結論

綜合外部研究與內部資料，我自己給這個題目的結論是：

1. **先把負評回覆做起來**。不管要不要邀評，快速、有誠意地回覆負評，是兩家競品都有在做的事，成本也最低，馬上就能減少新客的疑慮。
2. **邀評是用來建立新客信任的，不是用來留住舊客的**。舊客本來只是有點不滿，被邀請公開寫下來之後，反而可能買得更少。所以邀評要挑對象，不要每個人都寄。
3. **從源頭解決，比事後補救有效**。站內負評集中在少數幾種商品和供應商問題，把這幾個問題解決，比寄優惠券給 1 星客人有用得多。

這趟研究最有價值的，不是找到某個神奇數字，而是在動手之前，先把「我們以為會發生的事」拆成可驗證的假設。

>> 數據分析的目的不是為了證明最初的專案提案是對的，而是幫團隊在投入資源前，看清哪些地方我們其實還不知道。

---

## Reference

- Luca, M. (2016). *Reviews, Reputation, and Revenue: The Case of Yelp.com*. Harvard Business School Working Paper.
- Ye, Q., Law, R., Gu, B., & Chen, W. (2011). The influence of user-generated content on traveler behavior: An empirical investigation on the effects of e-word-of-mouth to hotel online bookings. *Computers in Human Behavior*, 27(2).
- Halperin, B., Ho, B., List, J. A., & Muir, I. (2022). Toward an Understanding of the Economics of Apologies: Evidence from a Large-Scale Natural Field Experiment. *The Economic Journal*.
- Cohen, M. C., Fiszer, M.-D., & Kim, B. J. (2022). Frustration-Based Promotions: Field Experiments in Ride-Sharing. *Management Science*.
- Dholakia, U. M., & Morwitz, V. G. (2002). The Scope and Persistence of Mere-Measurement Effects: Evidence from a Field Study of Customer Satisfaction Measurement. *Journal of Consumer Research*.
- Karaman, H. (2025). [The Asymmetric Effects of Posting an Online Review on Future Spending and the Dark Side of Solicitations](https://doi.org/10.1287/mnsc.2023.01951). *Management Science*, 72(2).
- de Matos, C. A., Henrique, J. L., & Rossi, C. A. V. (2007). Service Recovery Paradox: A Meta-Analysis. *Journal of Service Research*.
- [Trustpilot – Wikipedia](https://en.wikipedia.org/wiki/Trustpilot)
- [Trustpilot Group plc 2025 Annual Report](https://www.sustainabilityreports.com/trustpilot/2025/annual-report)
- Grizzly Research：[The "Trustpilot Mafia" – How the Extortion Model Destroys Trustpilot's Value Proposition](https://grizzlyreports.com/trustpilot/)
- [Trustpilot tanks as Grizzly Research uncovers "mafia style extortion tactics"](https://www.hl.co.uk/shares/stock-market-news/company--news/archive/trustpilot-tanks-as-grizzly-research-uncovers-mafia-style-extortion-tactics)（Hargreaves Lansdown）
- [Trustpilot categorically rejects Grizzly Research accusations](https://www.hl.co.uk/shares/stock-market-news/company--news/trustpilot-categorically-rejects-grizzly-research-accusations)（Hargreaves Lansdown）
- Italian Competition Authority (AGCM)：[Trustpilot to pay a €4 million fine for unfair commercial practice](https://en.agcm.it/en/media/press-releases/2023/3/PS12962)
- [Italy Fines UK's Trustpilot €4m For Misleading Consumers](https://www.silicon.co.uk/e-regulation/italy-trustpilot-fine-629215)（Silicon UK）
- Hacker News：[How Trustpilot Extorts Businesses](https://news.ycombinator.com/item?id=31723751)、[Why is trustpilot awful?](https://news.ycombinator.com/item?id=26077295)

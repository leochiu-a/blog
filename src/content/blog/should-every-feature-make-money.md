---
title: "每個新功能都要賺錢嗎？一個工程師對「不賺錢功能」的研究筆記"
subtitle: "從 Costco 熱狗、Amazon Prime 到免費取消，看不直接賺錢的功能怎麼替公司帶來價值"
description: "每個新功能都一定要帶來正的利潤嗎？整理 Costco 熱狗、Amazon Prime、Dropbox 推薦計畫與免費取消政策的案例，以及品牌長期效果的研究，看不直接賺錢的功能怎麼替公司帶來價值，也看「策略性功能」什麼時候只是藉口。"
datetime: "2026-10-21"
readTime: "16 min"
category: "professional"
tags: ["產品策略", "品牌", "留存", "A/B 測試", "工程師與 PM"]
ogImage: "/blog-images/should-every-feature-make-money-hero.webp"
draft: true
---

<Figure src="/blog-images/should-every-feature-make-money-hero.webp" alt="線條插畫，白底配橘色點綴。左邊一個橘色遮雨棚的小攤子，老闆把東西遞給一位客人；許多人沿著一條彎曲的步道往右走，走進一棟有大門和階梯的大樓" width={2752} height={1536} hero />

PM 提新需求的時候，我腦中常常會冒出一個問題：

>> 這個功能做完，能幫公司多賺多少錢？

有些需求很好回答，例如結帳流程少一步，轉換率就有機會變高。但也有很多需求看不出來跟營收有什麼關係，像是收藏清單、會員等級、更寬鬆的退款規則，有些甚至一上線就是增加成本。

所以我開始好奇：

1. 每個新功能都應該帶來正的利潤嗎？
2. 那些現在不賺錢的功能，是不是在替品牌累積什麼，讓客人之後因為喜歡這個品牌而回來買？

先講結論：大部分成熟的產品團隊，不會要求每個功能**單獨**賺錢，但會要求每個功能說得出「它最後怎麼變成價值」，並且有辦法驗證。不直接賺錢可以接受，說不出為什麼要做才是問題。

---

## 功能不只有「賺錢」一種角色

把產品當成一個系統來看，價值會在不同功能之間流動。一個功能本身不收錢，可能是在幫別的環節收錢。

| 角色 | 在做什麼 | 例子 |
|---|---|---|
| 獲客 | 用比較低的成本帶來新客 | 推薦好友、SEO 內容頁、分享行程連結 |
| 啟用 | 讓新客順利完成第一次好體驗 | 新手引導、訪客結帳 |
| 留存 | 讓客人回來，而且會累積 | 收藏清單、訂單紀錄、會員點數 |
| 信任 | 讓客人在有更便宜選項時還是選你 | 免費取消、評論、客服品質 |
| 基本配備 | 沒有就會流失客人 | Apple Pay、多語系、無障礙 |
| 平台 | 讓之後的功能更便宜、更快做 | Design System、埋點、內部工具 |

評估這些角色時，看的通常是**顧客終身價值**（Customer Lifetime Value, LTV）。一個功能在單筆交易上虧錢，只要讓客人留得更久、買得更頻繁、或帶來更多朋友，整體來看仍然可能是賺的。

---

## 不直接賺錢的案例

### Costco 的 1.5 美元熱狗

Costco 美食區的熱狗加汽水套餐，從 1985 年到現在都賣 1.5 美元。如果跟著通膨調整，現在大概要 4.5 美元。

前 CEO Craig Jelinek 曾經說過，他剛上任時跟創辦人 Jim Sinegal 提議漲價，被 Sinegal 用很不客氣的話擋了下來，要他自己想辦法。2024 年，Costco 財務長在法說會上還特地說了一句：熱狗的價格是安全的。

Costco 知道這個套餐不賺錢，它是典型的「虧本招客商品」（loss leader）。Costco 的主要利潤來自會員費，熱狗讓客人記得 Costco 很便宜，覺得會員費付得值得，隔年繼續續約。

### Amazon Prime：一開始看起來很糟

Amazon Prime 在 2005 年推出，一年 79 美元，無限次免費兩日到貨。

Bezos 後來回憶，剛推出時的數字「很嚇人」。運費很貴，而最先加入的，正是買最多、最會用到免費運送的那群人。

但 Bezos 當時在新聞稿裡講得很清楚，Prime 的目的是讓會員「長期向我們買更多」。根據 CIRP 的調查，2024 年 Prime 會員一年在 Amazon 花大約 1,170 美元，非會員大約 570 美元，差了一倍。

不過 CIRP 自己也說，**目前不清楚是 Prime 讓人買更多，還是本來就買很多的人比較會加入 Prime**。

這跟我之前研究「留評論和回購率」時遇到的陷阱一樣：會員買得多，不代表「讓人加入會員」就會讓他買得多。Prime 成功是事實，但光看「會員 vs 非會員」的消費差距，會高估 Prime 的效果。

### Amazon 讓負評上架

Amazon 在 1995 年開始放顧客評論時，出版商很不滿，因為負評會讓書賣不出去。Bezos 收到一封信，說他根本不懂自己的生意，Amazon 是靠賣東西賺錢的。

Bezos 後來回憶，他讀完那封信的想法是：

>> 我們不是靠賣東西賺錢，是靠幫客人做購買決定賺錢。

負評短期內一定會少賣一些書，但客人知道 Amazon 的評論不只有好話，才會相信它。這個決定換來的是信任，而信任是之後每一筆訂單的基礎。

### Dropbox 的推薦計畫

Dropbox 早期試過 Google 關鍵字廣告，發現獲客成本太高。後來他們參考 PayPal 的做法，做了一個雙向推薦計畫：你邀請朋友加入，你和朋友都能拿到額外的免費空間。

送出去的空間是成本，但 Drew Houston 在 2010 年的分享簡報裡寫到，這個計畫讓註冊數**永久增加了 60%**，2010 年 4 月，單月就有 280 萬次直接邀請。

免費空間本身沒有收入，它的角色是獲客。而且使用者存在 Dropbox 裡的東西越多，就越難離開，之後付費升級的機會也越大。

### Spotify 的免費方案

Spotify 的免費方案有廣告，收入遠比付費方案低，但它在 2018 年上市的 F-1 文件裡寫得很直接：免費方案是一個漏斗，從 2014 年 2 月開始追蹤以來，**超過 60% 的新增付費訂閱者來自免費方案**。

免費方案單獨看可能是賠錢的，算上「後來轉成付費」的人，才看得出它的價值。如果只用免費方案自己的營收去評估，很可能會做出砍掉它的錯誤決定。

### Duolingo 的連續學習天數

Duolingo 的連續天數（streak）不收錢，但它是 Duolingo 留存策略的核心。Duolingo 官方部落格提到，連續學習達到 7 天的使用者，完成課程的機率是其他人的 3.6 倍。

這也是相關性，願意連續學 7 天的人，本來就比較認真。但 Duolingo 也做了實驗，例如在達成連續天數里程碑時加一段動畫，新使用者 7 天後還在用的機率就提高了 1.7%。

1.7% 看起來很小，但留存會累積，每一週多留下一點人，一年後的差距就很大。

### Netflix 的推薦系統

推薦系統不直接收錢，客人不會因為「推薦得很準」多付一塊錢。

但 Netflix 的兩位高層 Carlos Gomez-Uribe 和 Neil Hunt 在 2015 年的論文裡估計，個人化和推薦系統讓 Netflix 的退訂率降低了好幾個百分點，**每年省下超過 10 億美元**。省下來的錢有兩個來源：現有會員留得更久，以及不用花那麼多錢找新會員來補退訂的人。論文也提到，Netflix 大約 80% 的觀看時數，是從推薦來的。

這是 Netflix 自己的估算，外部沒辦法驗證。但要算推薦系統值多少錢，看的是退訂率。

### Netflix 主動取消沒在用的會員

2020 年 5 月，Netflix 宣布會主動聯絡兩種會員：加入一年都沒看過任何內容的人，以及超過兩年沒使用的人。如果他們沒有回覆要繼續，Netflix 就幫他們取消訂閱。

這些會員不到全部的 0.5%，大約幾十萬個帳號。他們每個月都在付錢，卻什麼都沒看。前 Netflix 產品 VP Gibson Biddle 在演講中提到，這個功能估計會讓 Netflix 每年少收大約 1 億美元。

Netflix 還是做了，理由是：

- 這些錢本來就不是靠提供價值賺來的
- 這個決定對品牌有正面影響，而品牌是競爭對手很難複製的優勢
- 如果效果不好，隨時可以改回來，風險很低

>> 這個功能的利潤是負的，而且是刻意的。Netflix 用每年 1 億美元，換客人「Netflix 不會偷偷扣我錢」的信任。

### Apple 不把 iMessage 做到 Android

Apple 的 iMessage 不收錢，但它在 Apple 生態系裡的角色很重要。

Epic 控告 Apple 的訴訟中，公開了幾封 Apple 內部的 email。一位前員工在 2016 年寫到，iMessage 是大家很難離開 Apple 生態系的主要原因之一。Phil Schiller 回覆說，把 iMessage 做到 Android 上「對我們的傷害會大於幫助」。Craig Federighi 也擔心，這樣會讓 iPhone 家庭更容易買 Android 手機給小孩。

這些是 Epic 在訴訟中提出的證據，不是法院的結論。不過從這幾封 email 看得出來，iMessage 本身不賺錢，Apple 在意的是它讓人換手機時多猶豫一下。

「提高轉換成本」這類功能是兩面的。對公司是護城河，對使用者來說可能是一種綁架，做得太明顯，反而會傷害品牌。

### 免費取消：拉轉換，也拉高取消率

旅遊業最常見的例子是**免費取消**。對客人來說，提早訂、不確定行程會不會變，能免費取消就降低了下單的風險。

但它不是沒有代價的。D-Edge 分析了 680 間歐洲飯店 2014–2018 年的資料，發現 2018 年 Booking.com 的訂單取消率是 50%，飯店官網的直接訂單只有 18.2%。D-Edge 認為，取消率上升最主要的原因，就是「免費取消」的行銷讓客人養成了先訂再說的習慣。

所以免費取消是一個雙面刃：

- **好處**：降低下單門檻，提高轉換率
- **成本**：取消率上升，庫存被占住，供應商不一定高興

那長期來看呢？電商的「免費退貨」跟免費取消很像，這方面的研究比較多：

- **Bower & Maxham（2012）**：在兩家大型網路零售商追蹤 49 個月，退貨免運費的客人，之後兩年的消費是退貨前的 158%–457%。要自己付退貨運費的客人，兩年後的消費減少了 75%–100%，幾乎等於流失。
- **Petersen & Kumar（2009）**：分析 26,000 名零售客人的資料，發現在一定範圍內，退貨越多的客人，之後反而買得越多，超過某個門檻之後才開始變成負擔。

退貨不等於取消，旅遊商品的庫存也比衣服更有時效性，但方向是一樣的：讓客人反悔的成本變低，短期看是損失，長期可能是在買客人的信任。

所以「為了吸引客人」的策略不能只看一邊，要同時看它帶來多少轉換和回購、在其他地方增加了多少成本，兩邊一起算。

---

## 品牌的長期效果是真的嗎

我原本的直覺是：「有些功能現在不賺錢，但會讓客人喜歡這個品牌，之後就會回來買。」

這個直覺有研究支持，但沒有想像中那麼簡單。

### 長期和短期要分開看

行銷界很常被引用的研究是 Les Binet 和 Peter Field 的 *The Long and the Short of It*。他們分析了英國 IPA 效益獎累積約 30 年、大約 1,000 個廣告活動的資料，發現：

- **短期的促銷活動**：效果來得快，但很快就消失
- **長期的品牌建立**：效果來得慢，但會累積，長期對營收的影響更大

他們建議的預算比例大約是 60% 做品牌、40% 做短期促銷。不過這個比例是跨產業的平均，Marketing Week 的 Mark Ritson 也提醒過，它比較適合當起點，不是每個公司都該照抄的公式。

這個研究講的是廣告預算，不是產品功能，放到產品功能上也成立：只用短期指標評估所有事情，會系統性地低估那些需要時間才看得到效果的投資。

### 「留存提高 5%，利潤增加 25–95%」要小心

另一個很常被引用的數字，來自 1990 年 Reichheld 和 Sasser 在哈佛商業評論的文章：「顧客流失率降低 5%，利潤可以增加 25% 到 95%」。

但這個數字被引用的版本不太一致，有人寫 25–85%，也有整理只列出銀行、保險經紀、汽車維修幾個個案各自的數字。行銷學者 Byron Sharp 也批評，這篇文章並沒有實證「降低流失率會**導致**利潤大增」，比較像是一個試算。

比較嚴謹的是 Gupta、Lehmann 和 Stuart 在 2004 年的研究。他們用 Capital One、Amazon、eBay、Ameritrade、E*Trade 五家公司的公開財報估算顧客價值，發現：

- **留存率提高 1%**：公司價值大約提高 3%–7%
- **利潤率提高 1%**：公司價值大約只提高 1%

也就是說，留存對公司價值的影響，大約是利潤率的好幾倍。這比 25–95% 保守很多，但更可信，也足夠說明為什麼很多公司願意為了留存做不賺錢的功能。

留存很重要，這點我相信，但 25–95% 這個漂亮的數字最好不要直接拿去說服別人。

---

## 「策略性功能」不是免死金牌

講到這裡，好像只要說「這是為了品牌」「這是為了長期留存」，任何功能都可以做。但 A/B 測試的數據說的是另一回事。

### 大部分的點子都沒有效

Ronny Kohavi 在微軟和 Bing 主導線上實驗多年，他們的結論是：

>> 經過 A/B 測試客觀評估後，不到三分之一的點子能改善它原本想改善的指標。

在微軟的實驗裡，大約三分之一有正面效果，三分之一沒差，三分之一反而是負的。在 Bing 這種已經高度優化的產品，成功率還更低。

Booking.com 是另一個常被拿來當例子的公司。哈佛商學院教授 Stefan Thomke 估計，Booking.com 同時在跑的實驗超過 1,000 個，一年超過 25,000 個。它這麼做的理由是：大部分的想法都會失敗，只有大量測試，才能找到少數真的有效的那幾個。

連有明確指標、能直接測試的點子都有三分之二沒效，「說不清楚怎麼賺錢」的功能，沒效的機率只會更高。

### 大部分的功能很少被使用

Pendo 在 2019 年分析了 615 個軟體產品的使用資料，估計平均有 **80% 的功能很少或從來沒被用過**，大約 12% 的功能就占了 80% 的每日使用量。這是 Pendo 自己客戶的資料，不能代表所有產品，但方向很明確。

### 功能有持續的成本

從工程師的角度，這是最常被忽略的一點。每個功能上線後都會持續帶來成本：

- 程式碼變複雜，改其他功能時要多考慮一種情況
- 要寫測試、要回歸、要修 bug
- 頁面效能變差、打包變大
- 新人要理解的東西變多

一個沒人在用、也沒人說得出價值的功能，會一直拖慢之後的開發。

---

## 工程師可以怎麼參與

在講工程師可以做什麼之前，我也好奇 PM 自己怎麼看這件事。有幾位很常被引用的產品人寫過這個題目。

### Gibson Biddle：讓客人開心，但要能提升利潤

Gibson Biddle 是前 Netflix 產品 VP，他用一個叫 DHM 的模型判斷功能值不值得做：

- **Delight**：讓客人開心
- **Hard to copy**：競爭對手很難複製
- **Margin-enhancing**：能提升利潤

照這個模型，功能不一定要**直接**賺錢，但長期要能讓利潤變好，公司才有錢繼續把產品做得更好。

他舉過一個反例。Netflix 還在寄 DVD 的時候，測試過讓新片隔天就送到。客人很開心，退訂率也降了一點，但如果要讓所有會員都能隔天收到新片，光是多備的庫存就要大約 500 萬美元。退訂率降的那一點，不值這個錢，最後就沒有做。

客人開心還不夠，帳也要算得過來。

### Marty Cagan：至少一半的點子沒有用

《Inspired》的作者 Marty Cagan 把這件事稱為產品的「不方便的真相」：至少一半的點子是沒有用的，好的團隊甚至假設四分之三的點子不會像預期那樣有效。

最常見的原因是，客人根本沒有團隊那麼興奮。就算是有用的點子，通常也要改好幾輪才會真的帶來商業價值。

這跟前面 Kohavi 的實驗數據是同一件事，一個從 PM 的經驗講，一個從 A/B 測試的數字講。

### John Cutler：功能工廠

John Cutler 寫過一篇很有名的文章〈12 Signs You're Working in a Feature Factory〉。「功能工廠」指的是一直生產功能、卻不知道功能有沒有用的團隊。

他列的第一個徵兆是：

>> 團隊不衡量工作帶來的影響。就算有衡量，也只有 PM 自己在看，而且只挑好的結果分享。

照他的說法，「這個功能有沒有用」不該只有 PM 知道，整個團隊都應該看得到結果。

### 我會問 PM 的問題

我自己的結論是：工程師不用要求每個功能都要賺錢，但可以幫團隊確認每個功能有一個**可以被驗證的假設**。

PM 提需求時，我會試著問這幾個問題：

1. 這個功能要解決的是哪個使用者問題，或哪個商業目標？
2. 它的角色是獲客、轉換、留存，還是信任？
3. 如果營收太遠看不到，要看哪個中間指標？例如 30 天回購率、轉換率、取消率。
4. 多久之後檢查？如果到時候指標沒動，要不要拿掉？
5. 能不能先做一個比較小的版本，驗證假設之後再做完整版？
6. 現在的埋點夠不夠，上線後真的量得到嗎？

問這些不是為了挑戰 PM，是把目標和量法先講清楚。講清楚之後，第一版的範圍有機會再縮小，上線也比較快。

---

## 結論

回到一開始的問題：每個新功能都要帶來正的利潤嗎？

不用。前面那些案例，單獨看大多不賺錢，Netflix 主動取消會員甚至是刻意少賺。它們的價值在留存、獲客和信任上。

但「不直接賺錢」和「不知道有沒有用」是兩回事。研究也告訴我們，大部分的點子沒有效、大部分的功能很少被用，而每個功能都有持續的維護成本。

>> 功能可以不賺錢，但不能沒有假設、沒有指標、沒有檢查的時間點。

---

## Reference

- [Costco's $1.50 hot dog price is 'safe,' company's CFO says](https://abc7news.com/post/costcos-150-hot-dog-price-safe/14895838/)（ABC7）
- [Here's Why Costco Keeps Its Food Court Prices So Low](https://www.yahoo.com/lifestyle/articles/heres-why-costco-keeps-food-153000075.html)（Yahoo）
- [Amazon.com Announces Record Free Cash Flow Fueled by Lower Prices and Free Shipping for Customers](https://press.aboutamazon.com/2005/7/amazon-com-announces-record-free-cash-flow-fueled-by-lower-prices-and-free-shipping-for-customers)（Amazon, 2005）
- [Inside Amazon Prime](https://fortune.com/2015/02/03/inside-amazon-prime)（Fortune, 2015）
- [Amazon Prime member shopping power](https://cirpamazon.substack.com/p/amazon-prime-member-shopping-power)（CIRP）
- [How Amazon Innovates: Lessons in Strategy for Microsoft and Others](https://legacy.xconomy.com/2010/02/25/how-amazon-innovates-lessons-in-strategy-for-microsoft-and-others/4)（Xconomy, 2010）
- Houston, D. (2010). [Dropbox: Startup Lessons Learned](https://www.slideshare.net/slideshow/dropbox-startup-lessons-learned-3836587/3836587).
- [Spotify Technology S.A. Form F-1](https://www.sec.gov/Archives/edgar/data/0001639920/000119312518063434/d494294df1.htm)（SEC, 2018）
- [How the Duolingo streak builds habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit)（Duolingo Blog）
- Gomez-Uribe, C. A., & Hunt, N. (2015). The Netflix Recommender System: Algorithms, Business Value, and Innovation. *ACM Transactions on Management Information Systems*, 6(4).
- [Netflix to start cancelling inactive accounts](https://techcrunch.com/2020/05/21/netflix-to-start-cancelling-inactive-accounts/)（TechCrunch, 2020）
- [Apple kept iMessage off Android to lock users in to iOS](https://appleinsider.com/articles/21/04/09/apple-kept-imessage-off-android-to-lock-users-in-to-ios)（AppleInsider, 2021）
- [Study: Cancellation rate at 40% as OTAs push free change policy](https://www.hotelmanagement.net/tech/study-cancelation-rate-at-40-as-otas-push-free-change-policy)（Hotel Management，D-Edge 研究）
- Bower, A. B., & Maxham, J. G. (2012). [Return Shipping Policies of Online Retailers: Normative Assumptions and the Long-Term Consequences of Fee and Free Returns](https://doi.org/10.1509/jm.10.0419). *Journal of Marketing*, 76(5).
- Petersen, J. A., & Kumar, V. (2009). [Are Product Returns a Necessary Evil? Antecedents and Consequences](https://pure.psu.edu/en/publications/are-product-returns-a-necessary-evil-antecedents-and-consequences/). *Journal of Marketing*, 73(3).
- Binet, L., & Field, P. (2013). *The Long and the Short of It: Balancing Short and Long-Term Marketing Strategies*. IPA.
- Ritson, M. [Can you achieve long and short at the same time? Usually, no](https://www.marketingweek.com/can-you-achieve-long-and-short-at-the-same-time-usually-no/)（Marketing Week）
- Reichheld, F. F., & Sasser, W. E. (1990). Zero Defections: Quality Comes to Services. *Harvard Business Review*.
- Sharp, B. [Loyalty Myths](https://www.marketingscience.info/loyalty-myths/)
- Gupta, S., Lehmann, D. R., & Stuart, J. A. (2004). [Valuing Customers](https://business.columbia.edu/sites/default/files-efs/pubfiles/534/Valuing_Customers--JMR_2003.pdf). *Journal of Marketing Research*, 41(1).
- Kohavi, R., et al. (2013). Online Controlled Experiments at Large Scale. *KDD*. 另見 [Large Scale Experimentation at Bing](https://blogs.bing.com/search-quality-insights/2013/08/08/large-scale-experimentation-at-bing)
- Kohavi, R., Tang, D., & Xu, Y. (2020). *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*. Cambridge University Press.
- Thomke, S. [At Booking.com, Innovation Means Constant Failure](https://hbswk.hbs.edu/item/at-booking-com-innovation-means-constant-failure)（HBS Working Knowledge）
- [Gibson Biddle shares customer-centric product strategy lessons from Netflix](https://www.productboard.com/blog/gibson-biddle-shares-customer-centric-product-strategy-lessons-from-netflix/)（Productboard）
- [How to scientifically test for customer obsession, according to Netflix's former VP of Product](https://influitive.com/blog/how-to-scientifically-test-for-customer-obsession-according-to-netflixs-former-vp-of-product/)（Influitive）
- Cagan, M. [The Inconvenient Truth About Product](https://www.svpg.com/the-inconvenient-truth-about-product)（SVPG）
- Cutler, J. [12 Signs You're Working in a Feature Factory – 3 Years Later](https://www.amplitude.com/blog/12-signs-youre-working-in-a-feature-factory-3-years-later)（Amplitude）
- Pendo (2019). [The 2019 Feature Adoption Report](https://www.pendo.io/resources/the-2019-feature-adoption-report/)

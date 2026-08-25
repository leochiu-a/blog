---
title: "AI 工程 | 你的 AI Agent 正在用過期的 Harness 嗎？"
subtitle: "當模型推理能力大幅提升，你過去寫的防禦性 Harness 可能只是在浪費 Token"
description: "當模型的推理能力大幅進步，你三個月前寫的防禦性 Harness 可能已經在浪費 Token。這篇談如何從 Harness Engineering 走向 Loop Engineering。"
datetime: "2026-08-25"
readTime: "9 min"
font: "newsreader"
category: "professional"
featured: true
---

<Figure
  src="/blog-images/harness-hero.png"
  alt="Harness Engineering 與 Loop Engineering"
  width={1024}
  height={559}
/>

## 為什麼要有 harness engineering？

### 從 Harness 到 Loop Engineering

Google Chrome 工程主管 Addy Osmani 在社群上將 Loop Engineering 的想法寫成文章，點燃了整個討論。他歸納出現在主流 AI 工程的四大演進層次：

1. **Prompt Engineering**：琢磨怎麼下關鍵字。
2. **Context Engineering**：補充正確的知識與檔案資料。
3. **Harness Engineering**：加上約束機制與防禦邊界。
4. **Loop Engineering**：打造反覆驗證與自動修正的閉環系統

從 Harness 邁向 Loop，代表我們不再靠預先寫死繁複的規範來阻止 AI 犯錯，而是給它驗證工具（如自動執行測試、Playwright 畫面截圖判斷），讓它在迴圈中自我修正。

### 在 Harness 爆火之前

還記得在 2025 年底到 2026 年初的這段時期，在 skills 這個概念橫空出世之後，大家使用 agent 的效率大幅度的提升，開始把日常開發的步驟蒸餾成 skill。

但在那時模型還不夠強，所以儘管已經將知識抽離成 skill，在使用 agent 開發時還是不時會遇到飄掉的情況。

所以後來 superpower、GSD（Get Shit Done）、Gstack 等等的框架點燃了整個社群，大家發現「把 spec 定好，agent 開發就比較不會飄掉」，這個概念就是 SDD（Spec-Driven Development）。

這些框架的重點都放在跟開發者溝通的階段，讓 agent 不斷得與開發者互動，問各式各樣的問題，為的就是「補足 context」，所以也可以說 SDD 是 context engineering 的一種實現方式。

>> 但是 skills 這個系統並不穩定，他的「內容」屬於 prompt/context，就算強制塞進 agent 的 context，但是執行率在當時可能就 7 成左右。

### Harness Engineering 的誕生

**Mitchell Hashimoto**（HashiCorp 創辦人，也是 Terraform、Vagrant、Ghostty 的作者）在 **2026 年 2 月**寫的部落格文章 [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey) 裡提出的。他在文章裡把「harness engineering」這個詞跟這個公式一起丟出來：

>> Agent = Model + Harness

Harness 這個詞的邊界很大，包括 `CLAUDE.md`、skills、sub-agent、hook、test、CI、測試等等的都可以算在裡面。

> Harness（原意為馬具或安全帶）在 AI 工程中代表一套約束與控制機制。

在 Context Engineering 之後，大家發現 agent 有了 context 還是不夠，所以我們需要設定一套「限制」，統稱叫做 harness。

模型（Model）負責推理、生成、決定下一步；**harness 負責模型自己給不了的那些東西**：它能碰到什麼工具、有沒有權限做某件事、犯錯了誰會發現、發現了之後會不會被擋下來。

具體展開會是三個問題：

1. **執行前（Input/Context constraint）**：`CLAUDE.md` 的 convention、skills、bootstrap 腳本、怎麼把環境架好。
2. **執行後（Output verification）**：linter、type check、測試、review agent。
3. **防護等級（Deterministic vs Soft rules）**：是硬性阻擋的 CI/Hook，還是模型可選擇性忽略的文字（如 `CLAUDE.md`）。

### Harness 是假設模型做不到什麼

Anthropic 的[一篇文章](https://www.anthropic.com/engineering/harness-design-long-running-apps)中有提到，harness 裡的每一個部分都是在描述「模型自己做不到什麼」的假設。

> “Every component in a harness encodes an assumption about what the model can’t do on its own, and those assumptions are worth stress testing, both because they may be incorrect, and because they can quickly go stale as models improve.”

Opus 4.6 出來之後，他們把整個 **sprint contract** 的結構砍掉了，因為模型已經能自己撐完兩個多小時的開發。sprint contract 在更弱的模型上是必要的，在更強的模型上就只是開銷。

---

## 當 Harness 成為負擔：Token 爆炸與過期假設

2026/03 前後，我們團隊常常有人說他又撞到 Claude Code 5 小時的使用上限。

那陣子大家都在弄 harness，加 sub-agent、加 hook、`CLAUDE.md` 一直長，再加上各種 skills，因為當時的模型還不夠強，所以我們必須要加上各種 harness，讓 agent 更加穩定。

而當時最火紅的那些 SDD 框架架最明顯的副作用就是「token 消耗量變得很大」，為了讓 agent 有足夠的 context，以及告訴 agent 要怎麼做才不會飄掉，所以每次的 session 都會花費很多 token 在理解全貌。

### Handover 文件

還記得你用 Superpowers、GSD、SpecKit 等等工具，在前期 plan 階段都會產生一大票的 `PLAN.md` 文件，裡面充滿了各種 context，用來限制 agent 不會做錯。

GSD 框架還為了避免 context 爆炸，所以都用 sub-agent 來執行，最後產生 `CONTEXT.md` 的文件。

甚至為了讓 UI 符合需求，設計不會偏離自己的想像，所以在每一輪都讓 agent 產生 `UI.md` 或是 `DESIGN.md` 等等的文件。

這些文件都是以文字形式存在 harness。

### 人類參與實作的驗證

而這些框架的最後一定都會有驗證的流程。SpecKit 可能更講究跟規格文件、跟程式碼一致；Superpowers 就是強調 TDD 的紀律，最後交給人類來做最後一階段驗證。

但是這些框架前面產生了許多文件，人其實也很難 review 這些文件到底對不對。Superpowers、SpecKit、GSD 這些框架都有一樣的問題。

---

## Loop Engineering

Boris Cherny（Anthropic Claude Code 團隊負責人）主張：

>> I don’t prompt Claude anymore. I have loops running that prompt Claude and figuring out what to do. My job is to write loops.

也就是把「叫模型做一次事」升級成「設計一個系統，讓它自己反覆觀察、行動、驗證、恢復，不需要人一輪一輪盯著打字」。

Loop Engineering **一句話來說，就是**：「別只叫 AI 寫 Code，而是給它一套『寫壞了能自己跑測試、看報錯、改到對為止』的自動化修復循環。」

### Loop Engineering vs. Harness Engineering

聽起來 loop 跟 harness 好像有點像，可以這樣理解：

- **Harness**：靜態/事前的規範與約束。
- **Loop**：動態/事後的自動化驗證與修正迴圈。

Loop 也可以說是從原本的 Harness 細分出來的機制，原本 Harness 包含了靜態規範跟動態驗證，但後續為了更強調 agent 能夠自主完整任務，讓 Loop 的概念凸顯出來。

### Loop Engineering vs. SpecKit / Superpowers

它們本質上都是在解決「讓 AI 能夠自動把事情做對」這件事：

- **Loop Engineering** 是引擎的「循環機制」。
- **SpecKit / Superpowers** 是安裝了這個引擎的「跑車款式」，各有各的駕駛規則與外殼結構。

### Claude Code 已經內建有 loop 的機制

這個 Loop 講的不是指令 `/loop`，而是你在下一段 prompt，然後讓 agent 開發的時候，它最後很常會帶有自動化驗證的功能。如果你開發前端，你會發現它通常都會使用 playwright 去驗證你的畫面。

這些驗證就可以讓一段 prompt 的精準度變得更高，而不會做完後發現 Agent 好像做錯了，然後還要下另外一段 prompt 請他去修。

---

## 你的 agent 可能在用過期的 harness

### 模型越來越強，導致假設過期

Harness 的本質，是建立在「假設模型做不到某些事」的前提上，隨著模型能力提升，這些假設也必須隨之調整。

以過去熱門的 Superpowers 或 SpecKit 為例，我們會在 Plan 階段產出大量文件來防止 Agent「飄掉」。但如今模型具備更強的理解力，即使只給予極少量的 Context，也能達到相同的控制效果。

### 內建 Loop 機制，讓許多防禦性 Harness 變成多此一舉

過去我們擔心模型會遺漏細節或忘記 Context，因此需要設計各種 Harness 機制，強制 Agent 在長任務（Long-running task）中維持記憶。

但當 Agent 內建了 Loop 機制後，情況就改變了。只要 Agent 能自行推論出驗證標準（Acceptance Criteria），就能在試作過程中透過「自動化驗證與自我修正」來高效率地完成任務。

既然模型能透過迴圈自我除錯，許多原本用來死守邊界的 Harness 自然就顯得有些多餘。

### harness 過期的案例：先把 codebase 摘要

「prompt 再好，模型也不知道你的 codebase 長什麼樣」。

這句話之前可能是對的，但是現在 agent 有 grep，它會自己去看。所以「先把 codebase 摘要好餵給它」，很多時候已經是一段過期的 harness。

### harness 過期的案例：超詳細的 Step-by-Step 步驟引導

早期為了防止 Agent 在長任務中「幻覺」或偏離軌道，會強制要求 Agent 一步步拆解 Task（產生大量 `.md` 文件如 `PLAN.md` 或 `TASK.md`），Claude 內部稱作 Sprint Contract。

隨著模型推理能力（如 Opus 4.6）大幅提升，模型已能單獨撐過數小時的連續開發與自我規劃。這套過於繁複的 Sprint Contract 結構反而成了多餘的 Token 消耗與架構開銷，因此 Anthropic 在後來的版本中直接將其移除。

### harness 過期的案例：繁複的 Context 壓縮與記憶維護 session

以前 Context Window 較小或記憶能力差，開發者會透過框架（如 Superpowers、GSD）建立各種 `CONTEXT.md`、`HANDOVER.md`，並用腳本在每次對話前自動將前文摘要疊加進去。

當模型擁有百萬級 Context 且具備強大的長文本檢索能力時，這種人工/系統預先彙整過度的記憶機制就變成了多餘的 Token 負擔。

>> **過期 Harness 的共通點**：我們試圖用文字替模型做太多它已經能自己完成的事。

>> 這也是為什麼近期像 Matt Pocock 提出的 Skills（例如 `/grill-me`、`/implement`）會大受歡迎——它們不再試圖包辦模型的規劃步驟，而是變得極度輕量化，只提供最核心的意圖指引與互動，把推理空間還給模型。

---

## 如何優雅地淘汰 Harness？

隨著模型推理能力提升與內建 Loop 機制的普及，如今「乾淨」的 Agent 表現已遠超半年前。許多過去用來防止 Agent 飄掉的「常識」與過度引導（例如 codebase 摘要、詳細的 step-by-step 指引），現在都可以大膽移除。

相對地，最值得留在 Harness 中的是**「團隊專屬的冷門規則」**。例如「Changeset 必須附上特定格式的 Jira 單號」這類高度情境化、非通用的團隊規範，模型無法憑常識推論，才真正需要透過 Harness 來約束。

---

## 小結

這篇文章探討了 AI 工程從「靜態約束（Harness）」轉向「動態驗證（Loop）」的必然趨勢。

過去為了防止 Agent 偏離軌道，開發者習慣加入大量的預先摘要、繁複的步驟引導（如 `.md` 規範文件）與維護 agent 的記憶。然而，隨著模型推理能力大幅提升與 Loop 的普及，這些防禦性規範不僅過期，還會造成龐大的 Token 開銷與架構負擔。

因此，AI 工程的重心應改為建立自動測試與修復閉環，大膽淘汰常識性的靜態約束，並將 Harness 簡化、僅聚焦於「團隊專屬且無法憑常識推論的冷門規則」，把規劃與推理空間還給 AI。

---

## Reference

- [Loop Engineering](https://addyo.substack.com/p/loop-engineering)
- [Practical Loop Engineering](https://addyo.substack.com/p/practical-loop-engineering)
- [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey)
- [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Pawel Huryn on X](https://x.com/PawelHuryn/status/2069363303952818474)
- [mattpocock/skills](https://github.com/mattpocock/skills)
- [My /grill-me skill has gone viral](https://www.aihero.dev/my-grill-me-skill-has-gone-viral)

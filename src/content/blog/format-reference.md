---
title: "格式參考"
subtitle: "這篇是 draft，只在 next dev 看得到——用來對照每個格式該怎麼寫"
datetime: "2026-08-25"
readTime: "2 min"
font: "newsreader"
category: "personal"
draft: true
---

## 這是 H2，對應 Medium 的 Big title

段落文字。**粗體**、`inline code`、[連結](https://leochiu.com)。

### 這是 H3，對應 Medium 的 Small title

- 無序清單
- 第二項

1. 有序清單
2. 第二項

---

## 兩種引言

`>` 是一般引言，左側一條直線：

> Harness 在 AI 工程中代表一套約束與控制機制。

`>>` 是居中大字的 pull quote：

>> Agent = Model + Harness

要標出處時用 `<BookQuote>`：

<BookQuote speaker="Someone" source="Some Book">
一段有出處的引言。
</BookQuote>

---

## 圖片

`![]()` 沒有放 caption 的位置，所以要 caption 的圖用 `<Figure>`：

<Figure src="/blog-images/interpretability-0.webp" alt="範例圖片" width={1590} height={884} caption="這是圖說" />

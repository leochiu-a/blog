---
title: 第一期要寫什麼
subtitle: 這是一份草稿範本，draft 是 true，所以它不會被寄出，也不會出現在 archive。
description: 電子報的草稿範本。
datetime: 2026-08-31T00:00:00+08:00
draft: true
---

一期電子報是**獨立寫的**，不是文章的摘要。所以這裡可以寫只想跟訂閱者說的話 —— 為什麼那篇文章值得讀、當時卡在哪、哪個結論後來被自己推翻了。

## 這一期

- 連到文章用相對路徑就好，寄出去的時候會自動補成絕對網址：[某篇文章](/blog/chrome-built-in-ai-and-webmcp/)
- 支援標題、清單、粗體、引言、連結
- 不放圖片和程式碼區塊 —— 信裡放不好看，而且會撞到 Gmail 的截斷上限

> 想寄出這一期，先把 `draft` 拿掉，然後跑 `pnpm newsletter:send hello-newsletter --dry-run` 看預覽。

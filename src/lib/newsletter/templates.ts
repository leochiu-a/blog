import { escapeHtml, renderIssueEmail } from "./email.ts";

/**
 * The shell every outgoing email shares, and the two emails this app sends.
 *
 * All styling is inline for the same reason `email.ts` hand-rolls its renderer:
 * clients cannot be trusted with a stylesheet. Every email also ships a
 * plain-text body alongside the HTML one — it costs nothing and it is one of
 * the few free improvements to whether the message lands in an inbox.
 */

interface ShellOptions {
  /** Shown in the inbox preview line, and nowhere in the visible body. */
  preheader: string;
  contentHtml: string;
  footerHtml: string;
}

const BODY_STYLE =
  "margin:0;padding:24px 12px;background:#fafafa;color:#171717;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;";
const CONTAINER_STYLE =
  "max-width:640px;margin:0 auto;padding:32px 28px;background:#ffffff;border-radius:10px;";
const FOOTER_STYLE =
  "margin:32px 0 0;padding-top:20px;border-top:1px solid #e5e5e5;color:#737373;font-size:13px;line-height:1.7;";
const FOOTER_LINK_STYLE = "color:#737373;text-decoration:underline;";

function shell({ preheader, contentHtml, footerHtml }: ShellOptions): string {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="${BODY_STYLE}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<div style="${CONTAINER_STYLE}">
${contentHtml}
<div style="${FOOTER_STYLE}">${footerHtml}</div>
</div>
</body>
</html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * The one email an unconfirmed address ever receives.
 *
 * Kept short and link-light on purpose: it is the most fragile message in the
 * whole system — it goes to an address nobody has vouched for yet, and if it
 * lands in spam the subscription never happens.
 */
export function confirmationEmail({ confirmUrl }: { confirmUrl: string }): RenderedEmail {
  const contentHtml = `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.35;">確認訂閱</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.75;">你在 leochiu.com 要求訂閱電子報。點下面的連結完成訂閱，之後每一期都會寄到這個信箱。</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.75;"><a href="${confirmUrl}" style="color:#0f62fe;">確認訂閱</a></p>
<p style="margin:0;font-size:14px;line-height:1.7;color:#525252;">這個連結 24 小時後失效。如果這不是你要求的，把這封信刪掉就好，不會有任何事發生。</p>`;

  const text = `確認訂閱

你在 leochiu.com 要求訂閱電子報。打開下面的連結完成訂閱：

${confirmUrl}

這個連結 24 小時後失效。如果這不是你要求的，把這封信刪掉就好，不會有任何事發生。`;

  return {
    subject: "確認訂閱 Leo Chiu 的電子報",
    html: shell({
      preheader: "點一下連結完成訂閱。",
      contentHtml,
      footerHtml: `這封信寄給你，是因為有人用這個地址在 <a href="https://leochiu.com/newsletter/" style="${FOOTER_LINK_STYLE}">leochiu.com</a> 送出訂閱。`,
    }),
    text,
  };
}

export interface IssueEmailOptions {
  title: string;
  subtitle?: string;
  subject?: string;
  markdown: string;
  siteUrl: string;
  /** Where this Issue lives on the web, for the "read in a browser" escape hatch. */
  issueUrl: string;
  unsubscribeUrl: string;
}

export function issueEmail({
  title,
  subtitle,
  subject,
  markdown,
  siteUrl,
  issueUrl,
  unsubscribeUrl,
}: IssueEmailOptions): RenderedEmail {
  const body = renderIssueEmail({ markdown, siteUrl });

  const contentHtml = `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;line-height:1.3;">${escapeHtml(title)}</h1>
${subtitle ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#525252;">${escapeHtml(subtitle)}</p>` : ""}
${body.html}`;

  const footerHtml = `你收到這封信，是因為你訂閱了 Leo Chiu 的電子報。<br />
<a href="${issueUrl}" style="${FOOTER_LINK_STYLE}">在瀏覽器閱讀這一期</a> · <a href="${unsubscribeUrl}" style="${FOOTER_LINK_STYLE}">退訂</a>`;

  const text = `${title}
${subtitle ? `${subtitle}\n` : ""}
${body.text}

---
你收到這封信，是因為你訂閱了 Leo Chiu 的電子報。
在瀏覽器閱讀這一期：${issueUrl}
退訂：${unsubscribeUrl}`;

  return {
    subject: subject ?? title,
    html: shell({ preheader: subtitle ?? title, contentHtml, footerHtml }),
    text,
  };
}

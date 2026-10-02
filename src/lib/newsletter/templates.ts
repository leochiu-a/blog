import { EMAIL_COLORS, escapeHtml, renderIssueEmail, renderPostExcerpt } from "./email.ts";

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

const { INK, BODY, MUTED, ACCENT, RULE } = EMAIL_COLORS;

/**
 * A warm off-white behind the sheet, so the white container reads as paper
 * laid on a surface rather than as the whole window. The hairline is what
 * holds that edge in clients (Outlook among them) that ignore the radius.
 */
const BODY_STYLE = `margin:0;padding:32px 12px;background:#f5f4f2;color:${BODY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;`;
const CONTAINER_STYLE = `max-width:640px;margin:0 auto;padding:40px 28px;background:#ffffff;border:1px solid ${RULE};border-radius:12px;`;
/** The masthead sits above a rule, the way the Issue page on the web does. */
const MASTHEAD_STYLE = `margin:0 0 32px;padding-bottom:24px;border-bottom:1px solid ${RULE};`;
const TITLE_STYLE = `margin:0;font-size:26px;font-weight:800;line-height:1.3;letter-spacing:-0.01em;color:${INK};`;
const SUBTITLE_STYLE = `margin:10px 0 0;font-size:16px;line-height:1.6;color:${MUTED};`;
const FOOTER_STYLE = `margin:36px 0 0;padding-top:20px;border-top:1px solid ${RULE};color:${MUTED};font-size:13px;line-height:1.7;`;
const FOOTER_LINK_STYLE = `color:${MUTED};text-decoration:underline;`;
/**
 * The "read this online" line, which belongs to the Issue rather than to the
 * footer: it is the last thing the reader is offered about *this* edition, and
 * sitting it next to the unsubscribe link put the way out and the way further
 * in on the same line — one click apart, in the same grey. Right-aligned and
 * above the rule, the way Programming Digest does it, so what is left below the
 * rule is only the housekeeping.
 */
const READ_ONLINE_STYLE = `margin:40px 0 0;text-align:right;font-size:14px;line-height:1.7;color:${MUTED};`;
const READ_ONLINE_LINK_STYLE = `color:${ACCENT};text-decoration:none;`;
const CONTINUE_STYLE = "margin:36px 0 0;";
/**
 * A button, because it is the one thing the email asks of the reader. The
 * background rides on the `<a>` itself with padding, rather than on a wrapper:
 * Outlook ignores padding on block wrappers but honours it on an inline-block
 * link, and the accent colour is the same one the site's links wear.
 */
const CONTINUE_LINK_STYLE = `display:inline-block;padding:12px 28px;background:${ACCENT};border-radius:8px;color:#ffffff;font-size:16px;font-weight:700;line-height:1.4;text-decoration:none;`;
/** Set apart from the line above it: leaving is a decision of its own. */
const UNSUBSCRIBE_STYLE = "margin:20px 0 0;";

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
  const contentHtml = `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.35;color:${INK};">確認訂閱</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.75;">你在 leochiu.com 要求訂閱電子報。點下面的連結完成訂閱，之後每一期都會寄到這個信箱。</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.75;"><a href="${confirmUrl}" style="color:${ACCENT};font-weight:700;text-decoration:none;">確認訂閱</a></p>
<p style="margin:0;font-size:14px;line-height:1.7;color:${MUTED};">這個連結 24 小時後失效。如果這不是你要求的，把這封信刪掉就好，不會有任何事發生。</p>`;

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

/** What every email to the list closes with: why it arrived, and the way out. */
function subscriberFooterHtml(unsubscribeUrl: string): string {
  return `你收到這封信，是因為你訂閱了 Leo Chiu 的電子報。
<p style="${UNSUBSCRIBE_STYLE}">不想再收到的話，<a href="${unsubscribeUrl}" style="${FOOTER_LINK_STYLE}">點這裡退訂</a>。</p>`;
}

function subscriberFooterText(unsubscribeUrl: string): string {
  return `你收到這封信，是因為你訂閱了 Leo Chiu 的電子報。

不想再收到的話，從這裡退訂：${unsubscribeUrl}`;
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

  const contentHtml = `<div style="${MASTHEAD_STYLE}">
<h1 style="${TITLE_STYLE}">${escapeHtml(title)}</h1>
${subtitle ? `<p style="${SUBTITLE_STYLE}">${escapeHtml(subtitle)}</p>` : ""}
</div>
${body.html}
<p style="${READ_ONLINE_STYLE}"><a href="${issueUrl}" style="${READ_ONLINE_LINK_STYLE}">在瀏覽器閱讀這一期</a>。</p>`;

  const footerHtml = subscriberFooterHtml(unsubscribeUrl);

  const text = `${title}
${subtitle ? `${subtitle}\n` : ""}
${body.text}

在瀏覽器閱讀這一期：${issueUrl}

---
${subscriberFooterText(unsubscribeUrl)}`;

  return {
    subject: subject ?? title,
    html: shell({ preheader: subtitle ?? title, contentHtml, footerHtml }),
    text,
  };
}

export interface PostEmailOptions {
  title: string;
  subtitle?: string;
  markdown: string;
  siteUrl: string;
  /** Where the whole Post lives — the email carries only its opening. */
  postUrl: string;
  unsubscribeUrl: string;
}

/**
 * A Post as an email: its title, its opening, and a way to the rest.
 *
 * Not the whole Post. A Post is written for the site — components, demos,
 * highlighted code — and an inbox can show none of that, so the email is the
 * invitation and the site is the article. The link is the point of the message,
 * which is why it is a line of its own in the accent colour rather than a
 * footnote.
 */
export function postEmail({
  title,
  subtitle,
  markdown,
  siteUrl,
  postUrl,
  unsubscribeUrl,
}: PostEmailOptions): RenderedEmail {
  const body = renderPostExcerpt({ markdown, siteUrl });

  const contentHtml = `<div style="${MASTHEAD_STYLE}">
<h1 style="${TITLE_STYLE}">${escapeHtml(title)}</h1>
${subtitle ? `<p style="${SUBTITLE_STYLE}">${escapeHtml(subtitle)}</p>` : ""}
</div>
${body.html}
<p style="${CONTINUE_STYLE}"><a href="${postUrl}" style="${CONTINUE_LINK_STYLE}">閱讀全文 →</a></p>`;

  const text = `${title}
${subtitle ? `${subtitle}\n` : ""}
${body.text}

閱讀全文：${postUrl}

---
${subscriberFooterText(unsubscribeUrl)}`;

  return {
    subject: title,
    html: shell({
      preheader: subtitle ?? title,
      contentHtml,
      footerHtml: subscriberFooterHtml(unsubscribeUrl),
    }),
    text,
  };
}

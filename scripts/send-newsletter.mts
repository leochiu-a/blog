/**
 * Sends one Issue.
 *
 * Run by hand — `pnpm newsletter:send <slug>` — and never by CI. Sending is the
 * only irreversible action in the whole newsletter: an Issue with a mistake in
 * it cannot be recalled, only apologised for, and every apology costs
 * subscribers. A person typing `yes` is the last review step, and it is worth
 * more than any automation it replaces. See
 * docs/adr/0003-issues-are-sent-by-hand.md.
 *
 * `--test <email>` is the exception, and only because it is not a send to the
 * list: it mails the Issue to one address you named, reads nothing, writes
 * nothing, and asks nothing. Use it as often as you like before the one send
 * that counts.
 *
 * The database is reached through `getPlatformProxy()`, which hands a real D1
 * binding to plain Node using the Wrangler login already on this machine. That
 * is what lets this script call the same queries the Worker calls, with the
 * same bind parameters, instead of keeping a second set written as strings for
 * a command line.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { getPlatformProxy } from "wrangler";
import { FROM_ADDRESS, REPLY_TO_ADDRESS } from "../src/lib/newsletter/constants.ts";
import type { IssueFrontmatter } from "../src/lib/newsletter/issue-frontmatter.ts";
import { parseIssueSource } from "../src/lib/newsletter/issue-source.ts";
import {
  createBroadcast,
  createContact,
  listContacts,
  sendBroadcast,
} from "../src/lib/newsletter/resend.ts";
import {
  confirmedEmails,
  issueSentAt,
  markUnsubscribedInBulk,
  recordIssueSend,
} from "../src/lib/newsletter/subscribers.ts";
import { parseEmail } from "../src/lib/newsletter/subscription.ts";
import { sendTestIssue } from "../src/lib/newsletter/test-send.ts";
import { issueEmail } from "../src/lib/newsletter/templates.ts";
import { SITE_URL } from "../src/lib/site.ts";

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function loadIssue(slug: string, { allowDraft }: { allowDraft: boolean }) {
  const path = resolve("src/content/newsletter", `${slug}.md`);
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    return fail(`找不到 ${path}`);
  }

  const issue = parseIssueSource(slug, source);
  if (!issue.ok) return fail(issue.error);
  if (issue.frontmatter.draft && !allowDraft) {
    return fail(`${slug} 還是草稿（draft: true），不會寄出。要先看看長什麼樣子的話用 --test。`);
  }

  return { frontmatter: issue.frontmatter, markdown: issue.markdown };
}

/**
 * Brings the two stores back in line before anything is sent, or reports what
 * that would do.
 *
 * Both directions, because both can drift. Anyone who unsubscribed through
 * Resend is written back to D1, which is the record that has to be right;
 * anyone confirmed in D1 but missing from the segment — a contact creation that
 * failed at confirmation time — is pushed up so they are not skipped forever.
 *
 * With `write: false` it performs neither, and still returns the same three
 * numbers. That is what makes `--dry-run` answerable without touching either
 * store: every figure is derived from one snapshot taken before the writes,
 * and `markUnsubscribedInBulk` only ever touches rows still at `confirmed`, so
 * the count it would return is the intersection computed here.
 */
async function reconcile(
  db: D1Database,
  apiKey: string,
  segmentId: string,
  { write }: { write: boolean },
) {
  const remote = await listContacts(apiKey, segmentId);
  const known = new Set(remote.map((contact) => contact.email.toLowerCase()));

  const goneRemotely = remote
    .filter((contact) => contact.unsubscribed)
    .map((contact) => parseEmail(contact.email))
    .filter((email): email is string => email !== null);
  const gone = new Set(goneRemotely);

  const confirmed = await confirmedEmails(db);
  const staying = confirmed.filter((email) => !gone.has(email));
  const missing = staying.filter((email) => !known.has(email));

  if (write) {
    await markUnsubscribedInBulk(db, goneRemotely, Date.now());
    for (const email of missing) {
      await createContact(apiKey, { email, segmentId });
    }
  }

  return {
    recipients: staying.length,
    pulledUnsubscribes: confirmed.length - staying.length,
    pushedToResend: missing.length,
  };
}

const USAGE = "用法：pnpm newsletter:send <slug> [--test <email>] [--dry-run] [--local]";

function parseArgs(argv: string[]) {
  const [slug, ...rest] = argv;
  if (!slug || slug.startsWith("--")) return fail(USAGE);

  let dryRun = false;
  let local = false;
  let testEmail: string | null = null;

  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i]!;
    if (flag === "--dry-run") {
      dryRun = true;
    } else if (flag === "--local") {
      local = true;
    } else if (flag === "--test" || flag.startsWith("--test=")) {
      const raw = flag.startsWith("--test=") ? flag.slice("--test=".length) : rest[++i];
      const parsed = raw === undefined ? null : parseEmail(raw);
      if (parsed === null) return fail(`--test 後面要接一個收件地址，例如 --test you@example.com`);
      testEmail = parsed;
    } else {
      return fail(`不認識的參數 ${flag}\n\n${USAGE}`);
    }
  }

  // Both are ways of not sending to the list, but they answer different
  // questions — one prints numbers, the other puts the Issue in an inbox — and
  // a run that quietly did only the first would be read as having done both.
  if (testEmail !== null && dryRun) {
    return fail("--test 和 --dry-run 不能一起用：一個是真的寄一封給你，一個是什麼都不寄。");
  }

  return { slug, dryRun, local, testEmail };
}

/**
 * Prints what `sendTestIssue` did. The sending itself lives in
 * `src/lib/newsletter/test-send.ts`, which the editor's Send test button calls
 * too — one code path, so the button and the flag cannot render an Issue
 * differently.
 */
async function sendTest(
  apiKey: string,
  {
    slug,
    frontmatter,
    markdown,
    to,
  }: {
    slug: string;
    frontmatter: IssueFrontmatter;
    markdown: string;
    to: string;
  },
) {
  const { id, subject } = await sendTestIssue(apiKey, { slug, frontmatter, markdown, to });

  console.log(`
測試信寄給 ${to}
主旨      ${subject}
草稿      ${frontmatter.draft ? "是（draft: true，還不會出現在網站上）" : "否"}
Resend id ${id}

沒有碰到訂閱名單，也沒有記成已寄出。
`);
}

async function main() {
  const { slug, dryRun, local, testEmail } = parseArgs(process.argv.slice(2));

  const { frontmatter, markdown } = loadIssue(slug, { allowDraft: testEmail !== null });

  // wrangler.send.jsonc marks the D1 binding `remote`, so this reads the
  // deployed subscriber list rather than the local one. wrangler.jsonc — the
  // config `next dev` uses — deliberately does not, which is what keeps local
  // development off the real list. `--local` overrides back for a rehearsal,
  // and a test send never opens the remote binding at all because it reads no
  // list.
  const platform = await getPlatformProxy<CloudflareEnv>({
    configPath: "wrangler.send.jsonc",
    remoteBindings: !local && testEmail === null,
  });
  try {
    const { NEWSLETTER_DB: db, RESEND_API_KEY: apiKey, RESEND_SEGMENT_ID: segmentId } = platform.env;
    if (!apiKey) return fail("`.dev.vars` 需要 RESEND_API_KEY。");

    if (testEmail !== null) {
      return await sendTest(apiKey, { slug, frontmatter, markdown, to: testEmail });
    }

    if (!segmentId) return fail("`.dev.vars` 需要 RESEND_SEGMENT_ID。");

    const sentAt = await issueSentAt(db, slug);
    if (sentAt !== null) {
      return fail(
        `${slug} 已經在 ${new Date(sentAt).toISOString()} 寄過了。要重寄的話先手動刪掉 issue_sends 那一列。`,
      );
    }

    const issueUrl = `${SITE_URL}/newsletter/${slug}/`;
    const email = issueEmail({
      title: frontmatter.title,
      subtitle: frontmatter.subtitle,
      subject: frontmatter.subject,
      markdown,
      siteUrl: SITE_URL,
      issueUrl,
      // A broadcast is one template for everyone, so it cannot carry a
      // per-recipient token. Resend swaps this placeholder for a working
      // unsubscribe link per contact, and `reconcile` pulls the result back
      // into D1 before the next send.
      unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
    });

    const { recipients, pulledUnsubscribes, pushedToResend } = await reconcile(
      db,
      apiKey,
      segmentId,
      { write: !dryRun },
    );

    const reconciliation = dryRun
      ? `會回寫 Resend 退訂 ${pulledUnsubscribes} 筆、補進 Resend 名單 ${pushedToResend} 筆（預覽，沒有寫入）`
      : `Resend 退訂回寫 ${pulledUnsubscribes} 筆、補進 Resend 名單 ${pushedToResend} 筆`;

    console.log(`
資料庫  ${local ? "本機（--local，不會碰到線上名單）" : "線上"}
主旨    ${email.subject}
網頁    ${issueUrl}
收件人  ${recipients}
對帳    ${reconciliation}

--- 純文字版開頭 ---
${email.text.split("\n").slice(0, 20).join("\n")}
---------------------
`);

    if (dryRun) return console.log("--dry-run：沒有寄出，也沒有寫入任何東西。");
    if (recipients === 0) return fail("沒有已確認的訂閱者，不寄。");

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('確定要寄出嗎？輸入 "yes" 送出：');
    rl.close();
    if (answer.trim() !== "yes") return console.log("取消了，什麼都沒寄。");

    const broadcast = await createBroadcast(apiKey, {
      segmentId,
      from: FROM_ADDRESS,
      replyTo: REPLY_TO_ADDRESS,
      subject: email.subject,
      html: email.html,
      text: email.text,
      name: `${frontmatter.datetime.slice(0, 10)} ${slug}`,
    });
    await sendBroadcast(apiKey, broadcast.id);

    await recordIssueSend(db, {
      issueSlug: slug,
      resendBroadcastId: broadcast.id,
      recipientCount: recipients,
      now: Date.now(),
    });

    console.log(`\n寄出了。Resend broadcast ${broadcast.id}，${recipients} 個收件人。\n`);
  } finally {
    await platform.dispose();
  }
}

await main();

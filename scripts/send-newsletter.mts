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
 * The database is reached through `getPlatformProxy()`, which hands a real D1
 * binding to plain Node using the Wrangler login already on this machine. That
 * is what lets this script call the same queries the Worker calls, with the
 * same bind parameters, instead of keeping a second set written as strings for
 * a command line.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { parse as parseYaml } from "yaml";
import { getPlatformProxy } from "wrangler";
import { FROM_ADDRESS, REPLY_TO_ADDRESS } from "../src/lib/newsletter/constants.ts";
import { issueFrontmatterSchema } from "../src/lib/newsletter/issue-frontmatter.ts";
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
import { issueEmail } from "../src/lib/newsletter/templates.ts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://leochiu.com";
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function loadIssue(slug: string) {
  const path = resolve("src/content/newsletter", `${slug}.md`);
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    return fail(`找不到 ${path}`);
  }

  const match = FRONTMATTER.exec(source);
  if (!match) return fail(`${slug}.md 沒有 frontmatter`);

  const parsed = issueFrontmatterSchema.safeParse(parseYaml(match[1]!));
  if (!parsed.success) return fail(`${slug}.md 的 frontmatter 有問題：${parsed.error.message}`);
  if (parsed.data.draft) return fail(`${slug} 還是草稿（draft: true），不會寄出。`);

  return { frontmatter: parsed.data, markdown: source.slice(match[0].length).trimStart() };
}

/**
 * Brings the two stores back in line before anything is sent.
 *
 * Both directions, because both can drift. Anyone who unsubscribed through
 * Resend is written back to D1, which is the record that has to be right;
 * anyone confirmed in D1 but missing from the segment — a contact creation that
 * failed at confirmation time — is pushed up so they are not skipped forever.
 */
async function reconcile(db: D1Database, apiKey: string, segmentId: string) {
  const remote = await listContacts(apiKey, segmentId);
  const known = new Set(remote.map((contact) => contact.email.toLowerCase()));

  const goneRemotely = remote
    .filter((contact) => contact.unsubscribed)
    .map((contact) => parseEmail(contact.email))
    .filter((email): email is string => email !== null);

  const pulledUnsubscribes = await markUnsubscribedInBulk(db, goneRemotely, Date.now());

  const confirmed = await confirmedEmails(db);
  const missing = confirmed.filter((email) => !known.has(email));
  for (const email of missing) {
    await createContact(apiKey, { email, segmentId });
  }

  return { recipients: confirmed.length, pulledUnsubscribes, pushedToResend: missing.length };
}

async function main() {
  const [slug, ...flags] = process.argv.slice(2);
  if (!slug) return fail("用法：pnpm newsletter:send <slug> [--dry-run] [--local]");
  const dryRun = flags.includes("--dry-run");
  const local = flags.includes("--local");

  const { frontmatter, markdown } = loadIssue(slug);

  // wrangler.send.jsonc marks the D1 binding `remote`, so this reads the
  // deployed subscriber list rather than the local one. wrangler.jsonc — the
  // config `next dev` uses — deliberately does not, which is what keeps local
  // development off the real list. `--local` overrides back for a rehearsal.
  const platform = await getPlatformProxy<CloudflareEnv>({
    configPath: "wrangler.send.jsonc",
    remoteBindings: !local,
  });
  try {
    const { NEWSLETTER_DB: db, RESEND_API_KEY: apiKey, RESEND_SEGMENT_ID: segmentId } = platform.env;
    if (!apiKey || !segmentId) {
      return fail("`.dev.vars` 需要 RESEND_API_KEY 和 RESEND_SEGMENT_ID。");
    }

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
    );

    console.log(`
資料庫  ${local ? "本機（--local，不會碰到線上名單）" : "線上"}
主旨    ${email.subject}
網頁    ${issueUrl}
收件人  ${recipients}
對帳    Resend 退訂回寫 ${pulledUnsubscribes} 筆、補進 Resend 名單 ${pushedToResend} 筆

--- 純文字版開頭 ---
${email.text.split("\n").slice(0, 20).join("\n")}
---------------------
`);

    if (dryRun) return console.log("--dry-run：沒有寄出任何東西。");
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

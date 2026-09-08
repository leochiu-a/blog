import { FROM_ADDRESS, REPLY_TO_ADDRESS } from "./constants.ts";
import type { IssueFrontmatter } from "./issue-frontmatter.ts";
import { sendEmail } from "./resend.ts";
import { issueEmail, type RenderedEmail } from "./templates.ts";
import { SITE_URL } from "../site.ts";

/**
 * Mailing one Issue to a single named address.
 *
 * The rehearsal a broadcast cannot be: the only way to learn what an Issue
 * looks like in Gmail, on a phone, with the images loaded, is to receive it.
 * So this goes out through `emails.send` rather than as a broadcast — no
 * contact is created, the subscriber list is neither read nor written, and
 * `issue_sends` gains no row. Sending it ten times costs ten emails to you and
 * nothing else, which is what makes it safe to reach for while still writing.
 *
 * Drafts are allowed through deliberately: an Issue you have not finished is
 * exactly the one worth looking at in an inbox.
 */

/**
 * Marks the subject so a test can never be mistaken for the real Issue sitting
 * in the same inbox. The real send never carries it.
 */
export const TEST_SUBJECT_PREFIX = "[測試] ";

export function testIssueEmail({
  slug,
  frontmatter,
  markdown,
}: {
  slug: string;
  frontmatter: IssueFrontmatter;
  markdown: string;
}): RenderedEmail {
  const email = issueEmail({
    title: frontmatter.title,
    subtitle: frontmatter.subtitle,
    subject: frontmatter.subject,
    markdown,
    siteUrl: SITE_URL,
    issueUrl: `${SITE_URL}/newsletter/${slug}/`,
    // The bare page, not a signed link: the per-subscriber token belongs to
    // someone on the list, and a test recipient is not on it. The page handles
    // arriving without a token, so the link is a real place either way.
    unsubscribeUrl: `${SITE_URL}/newsletter/unsubscribe/`,
  });

  return { ...email, subject: `${TEST_SUBJECT_PREFIX}${email.subject}` };
}

export async function sendTestIssue(
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
): Promise<{ id: string; subject: string }> {
  const email = testIssueEmail({ slug, frontmatter, markdown });
  const { id } = await sendEmail(apiKey, {
    from: FROM_ADDRESS,
    to,
    replyTo: REPLY_TO_ADDRESS,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  return { id, subject: email.subject };
}

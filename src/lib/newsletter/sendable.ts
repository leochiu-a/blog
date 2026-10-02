import type { IssueFrontmatter } from "./issue-frontmatter.ts";
import type { SendKind } from "./subscribers.ts";
import { issueEmail, postEmail, type RenderedEmail } from "./templates.ts";
import type { PostFrontmatter } from "../post-frontmatter.ts";
import { SITE_URL } from "../site.ts";

/**
 * What a document looks like to a send: the one thing the two kinds of mail
 * differ in. How the email is built and what Resend calls the broadcast are
 * here; who may be mailed, the order things happen in and the record that stops
 * a second send are the same for both, and live in `send.ts`.
 */

export interface Document<Frontmatter> {
  slug: string;
  frontmatter: Frontmatter;
  markdown: string;
}

export type Issue = Document<IssueFrontmatter>;
export type Post = Document<PostFrontmatter>;

/** Where the Issue lives on the web, for the "read in a browser" link. */
export function issueUrl(slug: string): string {
  return `${SITE_URL}/newsletter/${slug}/`;
}

/** Where the Post lives on the web, for the "read the full post" link. */
export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}/`;
}

export interface Sendable {
  kind: SendKind;
  slug: string;
  draft: boolean;
  /** Also Resend's idempotency key: see `sendToList`. */
  name: string;
  /** A broadcast is one template for everyone, so the unsubscribe link comes in. */
  email(unsubscribeUrl: string): RenderedEmail;
}

export function issueSendable(issue: Issue): Sendable {
  return {
    kind: "issue",
    slug: issue.slug,
    draft: issue.frontmatter.draft === true,
    name: `${issue.frontmatter.datetime.slice(0, 10)} ${issue.slug}`,
    email: (unsubscribeUrl) =>
      issueEmail({
        title: issue.frontmatter.title,
        subtitle: issue.frontmatter.subtitle,
        subject: issue.frontmatter.subject,
        markdown: issue.markdown,
        siteUrl: SITE_URL,
        issueUrl: issueUrl(issue.slug),
        unsubscribeUrl,
      }),
  };
}

export function postSendable(post: Post): Sendable {
  return {
    kind: "post",
    slug: post.slug,
    draft: post.frontmatter.draft === true,
    // Prefixed so a Post can never answer for an Issue's broadcast, or the
    // reverse, should a slug ever be shared.
    name: `post ${post.frontmatter.datetime.slice(0, 10)} ${post.slug}`,
    email: (unsubscribeUrl) =>
      postEmail({
        title: post.frontmatter.title,
        subtitle: post.frontmatter.subtitle,
        markdown: post.markdown,
        siteUrl: SITE_URL,
        postUrl: postUrl(post.slug),
        unsubscribeUrl,
      }),
  };
}

import Image from "next/image";
import Link from "next/link";
import { author, socialLinks } from "@/data/content";

/** The links worth showing under a post — the rest stay in the footer. */
const PROFILES = ["GitHub", "LinkedIn", "Medium"];

/**
 * Byline bio at the foot of a post.
 *
 * Answers "who wrote this" on the post itself instead of only in schema, since
 * a reader landing from search never sees the home page where the credentials
 * live.
 */
export function AuthorBio() {
  const profiles = socialLinks.filter((link) => PROFILES.includes(link.label));

  return (
    <section className="flex items-start gap-x-4 border-t border-border pt-6">
      <Image
        src={author.photo}
        alt={`${author.name} 的照片`}
        width={64}
        height={64}
        loading="lazy"
        className="size-16 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="font-sans text-lg font-bold leading-snug">
          {/* The home page is where the fuller bio and the work live — a reader
              who arrived from search has no other route to it. */}
          <Link href="/" className="transition-colors hover:text-blog-accent">
            {author.name}
          </Link>
          <span className="ms-2 font-normal text-muted-foreground">
            {author.jobTitle} @ {author.company}
          </span>
        </p>
        <p className="mt-1.5 font-sans text-base leading-relaxed text-muted-foreground">
          {author.bio}
        </p>
        <nav className="mt-2 flex flex-wrap gap-x-4" aria-label={`${author.name} 的其他連結`}>
          {profiles.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              rel="me noopener"
              target="_blank"
              className="font-sans text-sm text-muted-foreground transition-colors hover:text-blog-accent"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

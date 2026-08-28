import { author, socialLinks } from "@/data/content";
import { SITE_URL } from "@/lib/site";

/**
 * The one schema.org `Person` node for the whole site.
 *
 * Every page that emits it uses the same `@id`, so a search engine merges the
 * home page and each post into a single entity instead of resolving several
 * look-alike people with slightly different job titles. `sameAs` is what links
 * that entity to the profiles carrying its track record.
 */
export const PERSON_ID = `${SITE_URL}/#person`;

export const personJsonLd = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: author.name,
  url: SITE_URL,
  image: `${SITE_URL}${author.photo}`,
  jobTitle: author.jobTitle,
  description: author.bio,
  worksFor: { "@type": "Organization", name: author.company },
  sameAs: socialLinks.map((link) => link.href),
};

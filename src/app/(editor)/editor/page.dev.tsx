import Image from "next/image";
import Link from "next/link";
import { Pin } from "lucide-react";
import { editorPath, type CollectionName } from "@/lib/editor/collections";
import { parseDocument } from "@/lib/editor/document";
import { readFlag, readText } from "@/lib/editor/frontmatter-fields";
import { CATEGORIES } from "@/lib/post-frontmatter";
import { issueStore, postStore } from "@/lib/editor/store";
import { NewDocumentButton } from "@/components/editor/NewDocumentButton";
import { DocumentActions } from "@/components/editor/DocumentActions";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { DevSubscribersLink } from "@/components/newsletter/DevSubscribersLink";

export const dynamic = "force-dynamic";

type DocumentSummary = {
  slug: string;
  title: string;
  subtitle: string;
  datetime: string;
  readTime: string;
  category: string;
  ogImage: string;
  featured: boolean;
  draft: boolean;
};

type Store = typeof postStore;

/**
 * A collection's documents, newest first. Keys an Issue does not have — a read
 * time, a category, an image — come back empty, and the card leaves out what
 * is empty, so one summary shape covers both collections.
 */
async function loadDocuments(store: Store): Promise<DocumentSummary[]> {
  const slugs = await store.listSlugs();
  const documents = await Promise.all(
    slugs.map(async (slug) => {
      const { frontmatter } = parseDocument(await store.read(slug));
      return {
        slug,
        title: readText(frontmatter, "title") || slug,
        subtitle: readText(frontmatter, "subtitle") || readText(frontmatter, "description"),
        datetime: readText(frontmatter, "datetime"),
        readTime: readText(frontmatter, "readTime"),
        category: readText(frontmatter, "category"),
        ogImage: readText(frontmatter, "ogImage"),
        featured: readFlag(frontmatter, "featured"),
        draft: readFlag(frontmatter, "draft"),
      };
    }),
  );
  return documents.sort((a, b) => b.datetime.localeCompare(a.datetime));
}

/**
 * A story card, laid out the way Medium lays one out: the writing on the left
 * — a line of context, the title, the standfirst — the thumbnail parked on the
 * right, and the row's own controls on a footer line under the text. A row
 * reads as a post rather than as a filename, which is what makes a long list
 * worth scanning.
 */
function DocumentCard({
  collection,
  document,
}: {
  collection: CollectionName;
  document: DocumentSummary;
}) {
  const href = editorPath(collection, document.slug);

  return (
    <li className="py-6">
      {document.featured && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pin className="size-3.5" aria-hidden="true" />
          Featured
        </p>
      )}

      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <Link href={href} className="group/link block">
            {/* Category is the section heading above, so the byline carries
                what differs row to row: when it was written, how long it is. */}
            <p className="text-xs text-muted-foreground">
              {/* An Issue's datetime carries a time and an offset, which is
                  noise in a list — the day is what tells one row from another. */}
              {document.datetime.slice(0, 10)}
              {document.readTime && ` · ${document.readTime}`}
            </p>
            <h3 className="mt-1 text-xl font-bold leading-snug transition-colors group-hover/link:text-blog-accent">
              {document.title}
            </h3>
            {document.subtitle && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{document.subtitle}</p>
            )}
          </Link>

          {/* The footer carries what you act on rather than what you read: the
              state of the file, and the menu that can delete it. */}
          <div className="mt-4 flex items-center gap-3">
            {document.draft && <Badge variant="secondary">draft</Badge>}
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground/70">
              {document.slug}
            </span>
            {/* Outside the link: a row is one destination, and deleting is not it. */}
            <DocumentActions collection={collection} slug={document.slug} title={document.title} />
          </div>
        </div>

        {document.ogImage && (
          // A second way into the same post, so it is hidden from assistive
          // tech and skipped by the keyboard — the title above already leads here.
          <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
            <Image
              src={document.ogImage}
              alt=""
              width={160}
              height={107}
              className="h-[6.7rem] w-40 rounded-sm bg-muted object-cover"
            />
          </Link>
        )}
      </div>
    </li>
  );
}

function DocumentList({
  collection,
  documents,
}: {
  collection: CollectionName;
  documents: DocumentSummary[];
}) {
  return (
    <ul className="divide-y border-t">
      {documents.map((document) => (
        <DocumentCard key={document.slug} collection={collection} document={document} />
      ))}
    </ul>
  );
}

/**
 * One category's posts, with the button that adds to them.
 *
 * A category with nothing in it is still drawn, because this is the only place
 * that says a category exists at all — hiding the empty one would hide the way
 * to write its first post.
 */
function CategorySection({ category, posts }: { category: string; posts: DocumentSummary[] }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          {category} · {posts.length}
        </h2>
        {/* The category is not asked for anywhere: starting a draft from this
            list is what files it under this list. */}
        <NewDocumentButton collection="posts" category={category} label="New post" />
      </div>
      {posts.length === 0 ? (
        <p className="border-t py-6 text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <DocumentList collection="posts" documents={posts} />
      )}
    </section>
  );
}

export default async function EditorIndex() {
  const [posts, issues] = await Promise.all([loadDocuments(postStore), loadDocuments(issueStore)]);

  return (
    // The index is chrome, not a post, so it has no category to follow — it
    // reads dark, and `html:has(.dark)` in globals.css carries the tokens up to
    // the document element the same way an article's theme does.
    <div className="dark min-h-screen font-sans">
      {/* Same bar as the editing page, so moving between the two feels like
          one surface rather than two pages that happen to be adjacent. */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/90 px-6 py-3 font-sans text-sm backdrop-blur">
        <NavLink href="/" back>
          Home
        </NavLink>
        {/* The other editor surface: what is written lives here, who it goes
            to lives there. Same control as the one in the newsletter pages'
            header, and pushed to the same end of the bar — it is the one thing
            up here that leaves the writing behind, rather than one more item of
            editor navigation. */}
        <DevSubscribersLink className="ms-auto" />
      </header>

      <main className="mx-auto w-full max-w-[45.5rem] px-6 pb-16 pt-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dev-only editor · {posts.length} posts
          </p>
        </div>

        {/* No "New post" up here: a post has to be filed under a category, and
            only the per-category buttons below know which one. */}
        {CATEGORIES.map((category) => (
          <CategorySection
            key={category}
            category={category}
            posts={posts.filter((post) => post.category === category)}
          />
        ))}

        {/* Issues live on the same page as Posts rather than behind their own
            route: there are a handful of them, they are written in the same
            editor, and one list is one place to come back to. */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight">Newsletter</h2>
            <NewDocumentButton collection="issues" label="New issue" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{issues.length} issues</p>
          <div className="mt-10">
            <DocumentList collection="issues" documents={issues} />
          </div>
        </section>
      </main>
    </div>
  );
}

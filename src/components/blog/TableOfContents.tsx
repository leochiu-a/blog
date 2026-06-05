type TocItem = { text: string; href: string; sub: boolean };

/** Fixed right-hand "Contents" outline, visible at lg+. */
export function TableOfContents({ items }: { items: TocItem[] }) {
  if (!items.length) return null;
  return (
    <nav className="fixed right-4 top-24 ml-4 mt-12 hidden w-64 lg:block">
      <h2 className="mb-2 text-lg font-semibold uppercase tracking-wide text-gold">Contents</h2>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <a
            key={item.href + item.text}
            href={item.href}
            className={`text-sm hover:underline ${item.sub ? "pl-3 text-muted-foreground" : "text-foreground"}`}
          >
            {item.text}
          </a>
        ))}
      </div>
    </nav>
  );
}

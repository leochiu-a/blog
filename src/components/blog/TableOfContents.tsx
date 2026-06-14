"use client";

import { useEffect } from "react";
import tocbot from "tocbot";

export function TableOfContents() {
  useEffect(() => {
    tocbot.init({
      tocSelector: ".toc",
      contentSelector: "article",
      headingSelector: "h2, h3",
      collapseDepth: 1,
      scrollSmooth: true,
      headingsOffset: 80,
      scrollSmoothOffset: -80,
    });
    return () => tocbot.destroy();
  }, []);

  return (
    <nav className="sticky top-24 w-full max-w-48">
      <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-gold">Contents</h2>
      <div className="toc text-sm [&_.toc-link]:block [&_.toc-link]:py-0.5 [&_.toc-link]:text-muted-foreground [&_.toc-link]:transition-colors [&_.toc-link]:hover:text-foreground [&_.toc-link.is-active-link]:font-medium [&_.toc-link.is-active-link]:text-foreground [&_.toc-list]:flex [&_.toc-list]:flex-col [&_.toc-list.is-collapsed]:hidden [&_.toc-list-item]:list-none [&_.toc-list_.toc-list]:pl-4 [&_.toc-list_.toc-list_.toc-link]:text-xs" />
    </nav>
  );
}

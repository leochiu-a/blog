"use client";

import { useRef, useState } from "react";
import type { Project } from "@/types/content";
import { CardCorner, GitHubMark } from "@/components/icons";
import { ProjectMedia } from "@/components/ProjectMedia";

const badgeClass =
  "inline-flex items-center gap-x-1.5 rounded-full border px-2.5 py-1 font-mono text-xxs no-underline transition-colors hover:no-underline";

export function ProjectCard({ project }: { project: Project }) {
  // A usable build beats a readable one as the headline destination; the repo
  // is still one click away in the badge row below.
  const href = project.live ?? project.github;
  // Owned here rather than in ProjectMedia so the whole card is the hover
  // target — reaching the demo should not mean finding the image.
  const [active, setActive] = useState(false);
  // The pointer lands on a CSS variable rather than in state: the rim light
  // repaints on every mousemove, and a re-render per pixel is not worth it.
  const cardRef = useRef<HTMLDivElement>(null);

  const trackPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      className="w-full relative flex flex-col gap-y-3 rounded-lg border-2 border-bronze/20 bg-card warm-shadow transition-all duration-300 hover:border-gold/40 hover:warm-shadow-lg hover:-translate-y-1"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={trackPointer}
    >
      <div className="spotlight-glow" data-lit={active} aria-hidden="true" />
      {/* Corner ornaments */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-2 top-2">
          <CardCorner className="text-bronze opacity-40" />
        </div>
        <div className="absolute right-2 top-2 rotate-90">
          <CardCorner className="text-bronze opacity-40" />
        </div>
        <div className="absolute bottom-2 left-2 -rotate-90">
          <CardCorner className="text-bronze opacity-40" />
        </div>
        <div className="absolute bottom-2 right-2 rotate-180">
          <CardCorner className="text-bronze opacity-40" />
        </div>
      </div>

      {/* Main link */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex flex-col gap-y-3 no-underline"
      >
        <ProjectMedia
          image={project.image}
          video={project.video}
          title={project.title}
          active={active}
        />
        <div className="flex flex-col gap-y-0.5 px-5 pt-4">
          <h3 className="text-xl font-semibold text-foreground">{project.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
          {project.tags && project.tags.length > 0 && (
            <div className="mt-1 flex flex-row gap-x-2">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-[#ef4444] px-2 text-xs text-white">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>

      {/* Credentials — sibling anchors, since these can't nest inside the one above.
          Every project shows whatever it can claim, so no card reads as missing a badge. */}
      <div className="relative flex flex-col gap-y-2 px-5 pb-4">
        <div className="flex flex-row flex-wrap items-center gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className={`${badgeClass} border-bronze/40 text-bronze hover:border-bronze hover:bg-bronze/10`}
            >
              <GitHubMark />
              Open source
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              // Gold reads at ~2:1 on the light card, so the label steps down to
              // burnt sienna there; the pulsing dot carries the gold in both themes.
              className={`${badgeClass} border-gold/50 text-burnt-sienna hover:border-gold hover:bg-gold/10 dark:text-gold`}
            >
              <span className="size-1.5 rounded-full bg-gold motion-reduce:animate-none animate-pulse" />
              Live
            </a>
          )}
        </div>

        {/* HN badge — keeps its own orange, since that's the whole point of it */}
        {project.hn && (
          <a
            href={project.hn.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-50 flex-row font-mono no-underline hover:no-underline"
          >
            <div className="inline-block border border-[#ff6600] bg-[#ff6600] px-2 py-1 text-xxs text-white">
              HN
            </div>
            <div className="inline-block w-full border border-[#ff6600] bg-[#f6f6ef] px-2 py-1 text-xxs text-black">
              <span>{project.hn.points} points</span>
              <span className="mx-1">•</span>
              <span>{project.hn.comments} comments</span>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}

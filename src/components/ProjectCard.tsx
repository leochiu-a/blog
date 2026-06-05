import type { Project } from "@/types/content";
import { CardCorner } from "@/components/icons";

export function ProjectCard({ project }: { project: Project }) {
  const isExternal = project.href.startsWith("http");

  return (
    <div className="w-full relative flex flex-col gap-y-3 rounded-lg border-2 border-bronze/20 bg-card warm-shadow transition-all duration-300 hover:border-gold/40 hover:warm-shadow-lg hover:-translate-y-1">
      {/* Corner ornaments */}
      <div className="pointer-events-none">
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
        href={project.href}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex flex-col gap-y-3 no-underline"
      >
        <img
          src={project.image}
          alt=""
          className="h-48 w-full rounded-t-md object-cover"
        />
        <div className="flex flex-col gap-y-0.5 px-5 py-4">
          <h3 className="font-cormorant text-xl font-semibold text-foreground">
            {project.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
          {project.tags && project.tags.length > 0 && (
            <div className="mt-1 flex flex-row gap-x-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#ef4444] px-2 text-xs text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>

      {/* HN badge — separate sibling <a> to avoid nested anchors */}
      {project.hn && (
        <div className="px-5 pb-4">
          <a
            href={project.hn.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-[200px] flex-row font-mono no-underline hover:no-underline"
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
        </div>
      )}
    </div>
  );
}

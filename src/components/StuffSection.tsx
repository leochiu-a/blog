import { projects } from "@/data/content";
import { ProjectCard } from "./ProjectCard";

export function StuffSection() {
  return (
    <section className="flex flex-col gap-y-5 md:flex-row md:gap-y-0">
      <div className="md:w-1/5">
        <h2 className="font-cormorant text-2xl font-semibold text-foreground">
          Stuff I&apos;ve Made
        </h2>
      </div>
      <div className="flex flex-col gap-y-3 md:w-2/3">
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.title} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

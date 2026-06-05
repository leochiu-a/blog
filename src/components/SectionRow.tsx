import type { ReactNode } from "react";

/** Two-column section: left serif label (md:w-1/5) + content (md:w-2/3). Stacks below md. */
export function SectionRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-y-5 md:flex-row md:gap-y-0">
      <div className="md:w-1/5">
        <h2 className="font-cormorant text-2xl font-semibold text-foreground">{label}</h2>
      </div>
      <div className="flex flex-col gap-y-3 md:w-2/3">{children}</div>
    </section>
  );
}

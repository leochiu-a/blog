import type { Mode } from "@/types/content";
import FlipPhoto from "@/components/FlipPhoto";
import { profile } from "@/data/content";

interface HeroProps {
  mode: Mode;
  onFlip: () => void;
}

export function Hero({ mode, onFlip }: HeroProps) {
  return (
    <section className="flex flex-col items-center gap-y-4">
      <FlipPhoto
        flipped={mode === "personal"}
        onFlip={onFlip}
        frontSrc={profile.professionalPhoto}
        backSrc={profile.personalPhoto}
      />
      <h1 className="text-5xl font-medium tracking-wide text-foreground">
        {mode === "professional" ? profile.name : profile.shortName}
      </h1>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import type { Mode } from "@/types/content";
import FlipPhoto from "@/components/FlipPhoto";
import { profile } from "@/data/content";

export function Hero({ mode }: { mode: Mode }) {
  const router = useRouter();

  const handleFlip = () => {
    const newMode = mode === "professional" ? "personal" : "professional";
    const params = new URLSearchParams(window.location.search);
    params.set("mode", newMode);
    router.replace(`?${params.toString()}`);
  };

  return (
    <section className="flex flex-col items-center gap-y-4">
      <FlipPhoto
        flipped={mode === "personal"}
        onFlip={handleFlip}
        frontSrc={profile.professionalPhoto}
        backSrc={profile.personalPhoto}
      />
      <h1 className="font-cormorant text-5xl font-semibold tracking-wide text-foreground">
        {mode === "professional" ? profile.name : profile.shortName}
      </h1>
    </section>
  );
}

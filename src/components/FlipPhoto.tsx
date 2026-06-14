import Image from "next/image";
import { WhirlRings } from "@/components/icons";

interface FlipPhotoProps {
  flipped: boolean;
  onFlip?: () => void;
  frontSrc?: string;
  backSrc?: string;
}

export default function FlipPhoto({
  flipped,
  onFlip,
  frontSrc = "/images/thariq-professional.jpg",
  backSrc = "/images/thariq-personal.png",
}: FlipPhotoProps) {
  return (
    <button
      type="button"
      className={`flip-container h-48 w-48${flipped ? " flipped" : ""}`}
      aria-label="Toggle profile photo"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip?.();
        }
      }}
    >
      <div className="flip-inner">
        <div className="flip-face flip-front">
          <div className="relative h-48 w-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <WhirlRings className="absolute h-full w-full" />
            </div>
            <div className="absolute inset-[14px] overflow-hidden rounded-full">
              <Image
                src={frontSrc}
                alt="Professional profile"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="flip-face flip-back">
          <div className="relative h-48 w-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <WhirlRings className="absolute h-full w-full" />
            </div>
            <div className="absolute inset-[14px] overflow-hidden rounded-full">
              <Image
                src={backSrc}
                alt="Personal profile"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

import type { SVGProps } from "react";

/** Concentric-circle ornament with radial ticks — used flanking the mode toggle. */
export function OrnamentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
      <line x1="12" y1="4" x2="12" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="12" y1="18" x2="12" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="4" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="18" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Diamond tile pattern for the toggle track background. */
export function TrackPattern(props: SVGProps<SVGSVGElement>) {
  return (
    <svg preserveAspectRatio="none" viewBox="0 0 200 40" {...props}>
      <defs>
        <pattern
          id="diamond-pattern"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path d="M10,0 L20,10 L10,20 L0,10 Z" fill="currentColor" opacity="0.05" />
        </pattern>
      </defs>
      <rect width="200" height="40" fill="url(#diamond-pattern)" />
    </svg>
  );
}

/** Animated whirling gold rings behind the hero profile photo. */
export function WhirlRings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" {...props}>
      <g className="whirl-slow">
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-gold opacity-40"
        />
        <path
          d="M 100 5 A 95 95 0 0 1 195 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gold opacity-70"
        />
        <path
          d="M 195 100 A 95 95 0 0 1 100 195"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gold opacity-50"
        />
      </g>
      <g className="whirl-medium">
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gold opacity-30"
        />
        <path
          d="M 100 12 A 88 88 0 0 1 188 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-bronze opacity-60"
        />
        <path
          d="M 12 100 A 88 88 0 0 1 100 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-bronze opacity-40"
        />
      </g>
      <g className="whirl-fast">
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gold opacity-20"
        />
        <path
          d="M 100 18 A 82 82 0 0 1 150 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-gold opacity-60"
        />
        <path
          d="M 182 100 A 82 82 0 0 1 170 150"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-gold opacity-60"
        />
        <path
          d="M 100 182 A 82 82 0 0 1 50 170"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-gold opacity-60"
        />
        <path
          d="M 18 100 A 82 82 0 0 1 30 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-gold opacity-60"
        />
      </g>
    </svg>
  );
}

/** Small concentric-circle ornament used in the section dividers. */
export function DividerOrnament(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" {...props}>
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

/** Corner flourish placed in each project card's four corners. */
export function CardCorner(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...props}>
      <path
        d="M2 2 L8 2 L2 8 Z M2 2 L4 4 L2 6 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

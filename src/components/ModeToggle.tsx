"use client";

import { OrnamentIcon, TrackPattern } from "@/components/icons";
import type { Mode } from "@/types/content";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle-container">
      <OrnamentIcon className="ornament ornament-left" />
      <div
        className={`mode-toggle${mode === "personal" ? " personal-mode" : ""}`}
        role="switch"
        aria-label="Toggle between professional and personal mode"
        aria-checked={mode === "personal"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onChange(mode === "professional" ? "personal" : "professional");
          }
        }}
      >
        <div className="toggle-track">
          <TrackPattern className="track-pattern" />
          <div className="toggle-indicator" />
          <button
            type="button"
            className={`toggle-option toggle-professional${mode === "professional" ? " active" : ""}`}
            data-mode="professional"
            onClick={() => onChange("professional")}
          >
            <span className="option-icon">⚙</span>
            <span className="option-label">Professional</span>
          </button>
          <button
            type="button"
            className={`toggle-option toggle-personal${mode === "personal" ? " active" : ""}`}
            data-mode="personal"
            onClick={() => onChange("personal")}
          >
            <span className="option-icon">✦</span>
            <span className="option-label">Personal</span>
          </button>
        </div>
      </div>
      <OrnamentIcon className="ornament ornament-right" />
    </div>
  );
}

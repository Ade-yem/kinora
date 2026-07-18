import React from "react";

export type LogoVariant = "pulse-bubble" | "rep-loop" | "signal-bars";

interface LogoProps {
  variant: LogoVariant;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: 28,
  md: 48,
  lg: 84,
  xl: 120,
};

export function Logo({ variant, size = "md", className = "" }: LogoProps) {
  const pixelSize = SIZE_MAP[size];

  if (variant === "rep-loop") {
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
        aria-hidden="true"
      >
        {/* Rounded square container */}
        <rect width="120" height="120" rx="34" fill="oklch(0.22 0.02 60)" />
        {/* Open ring - 180 degree arc */}
        <path
          d="M 40.55 79.45 A 27.5 27.5 0 0 1 79.45 40.55"
          fill="none"
          stroke="oklch(0.78 0.19 130)"
          strokeWidth="9"
          strokeLinecap="square"
        />
        {/* Coral dot */}
        <circle cx="89" cy="27" r="7" fill="oklch(0.68 0.19 35)" />
      </svg>
    );
  }

  if (variant === "signal-bars") {
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
        aria-hidden="true"
      >
        {/* Rounded square container with border */}
        <rect
          x="1"
          y="1"
          width="118"
          height="118"
          rx="33"
          fill="oklch(0.99 0.004 80)"
          stroke="oklch(0.22 0.02 60 / 0.1)"
          strokeWidth="2"
        />
        {/* Bar 1: Coral */}
        <rect x="33" y="47" width="9" height="26" rx="4.5" fill="oklch(0.68 0.19 35)" />
        {/* Bar 2: Dark Ink */}
        <rect x="48" y="36" width="9" height="48" rx="4.5" fill="oklch(0.22 0.02 60)" />
        {/* Bar 3: Volt */}
        <rect x="63" y="43" width="9" height="34" rx="4.5" fill="oklch(0.78 0.19 130)" />
        {/* Bar 4: Muted Ink */}
        <rect x="78" y="52" width="9" height="16" rx="4.5" fill="oklch(0.22 0.02 60 / 0.25)" />
      </svg>
    );
  }

  // Default: pulse-bubble
  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="50%" stopColor="oklch(0.78 0.19 130)" />
          <stop offset="50%" stopColor="oklch(0.68 0.19 35)" />
        </linearGradient>
      </defs>
      {/* Rounded square container with gradient background */}
      <rect width="120" height="120" rx="34" fill="url(#pulseGradient)" />
      {/* Pulse heartbeat tail polygon */}
      <polygon
        points="32,62.2 43.2,62.2 48.8,53.4 55.52,67.7 62.24,50.1 67.84,62.2 88,62.2 88,64.84 67.84,64.84 63.36,71 55.52,58.9 51.04,64.84 32,64.84"
        fill="oklch(0.99 0.004 80)"
      />
      {/* Dot */}
      <circle cx="99" cy="101" r="7" fill="oklch(0.99 0.004 80)" />
    </svg>
  );
}

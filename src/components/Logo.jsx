import React from "react";

// The Jejak gold coin — also the logo. Simple SVG with a gold radial gradient
// and a "J" trace-line mark. Scales via the `size` prop.
export default function Logo({ size = 40, glow = true, className = "" }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id="jejakCoinG" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#FFF3C4" />
            <stop offset="45%" stopColor="#FFC24B" />
            <stop offset="100%" stopColor="#E8921A" />
          </radialGradient>
          {glow && (
            <filter id="jejakCoinGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>
        {glow && <circle cx="32" cy="32" r="30" fill="#FFC24B" opacity="0.25" />}
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="url(#jejakCoinG)"
          stroke="#B5750E"
          strokeWidth="2"
          filter={glow ? "url(#jejakCoinGlow)" : undefined}
        />
        <path
          d="M22 44V20h12c6 0 10 3 10 8 0 4-3 7-8 7h-5v9z"
          fill="#7A4A07"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}
import React from "react";

// The Jejak gold coin — also the logo. Simple SVG with a gold radial gradient
// and a connected "J" supply-chain trace-line mark. Scales via the `size` prop.
export default function Logo({ size = 40, glow = true, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
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
        {/* Subtle inner compass ring */}
        <circle
          cx="32"
          cy="32"
          r="22.5"
          fill="none"
          stroke="#7A4A07"
          strokeWidth="1"
          strokeDasharray="2.5 3.5"
          opacity="0.35"
        />
        {/* Jejak "J" formed as a connected supply-chain route line with origin & destination nodes */}
        <path
          d="M 30 18 H 39 V 36 C 39 43.5 33.5 47.5 26.5 47.5 C 21.5 47.5 18.5 44.5 18.5 39.5"
          fill="none"
          stroke="#1B1B3A"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Origin node at top of the J */}
        <circle cx="39" cy="18" r="3.6" fill="#FF7A1A" stroke="#1B1B3A" strokeWidth="1.8" />
        {/* Destination node at hook of the J */}
        <circle cx="18.5" cy="39.5" r="3.4" fill="#2FBF71" stroke="#1B1B3A" strokeWidth="1.8" />
      </svg>
    </span>
  );
}
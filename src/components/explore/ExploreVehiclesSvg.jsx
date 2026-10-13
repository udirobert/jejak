import React from "react";

// Larger, expressive illustrated transport vehicles sharing Jejak's visual language
// and category-colour containers, with soft wakes/trails instead of thin lines.
export function TransportVehicleSvg({
  mode = "ship",
  x,
  y,
  angle = 0,
  containers = ["#2FBF71", "#FF7A1A", "#2D5BFF"],
  invScale = 1,
  highlight = false,
}) {
  const normalized = ((angle % 360) + 360) % 360;
  const flipY = normalized > 90 && normalized < 270 ? -1 : 1;
  const baseScale = (highlight ? 1.38 : 1.18) * invScale;

  if (mode === "plane") {
    // Aircraft rotates freely in 360deg without vertical flip
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(
          1
        )}) rotate(${angle.toFixed(1)}) scale(${baseScale.toFixed(3)})`}
      >
        {/* Soft dual jet contrail puffs */}
        <path
          d="M -7 -2.2 L -22 -3.4 M -7 2.2 L -22 3.4"
          stroke="#E0F2FE"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity={highlight ? "0.65" : "0.38"}
          fill="none"
        />
        <circle cx="-13" cy="-2.6" r="1.4" fill="#FFFFFF" opacity="0.35" />
        <circle cx="-13" cy="2.6" r="1.4" fill="#FFFFFF" opacity="0.35" />

        {/* Swept wings */}
        <path
          d="M -1 0 L -4.5 -8.5 L -1.5 -8.5 L 3.2 0 L -1.5 8.5 L -4.5 8.5 Z"
          fill={highlight ? "#FFC24B" : "#F8FAFC"}
          stroke="#0F243C"
          strokeWidth="0.55"
        />
        {/* Tailplane */}
        <path
          d="M -6.2 0 L -8.5 -4.2 L -6.8 -4.2 L -4.8 0 L -6.8 4.2 L -8.5 4.2 Z"
          fill={containers[0]}
          stroke="#0F243C"
          strokeWidth="0.45"
        />
        {/* Fuselage */}
        <path
          d="M -8 0 C -8 -1.4, 4 -1.5, 7.5 0 C 4 1.5, -8 1.4, -8 0 Z"
          fill="#FFFFFF"
          stroke="#0F243C"
          strokeWidth="0.55"
        />
        {/* Category-coloured cargo stripe */}
        <rect
          x="-3.5"
          y="-0.65"
          width="6.2"
          height="1.3"
          rx="0.6"
          fill={containers[1]}
        />
      </g>
    );
  }

  if (mode === "train") {
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(
          1
        )}) rotate(${angle.toFixed(1)}) scale(${baseScale.toFixed(3)}, ${(
          baseScale * flipY
        ).toFixed(3)})`}
      >
        {/* Soft slipstream wake */}
        <path
          d="M -11 -1.2 L -22 -1.2 M -11 1.2 L -19 1.2"
          stroke="#FFE49E"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity={highlight ? "0.65" : "0.38"}
        />
        {/* Rear wagon */}
        <rect
          x="-10.5"
          y="-2.4"
          width="5.2"
          height="3.2"
          rx="0.6"
          fill={containers[2]}
          stroke="#0F243C"
          strokeWidth="0.5"
        />
        {/* Middle wagon */}
        <rect
          x="-4.6"
          y="-2.4"
          width="5.2"
          height="3.2"
          rx="0.6"
          fill={containers[0]}
          stroke="#0F243C"
          strokeWidth="0.5"
        />
        {/* Lead locomotive */}
        <path
          d="M 1.2 -2.6 L 6.4 -2.6 L 8.2 -0.4 L 8.2 0.8 L 1.2 0.8 Z"
          fill={highlight ? "#FFC24B" : "#F8FAFC"}
          stroke="#0F243C"
          strokeWidth="0.55"
        />
        <rect
          x="2.2"
          y="-1.8"
          width="2.6"
          height="1.4"
          rx="0.3"
          fill={containers[1]}
        />
        {/* Wheels */}
        <circle cx="-8" cy="1.3" r="0.85" fill="#0F243C" />
        <circle cx="-2" cy="1.3" r="0.85" fill="#0F243C" />
        <circle cx="4.8" cy="1.3" r="0.85" fill="#0F243C" />
      </g>
    );
  }

  if (mode === "lorry") {
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(
          1
        )}) rotate(${angle.toFixed(1)}) scale(${baseScale.toFixed(3)}, ${(
          baseScale * flipY
        ).toFixed(3)})`}
      >
        {/* Soft motion puff trail */}
        <circle cx="-9.5" cy="-0.4" r="1.8" fill="#FFE49E" opacity="0.38" />
        <circle cx="-13" cy="-0.6" r="1.3" fill="#FFFFFF" opacity="0.28" />

        {/* Container trailer */}
        <rect
          x="-6.8"
          y="-3.2"
          width="8.4"
          height="4.2"
          rx="0.7"
          fill={containers[0]}
          stroke="#FFFFFF"
          strokeWidth="0.55"
        />
        {/* Category accent stripe on trailer */}
        <rect
          x="-5.6"
          y="-1.8"
          width="6.0"
          height="1.3"
          rx="0.35"
          fill={containers[1]}
        />
        {/* Truck cab */}
        <path
          d="M 2.0 -2.6 L 5.2 -2.6 L 6.4 -0.8 L 6.4 1.0 L 2.0 1.0 Z"
          fill={highlight ? "#FFC24B" : "#F8FAFC"}
          stroke="#0F243C"
          strokeWidth="0.55"
        />
        {/* Wheels */}
        <circle cx="-4.2" cy="1.4" r="1.05" fill="#0F243C" stroke="#FFFFFF" strokeWidth="0.35" />
        <circle cx="0.2" cy="1.4" r="1.05" fill="#0F243C" stroke="#FFFFFF" strokeWidth="0.35" />
        <circle cx="4.2" cy="1.4" r="1.05" fill="#0F243C" stroke="#FFFFFF" strokeWidth="0.35" />
      </g>
    );
  }

  // Default: "ship" (Container cargo vessel with soft V-wake)
  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(
        1
      )}) rotate(${angle.toFixed(1)}) scale(${baseScale.toFixed(3)}, ${(
        baseScale * flipY
      ).toFixed(3)})`}
    >
      {/* Soft V-shaped wake foam */}
      <path
        d="M -7 0 L -21 -4.8 M -7 0 L -21 4.8"
        stroke={highlight ? "#FFE49E" : "#BAE6FD"}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity={highlight ? "0.72" : "0.42"}
        fill="none"
      />
      <path
        d="M -8 0 L -15 0"
        stroke="#FFFFFF"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity={highlight ? "0.65" : "0.35"}
      />

      {/* Hull */}
      <path
        d="M -7.2 2.1 L 6.2 2.1 L 9.0 -0.7 L -6.2 -0.7 Z"
        fill={highlight ? "#FFC24B" : "#0F243C"}
        stroke="#FFFFFF"
        strokeWidth="0.65"
      />

      {/* 3 Category-Coloured Containers */}
      <rect
        x="-4.6"
        y="-3.1"
        width="2.9"
        height="2.3"
        rx="0.4"
        fill={containers[0]}
      />
      <rect
        x="-1.4"
        y="-3.1"
        width="2.9"
        height="2.3"
        rx="0.4"
        fill={containers[1]}
      />
      <rect
        x="1.8"
        y="-3.1"
        width="2.9"
        height="2.3"
        rx="0.4"
        fill={containers[2]}
      />

      {/* White Bridge Superstructure */}
      <rect
        x="-6.2"
        y="-3.8"
        width="1.6"
        height="3.0"
        rx="0.35"
        fill="#F8FAFC"
      />
    </g>
  );
}

// Playful surfacing whale fluke or dorsal fin with concentric ripple (no text or facts)
export function SurfacingCreatureSvg({ x, y, kind, progress, invScale = 1 }) {
  const rippleR1 = 3 + progress * 16;
  const rippleR2 = Math.max(2, (progress - 0.2) * 14);
  const alpha = Math.sin(progress * Math.PI);

  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(
        1
      )}) scale(${invScale.toFixed(3)})`}
      opacity={Math.max(0, Math.min(1, alpha))}
    >
      <ellipse
        cx="0"
        cy="1"
        rx={rippleR1}
        ry={rippleR1 * 0.52}
        fill="none"
        stroke="#BAE6FD"
        strokeWidth="1"
        opacity={Math.max(0, 0.75 * (1 - progress))}
      />
      {progress > 0.2 && (
        <ellipse
          cx="0"
          cy="1"
          rx={rippleR2}
          ry={rippleR2 * 0.52}
          fill="none"
          stroke="#E0F2FE"
          strokeWidth="0.8"
          opacity={Math.max(0, 0.6 * (1 - progress))}
        />
      )}
      <g
        transform={`translate(0, ${((1 - alpha) * 4).toFixed(1)}) scale(${
          0.85 + alpha * 0.25
        })`}
      >
        {kind === "whale" ? (
          <path
            d="M 0 1 C -0.5 -2, -3.5 -5, -6.5 -5.5 C -4.5 -3, -2.5 -1.5, -1 -0.5 C -0.3 -2.5, 0.3 -2.5, 1 -0.5 C 2.5 -1.5, 4.5 -3, 6.5 -5.5 C 3.5 -5, 0.5 -2, 0 1 Z"
            fill="#E0F2FE"
            stroke="#0F2942"
            strokeWidth="0.5"
          />
        ) : (
          <path
            d="M -3.5 1 C -1.5 -3.5, 1.5 -5.5, 3.2 -5.8 C 2.1 -2.8, 2.2 -0.5, 3.5 1 Z"
            fill="#BAE6FD"
            stroke="#0F2942"
            strokeWidth="0.5"
          />
        )}
      </g>
    </g>
  );
}
import React from "react";
import { Image as ContentImage } from "@/components/ui/image";
import { PRODUCT_SURFACES } from "./exploreUtils";

// Crisp SVG product illustrations replacing generic emoji (no trench-coat emoji).
function ProductSvg({ productId, className = "h-6 w-6" }) {
  switch (productId) {
    case "trainers":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
          {/* Running shoe silhouette */}
          <path
            d="M8 31c0-2.5 2-4.5 4.5-5l6.5-1.5 5.5-7.5c.8-1 2.2-1.2 3.2-.4l2.8 2.4c1.8 1.5 4 2.5 6.4 2.8l3.1.4c2.2.3 4 2.2 4 4.5V31H8Z"
            fill="#FFFFFF"
            fillOpacity="0.92"
          />
          {/* Midsole wedge */}
          <path
            d="M6 31h37c1.1 0 2 .9 2 2v1.5c0 1.4-1.1 2.5-2.5 2.5H7.5C6.1 37 5 35.9 5 34.5V32c0-.6.4-1 1-1Z"
            fill="#FFC24B"
          />
          {/* Dynamic speed stripe */}
          <path
            d="M17 27.5l8.5-4.2M21 29.2l9-4.2"
            stroke="#1B1B3A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "coffee":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
          {/* Coffee pouch */}
          <path
            d="M14 13h20l2 6v17c0 2.2-1.8 4-4 4H16c-2.2 0-4-1.8-4-4V19l2-6Z"
            fill="#FFFFFF"
            fillOpacity="0.92"
          />
          {/* Top seal fold */}
          <path
            d="M13 13h22v3.5H13V13Z"
            fill="#FFC24B"
          />
          {/* Coffee bean emblem */}
          <ellipse cx="24" cy="27.5" rx="5.5" ry="6.8" fill="#1B1B3A" />
          <path
            d="M24 21.5c-1.8 2-1.8 4 0 6s1.8 4 0 6"
            stroke="#FFC24B"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "phone_case":
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
          {/* Protective case body */}
          <rect
            x="14"
            y="7"
            width="20"
            height="34"
            rx="5.5"
            fill="#FFFFFF"
            fillOpacity="0.92"
            stroke="#1B1B3A"
            strokeWidth="1.8"
          />
          {/* Camera island */}
          <rect x="17" y="10.5" width="7.5" height="7.5" rx="2.2" fill="#1B1B3A" />
          <circle cx="19.5" cy="13" r="1.2" fill="#FFC24B" />
          <circle cx="22" cy="15.5" r="1.2" fill="#2FBF71" />
          {/* MagSafe ring */}
          <circle
            cx="24"
            cy="26"
            r="4.8"
            stroke="#2D5BFF"
            strokeWidth="2"
          />
        </svg>
      );
    case "hoodie":
    default:
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
          {/* Pullover hoodie silhouette (hood + sleeves + torso + kangaroo pocket) */}
          <path
            d="M17.5 11C19 8.8 21.3 7.5 24 7.5s5 1.3 6.5 3.5l8.5 4.8c1.4.8 2 2.5 1.3 4l-2.6 5.4c-.5 1-1.7 1.4-2.7.9L32 24.5V37c0 1.7-1.3 3-3 3H19c-1.7 0-3-1.3-3-3V24.5l-3 1.6c-1 .5-2.2.1-2.7-.9L7.7 19.8c-.7-1.5-.1-3.2 1.3-4l8.5-4.8Z"
            fill="#FFFFFF"
            fillOpacity="0.94"
          />
          {/* Hood opening */}
          <path
            d="M20 11.5c1.1 1.6 2.5 2.4 4 2.4s2.9-.8 4-2.4"
            stroke="#1B1B3A"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Drawstrings */}
          <path
            d="M22.2 14v5.5M25.8 14v4.5"
            stroke="#FF7A1A"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Kangaroo pocket */}
          <path
            d="M19 30h10l1.2 4.5H17.8L19 30Z"
            fill="#1B1B3A"
            fillOpacity="0.18"
          />
        </svg>
      );
  }
}

export default function ProductIllustrationIcon({
  productId = "hoodie",
  photoUrl = "",
  size = "sm",
  className = "",
}) {
  const bg = PRODUCT_SURFACES[productId] || PRODUCT_SURFACES.hoodie;

  if (size === "hero") {
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
        style={{ background: bg }}
      >
        {photoUrl ? (
          <ContentImage
            src={photoUrl}
            fittingType="fill"
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <svg
              viewBox="0 0 240 120"
              className="absolute inset-0 h-full w-full opacity-25"
              aria-hidden="true"
            >
              <circle cx="120" cy="60" r="34" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle
                cx="120"
                cy="60"
                r="56"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle cx="120" cy="60" r="80" fill="none" stroke="#FFFFFF" strokeWidth="0.75" />
            </svg>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-jejak-navy/25 backdrop-blur-md border border-white/45 shadow-lg">
              <ProductSvg productId={productId} className="h-12 w-12" />
            </div>
          </>
        )}
      </div>
    );
  }

  const boxClass =
    size === "md"
      ? "h-11 w-11 rounded-2xl"
      : "h-9 w-9 rounded-xl";
  const svgClass = size === "md" ? "h-7 w-7" : "h-5 w-5";

  return (
    <div
      className={`relative shrink-0 overflow-hidden flex items-center justify-center shadow-sm border border-white/40 ${boxClass} ${className}`}
      style={{ background: bg }}
    >
      {photoUrl ? (
        <ContentImage
          src={photoUrl}
          fittingType="fill"
          className="h-full w-full object-cover"
        />
      ) : (
        <ProductSvg productId={productId} className={svgClass} />
      )}
    </div>
  );
}
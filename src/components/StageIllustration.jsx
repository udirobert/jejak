import React from "react";
import { motion } from "framer-motion";

// Bespoke animated SVG micro-illustration for each supply-chain stop stage:
// farm/harvest, factory/cut-and-sew, ocean/port freight, or retail shelf.
export default function StageIllustration({ stage = "", index = 0 }) {
  const s = stage.toLowerCase();
  const isFreight = s.includes("port") || s.includes("ship") || s.includes("freight") || s.includes("export");
  const isRetail = s.includes("retail") || s.includes("shelf") || s.includes("store") || s.includes("caf");
  const isOrigin = index === 0 || s.includes("farm") || s.includes("cotton") || s.includes("bean") || s.includes("rubber") || s.includes("resin");

  if (isOrigin) {
    // Sun + sprouting origin leaf
    return (
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-jejak-materials/15 border border-jejak-materials/35">
        <svg viewBox="0 0 36 36" className="h-7 w-7">
          <motion.circle
            cx="26"
            cy="10"
            r="4"
            fill="#FFC24B"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.path
            d="M18 28 V16 M18 21 C18 15, 10 13, 10 19 C10 23, 15 23, 18 21 Z M18 18 C18 12, 26 11, 26 17 C26 21, 21 21, 18 18 Z"
            fill="none"
            stroke="#2FBF71"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 }}
          />
        </svg>
      </div>
    );
  }

  if (isFreight) {
    // Bobbing cargo vessel on waves
    return (
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-jejak-freight/15 border border-jejak-freight/35">
        <svg viewBox="0 0 36 36" className="h-7 w-7">
          <motion.g
            animate={{ y: [-1.2, 1.2, -1.2], rotate: [-2, 2, -2] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="11" y="12" width="6" height="5" rx="1" fill="#FF7A1A" />
            <rect x="18" y="10" width="7" height="7" rx="1" fill="#8B5CF6" />
            <path d="M7 18 H29 L26 24 H10 Z" fill="#2D5BFF" />
          </motion.g>
          <path
            d="M5 27 Q11 24 18 27 T31 27"
            fill="none"
            stroke="#2D5BFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (isRetail) {
    // Storefront awning + price tag pulse
    return (
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-jejak-retail/15 border border-jejak-retail/35">
        <svg viewBox="0 0 36 36" className="h-7 w-7">
          <path d="M8 15 L10 9 H26 L28 15 Z" fill="#FF3D81" />
          <rect x="10" y="15" width="16" height="12" rx="2" fill="none" stroke="#1B1B3A" strokeWidth="2" />
          <motion.circle
            cx="18"
            cy="21"
            r="2.5"
            fill="#FFC24B"
            animate={{ scale: [0.9, 1.3, 0.9] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </svg>
      </div>
    );
  }

  // Default: Maker workshop / spinning craft gear + stitch
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-jejak-labour/15 border border-jejak-labour/35">
      <svg viewBox="0 0 36 36" className="h-7 w-7">
        <motion.circle
          cx="18"
          cy="18"
          r="8"
          fill="none"
          stroke="#FF7A1A"
          strokeWidth="2.4"
          strokeDasharray="4 3"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ originX: "18px", originY: "18px" }}
        />
        <circle cx="18" cy="18" r="3" fill="#1B1B3A" />
      </svg>
    </div>
  );
}
import React from "react";
import { motion } from "framer-motion";
import { formatMoney } from "@/lib/money";

// Kinetic SVG Sankey-style flow diagram showing 100% of the shelf price
// entering from the left, branching off into intermediary drains (Retail, Brand,
// Inputs, Freight), and a live glowing stream reaching Makers on the right.
// When the user adds a maker boost (`makerTip`), the maker stream visibly widens!
export default function SupplyFlowPipe({
  price,
  currency,
  labourPct,
  labourAmount,
  makerTip = 0,
}) {
  const stuckPct = Math.max(0, +(100 - labourPct).toFixed(1));
  const stuckAmount = Math.max(0, price - labourAmount);
  const effectiveMaker = labourAmount + makerTip;
  const effectivePct = Math.min(48, +((effectiveMaker / price) * 100).toFixed(1));

  // Stroke width of maker stream scales with effective percentage (min 4px, max 18px)
  const makerStroke = Math.max(4, Math.min(18, (effectivePct / 30) * 16));

  return (
    <div className="rounded-2xl bg-jejak-navy p-3.5 text-white shadow-inner">
      <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-white/65">
        <span>You pay {formatMoney(price, currency)}</span>
        <span className="text-amber-300 tabular-nums">
          {makerTip > 0
            ? `Boosted → ${formatMoney(effectiveMaker, currency)} (${effectivePct}%)`
            : `Makers get ${formatMoney(labourAmount, currency)} (${labourPct}%)`}
        </span>
      </div>

      <svg
        viewBox="0 0 320 92"
        className="mt-1.5 w-full h-[88px] overflow-visible"
        aria-label="Supply chain payment flow pipe"
      >
        <defs>
          <linearGradient id="pipeIn" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFC24B" />
            <stop offset="100%" stopColor="#FF3D81" />
          </linearGradient>
          <linearGradient id="makerStream" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF7A1A" />
            <stop offset="100%" stopColor="#2FBF71" />
          </linearGradient>
        </defs>

        {/* Left trunk: 100% payment entering */}
        <path
          d="M 12 44 C 70 44, 85 44, 125 44"
          fill="none"
          stroke="url(#pipeIn)"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Upper branch: Stuck in intermediaries (Retail + Brand + Freight) */}
        <path
          d="M 110 40 C 155 40, 175 18, 235 18"
          fill="none"
          stroke="#FF3D81"
          strokeWidth="15"
          strokeLinecap="round"
          opacity="0.45"
        />
        {/* Flowing particles into intermediary valve */}
        <path
          d="M 18 44 C 95 44, 155 18, 235 18"
          fill="none"
          stroke="#FF8A65"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="4 8"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="24"
            to="0"
            dur="1.1s"
            repeatCount="indefinite"
          />
        </path>

        {/* Lower branch: Reaches Makers at origin */}
        <motion.path
          d="M 115 48 C 165 48, 195 70, 255 70"
          fill="none"
          stroke="url(#makerStream)"
          initial={{ strokeWidth: makerStroke }}
          animate={{ strokeWidth: makerStroke }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          strokeLinecap="round"
        />
        {/* Animated golden pulses reaching makers */}
        <path
          d="M 18 46 C 110 46, 185 70, 255 70"
          fill="none"
          stroke="#FFF3C4"
          strokeWidth={makerTip > 0 ? 3.5 : 2}
          strokeLinecap="round"
          strokeDasharray="3 9"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="24"
            to="0"
            dur={makerTip > 0 ? "0.65s" : "1.2s"}
            repeatCount="indefinite"
          />
        </path>

        {/* Intermediary drain pill */}
        <g transform="translate(242, 6)">
          <rect width="72" height="24" rx="8" fill="rgba(255,61,129,0.22)" stroke="#FF3D81" strokeWidth="1" />
          <text x="36" y="11" textAnchor="middle" fill="#FFB3CE" fontSize="7.5" fontWeight="800">
            STUCK · {stuckPct}%
          </text>
          <text x="36" y="20" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900">
            {formatMoney(stuckAmount, currency)}
          </text>
        </g>

        {/* Maker destination node */}
        <g transform="translate(242, 56)">
          <rect
            width="72"
            height="26"
            rx="8"
            fill={makerTip > 0 ? "rgba(47,191,113,0.28)" : "rgba(255,122,26,0.25)"}
            stroke={makerTip > 0 ? "#2FBF71" : "#FF7A1A"}
            strokeWidth="1.2"
          />
          <text
            x="36"
            y="11"
            textAnchor="middle"
            fill={makerTip > 0 ? "#98F5C2" : "#FFD0A8"}
            fontSize="7.5"
            fontWeight="800"
          >
            {makerTip > 0 ? "BOOSTED" : `MAKERS · ${labourPct}%`}
          </text>
          <text x="36" y="21" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900">
            {formatMoney(effectiveMaker, currency)}
          </text>
        </g>
      </svg>
    </div>
  );
}
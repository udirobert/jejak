import React, { useId } from "react";
import { motion } from "framer-motion";
import { formatMoney } from "@/lib/money";

// True mathematical Sankey ribbon generator:
// Connects a vertical source segment [x0, y0Top..y0Bot] smoothly to a
// vertical destination segment [x1, y1Top..y1Bot] using cubic Bezier curves.
function sankeyRibbonPath(x0, y0Top, y0Bot, x1, y1Top, y1Bot) {
  const cx = (x0 + x1) / 2;
  return [
    `M ${x0} ${y0Top}`,
    `C ${cx} ${y0Top}, ${cx} ${y1Top}, ${x1} ${y1Top}`,
    `L ${x1} ${y1Bot}`,
    `C ${cx} ${y1Bot}, ${cx} ${y0Bot}, ${x0} ${y0Bot}`,
    "Z",
  ].join(" ");
}

function centerCurvePath(x0, y0, x1, y1) {
  const cx = (x0 + x1) / 2;
  return `M ${x0} ${y0} C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
}

export default function SupplyFlowPipe({
  price,
  currency,
  labourPct,
  labourAmount,
  makerTip = 0,
}) {
  const uid = useId().replace(/:/g, "");
  const stuckAmount = Math.max(0, price - labourAmount);
  const effectiveMaker = labourAmount + makerTip;
  const totalOut = price + makerTip;
  const effectiveMakerPct = Math.min(60, +((effectiveMaker / totalOut) * 100).toFixed(1));
  const stuckPct = +(100 - effectiveMakerPct).toFixed(1);

  // Geometry in a 300 x 108 coordinate space
  // Left trunk spans y = 26..82 (total height = 56px)
  const x0 = 6;
  const x1 = 294;
  const trunkTop = 26;
  const trunkH = 56;

  // Proportional split at trunk (clamped so maker stream is always visible ≥ 6px)
  const makerH0 = Math.max(6, Math.min(36, (effectiveMakerPct / 100) * trunkH * 1.35));
  const stuckH0 = trunkH - makerH0;
  const splitY0 = trunkTop + stuckH0;

  // Right destination heights (expanded slightly for visual clarity)
  const stuckTop1 = 10;
  const stuckBot1 = 10 + Math.max(22, stuckH0 * 0.88);

  const makerBot1 = 98;
  const makerTop1 = makerBot1 - Math.max(10, makerH0 * 1.25);

  const stuckRibbon = sankeyRibbonPath(x0, trunkTop, splitY0, x1, stuckTop1, stuckBot1);
  const makerRibbon = sankeyRibbonPath(x0, splitY0, trunkTop + trunkH, x1, makerTop1, makerBot1);

  const stuckCenter = centerCurvePath(
    x0,
    (trunkTop + splitY0) / 2,
    x1,
    (stuckTop1 + stuckBot1) / 2
  );
  const makerCenter = centerCurvePath(
    x0,
    (splitY0 + trunkTop + trunkH) / 2,
    x1,
    (makerTop1 + makerBot1) / 2
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#111536] p-3.5 text-white border border-white/10 shadow-lg">
      {/* Subtle ambient glow when boosted */}
      <div
        className="pointer-events-none absolute -right-8 -bottom-8 h-28 w-28 rounded-full blur-2xl transition-opacity duration-500"
        style={{
          background: makerTip > 0 ? "#2FBF71" : "#FF7A1A",
          opacity: makerTip > 0 ? 0.35 : 0.18,
        }}
      />

      {/* Crisp HTML Header Row */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-bold">
        <span className="text-white/60 uppercase tracking-wider text-[10px]">
          Shelf Price · <strong className="text-white tabular-nums">{formatMoney(price, currency)}</strong>
        </span>
        {makerTip > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-jejak-materials/20 border border-jejak-materials/45 px-2 py-0.5 text-[10px] font-extrabold text-jejak-materials tabular-nums">
            +{formatMoney(makerTip, currency)} direct boost active
          </span>
        ) : (
          <span className="text-[10px] font-bold text-white/45">
            Where every {currency === "SGD" ? "S$1" : "£1"} splits
          </span>
        )}
      </div>

      {/* Main Sankey Stage with Left/Right HTML callout overlays */}
      <div className="relative mt-2 grid grid-cols-[78px_1fr_108px] items-center gap-1">
        {/* Left: 100% Entry Node */}
        <div className="flex flex-col justify-center rounded-xl bg-white/8 border border-white/12 px-2.5 py-2.5">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
            You Pay
          </span>
          <span className="mt-0.5 text-sm font-extrabold text-white tabular-nums leading-tight">
            {formatMoney(price, currency)}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold text-white/45">
            100% total
          </span>
        </div>

        {/* Center: True Filled Sankey Ribbons + Traveling Coin Orbs */}
        <div className="relative h-[104px] w-full">
          <svg
            viewBox="0 0 300 108"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={`stuckGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFC24B" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#8B5CF6" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#FF3D81" stopOpacity="0.82" />
              </linearGradient>

              <linearGradient id={`makerGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFC24B" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#FF7A1A" stopOpacity="0.95" />
                <stop
                  offset="100%"
                  stopColor={makerTip > 0 ? "#2FBF71" : "#FF7A1A"}
                  stopOpacity="1"
                />
              </linearGradient>

              <linearGradient id={`shine-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Subtle background grid lines for fintech instrument feel */}
            <line x1="75" y1="8" x2="75" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />
            <line x1="150" y1="8" x2="150" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />
            <line x1="225" y1="8" x2="225" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />

            {/* Upper Ribbon: Intermediaries (Retail, Brand, Freight, Inputs) */}
            <motion.path
              d={stuckRibbon}
              fill={`url(#stuckGrad-${uid})`}
              initial={false}
              animate={{ d: stuckRibbon }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
            />

            {/* Lower Ribbon: Makers at Origin (widens smoothly on boost) */}
            <motion.path
              d={makerRibbon}
              fill={`url(#makerGrad-${uid})`}
              initial={false}
              animate={{ d: makerRibbon }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
            />

            {/* Crisp specular highlight along the maker stream */}
            <motion.path
              d={makerCenter}
              fill="none"
              stroke={`url(#shine-${uid})`}
              strokeWidth="1.5"
              initial={false}
              animate={{ d: makerCenter }}
            />

            {/* Hidden guide paths for smooth SMIL motion orbs */}
            <path id={`stuckTrack-${uid}`} d={stuckCenter} fill="none" stroke="none" />
            <path id={`makerTrack-${uid}`} d={makerCenter} fill="none" stroke="none" />

            {/* Traveling micro-pulses along Intermediary stream */}
            {[0, 0.9, 1.8].map((delay, i) => (
              <circle key={`s-${i}`} r="2.6" fill="#FFD1E3" opacity="0.75">
                <animateMotion
                  dur="2.7s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.4 0 0.2 1"
                >
                  <mpath href={`#stuckTrack-${uid}`} />
                </animateMotion>
              </circle>
            ))}

            {/* Glowing golden coin orbs traveling to Makers */}
            {[0, 0.7, 1.4].map((delay, i) => (
              <g key={`m-${i}`}>
                <circle
                  r={makerTip > 0 ? "5.5" : "4"}
                  fill={makerTip > 0 ? "#2FBF71" : "#FFC24B"}
                  opacity="0.35"
                >
                  <animateMotion
                    dur={makerTip > 0 ? "1.6s" : "2.2s"}
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  >
                    <mpath href={`#makerTrack-${uid}`} />
                  </animateMotion>
                </circle>
                <circle r={makerTip > 0 ? "3" : "2.4"} fill="#FFF9DB">
                  <animateMotion
                    dur={makerTip > 0 ? "1.6s" : "2.2s"}
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  >
                    <mpath href={`#makerTrack-${uid}`} />
                  </animateMotion>
                </circle>
              </g>
            ))}

            {/* Left entry cap bar */}
            <rect x="2" y={trunkTop} width="4" height={trunkH} rx="2" fill="#FFC24B" />
            {/* Right destination cap bars */}
            <rect
              x="294"
              y={stuckTop1}
              width="4"
              height={stuckBot1 - stuckTop1}
              rx="2"
              fill="#FF3D81"
            />
            <rect
              x="294"
              y={makerTop1}
              width="4"
              height={makerBot1 - makerTop1}
              rx="2"
              fill={makerTip > 0 ? "#2FBF71" : "#FF7A1A"}
            />
          </svg>
        </div>

        {/* Right: Two Crisp Destination Callout Cards */}
        <div className="flex flex-col justify-between gap-2 h-[104px]">
          {/* Intermediaries Card */}
          <div className="flex flex-col justify-center rounded-xl bg-[#FF3D81]/15 border border-[#FF3D81]/35 px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-[#FF9EBF]">
                Middlemen
              </span>
              <span className="text-[9px] font-extrabold text-[#FF9EBF] tabular-nums">
                {stuckPct}%
              </span>
            </div>
            <span className="text-xs font-extrabold text-white tabular-nums leading-tight">
              {formatMoney(stuckAmount, currency)}
            </span>
          </div>

          {/* Makers Card */}
          <motion.div
            animate={{
              scale: makerTip > 0 ? [1, 1.04, 1] : 1,
            }}
            transition={{ duration: 0.35 }}
            className={`flex flex-col justify-center rounded-xl px-2.5 py-1.5 border transition-colors ${
              makerTip > 0
                ? "bg-jejak-materials/25 border-jejak-materials"
                : "bg-jejak-labour/20 border-jejak-labour/50"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[8.5px] font-extrabold uppercase tracking-wider ${
                  makerTip > 0 ? "text-[#8EF6BA]" : "text-[#FFC49B]"
                }`}
              >
                {makerTip > 0 ? "Boosted" : "Makers"}
              </span>
              <span
                className={`text-[9px] font-extrabold tabular-nums ${
                  makerTip > 0 ? "text-[#8EF6BA]" : "text-[#FFC49B]"
                }`}
              >
                {effectiveMakerPct}%
              </span>
            </div>
            <span className="text-xs font-extrabold text-white tabular-nums leading-tight">
              {formatMoney(effectiveMaker, currency)}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
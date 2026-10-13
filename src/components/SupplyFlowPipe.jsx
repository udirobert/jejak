import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  labourAmount,
  makerTip = 0,
}) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const restAmount = Math.max(0, price - labourAmount);
  const effectiveMaker = labourAmount + makerTip;
  const totalOut = price + makerTip;
  const effectiveMakerPct = Math.min(
    60,
    +((effectiveMaker / totalOut) * 100).toFixed(1)
  );
  const restPct = +(100 - effectiveMakerPct).toFixed(1);

  // Geometry in a 300 x 104 coordinate space
  const x0 = 6;
  const x1 = 294;
  const trunkTop = 24;
  const trunkH = 56;

  // Proportional split at trunk (clamped so maker stream is always visible >= 6px)
  const makerH0 = Math.max(
    6,
    Math.min(36, (effectiveMakerPct / 100) * trunkH * 1.35)
  );
  const restH0 = trunkH - makerH0;
  const splitY0 = trunkTop + restH0;

  // Right destination heights
  const restTop1 = 10;
  const restBot1 = 10 + Math.max(22, restH0 * 0.88);

  const makerBot1 = 94;
  const makerTop1 = makerBot1 - Math.max(10, makerH0 * 1.25);

  const restRibbon = sankeyRibbonPath(
    x0,
    trunkTop,
    splitY0,
    x1,
    restTop1,
    restBot1
  );
  const makerRibbon = sankeyRibbonPath(
    x0,
    splitY0,
    trunkTop + trunkH,
    x1,
    makerTop1,
    makerBot1
  );

  const restCenter = centerCurvePath(
    x0,
    (trunkTop + splitY0) / 2,
    x1,
    (restTop1 + restBot1) / 2
  );
  const makerCenter = centerCurvePath(
    x0,
    (splitY0 + trunkTop + trunkH) / 2,
    x1,
    (makerTop1 + makerBot1) / 2
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 p-3 text-jejak-navy border border-jejak-navy/10 shadow-sm">
      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-extrabold">
        <span className="uppercase tracking-wider text-jejak-navy/55">
          Cost split ·{" "}
          <strong className="text-jejak-navy tabular-nums">
            {formatMoney(price, currency)}
          </strong>
        </span>
        <span className="text-jejak-navy/50">
          Materials, freight, brand & retail vs makers
        </span>
      </div>

      {/* Main Sankey Stage with Left/Right HTML callout overlays */}
      <div className="relative mt-1.5 grid grid-cols-[74px_1fr_112px] items-center gap-1.5">
        {/* Left: 100% Entry Node */}
        <div className="flex flex-col justify-center rounded-xl bg-jejak-navy/5 border border-jejak-navy/10 px-2.5 py-2">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-jejak-navy/55">
            Shelf price
          </span>
          <span className="mt-0.5 text-xs font-extrabold text-jejak-navy tabular-nums leading-tight">
            {formatMoney(price, currency)}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold text-jejak-navy/50">
            100% total
          </span>
        </div>

        {/* Center: Filled Sankey Ribbons */}
        <div className="relative h-[98px] w-full">
          <svg
            viewBox="0 0 300 104"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient
                id={`restGrad-${uid}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#2FBF71" stopOpacity="0.65" />
                <stop offset="45%" stopColor="#2D5BFF" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.72" />
              </linearGradient>

              <linearGradient
                id={`makerGrad-${uid}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#FFC24B" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FF7A1A" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Subtle background grid lines */}
            <line
              x1="100"
              y1="8"
              x2="100"
              y2="96"
              stroke="rgba(27,27,58,0.08)"
              strokeDasharray="2 3"
            />
            <line
              x1="200"
              y1="8"
              x2="200"
              y2="96"
              stroke="rgba(27,27,58,0.08)"
              strokeDasharray="2 3"
            />

            {/* Upper Ribbon: Everything else (Materials, Freight, Brand, Retail) */}
            <motion.path
              d={restRibbon}
              fill={`url(#restGrad-${uid})`}
              initial={false}
              animate={{ d: restRibbon }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 180, damping: 24 }
              }
            />

            {/* Lower Ribbon: Makers at Origin */}
            <motion.path
              d={makerRibbon}
              fill={`url(#makerGrad-${uid})`}
              initial={false}
              animate={{ d: makerRibbon }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 180, damping: 24 }
              }
            />

            {/* Hidden guide paths for motion orbs */}
            <path
              id={`restTrack-${uid}`}
              d={restCenter}
              fill="none"
              stroke="none"
            />
            <path
              id={`makerTrack-${uid}`}
              d={makerCenter}
              fill="none"
              stroke="none"
            />

            {!reduce && (
              <>
                {[0, 1.1].map((delay, i) => (
                  <circle
                    key={`r-${i}`}
                    r="2.4"
                    fill="#FFFFFF"
                    opacity="0.85"
                  >
                    <animateMotion
                      dur="2.6s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#restTrack-${uid}`} />
                    </animateMotion>
                  </circle>
                ))}
                {[0, 0.9].map((delay, i) => (
                  <circle
                    key={`m-${i}`}
                    r="2.8"
                    fill="#FFF3C4"
                    stroke="#E8921A"
                    strokeWidth="0.8"
                  >
                    <animateMotion
                      dur="2.1s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#makerTrack-${uid}`} />
                    </animateMotion>
                  </circle>
                ))}
              </>
            )}

            {/* Left entry cap bar */}
            <rect
              x="2"
              y={trunkTop}
              width="4"
              height={trunkH}
              rx="2"
              fill="#1B1B3A"
            />
            {/* Right destination cap bars */}
            <rect
              x="294"
              y={restTop1}
              width="4"
              height={restBot1 - restTop1}
              rx="2"
              fill="#8B5CF6"
            />
            <rect
              x="294"
              y={makerTop1}
              width="4"
              height={makerBot1 - makerTop1}
              rx="2"
              fill="#FF7A1A"
            />
          </svg>
        </div>

        {/* Right: Two Crisp Destination Callout Cards */}
        <div className="flex flex-col justify-between gap-1.5 h-[98px]">
          {/* Everything else Card */}
          <div className="flex flex-col justify-center rounded-xl bg-jejak-brand/10 border border-jejak-brand/25 px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-jejak-navy/75">
                Everything else
              </span>
              <span className="text-[9px] font-extrabold text-jejak-brand tabular-nums">
                {restPct}%
              </span>
            </div>
            <span className="text-xs font-extrabold text-jejak-navy tabular-nums leading-tight">
              {formatMoney(restAmount, currency)}
            </span>
          </div>

          {/* Makers Card */}
          <div className="flex flex-col justify-center rounded-xl bg-jejak-labour/12 border border-jejak-labour/35 px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-jejak-labour">
                Makers
              </span>
              <span className="text-[9px] font-extrabold text-jejak-labour tabular-nums">
                {effectiveMakerPct}%
              </span>
            </div>
            <span className="text-xs font-extrabold text-jejak-navy tabular-nums leading-tight">
              {formatMoney(effectiveMaker, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { ORIGIN_COORDS } from "@/components/explore/exploreUtils";
import { formatMoney } from "@/lib/money";
import { formatShortWalletAddress } from "@/components/JejakPassportSheet";
import { vibrate } from "@/lib/haptics";
import { Fingerprint, Check, Sliders } from "lucide-react";

const worldGeo = feature(worldTopo, worldTopo.objects.countries);
const W = 380;
const H = 196;

// Single merged Hero Card for Bank:
// - Left ~58% holds CURRENT ACCOUNT, balance, and Passport chip over a protective dark gradient scrim
// - Right ~42% holds the world map with all origins + visible destination marker (UK or SG)
// - Arcs curve cleanly into the visible destination marker without passing behind the left text
export default function BankMergedHeroCard({
  displayBalance,
  currency,
  market,
  withJejak,
  origins = ["Ethiopia", "Bangladesh", "Vietnam", "China"],
  countryCount = 6,
  walletSession,
  onOpenPassport,
  onTriggerSpendCap,
  isCompact = false,
  reduce = false,
}) {
  const homeCountry = market === "SG" ? "Singapore" : "United Kingdom";
  const destLabel = market === "SG" ? "SG" : "UK";

  // Centered on 55°E and shifted into the right half of the card so UK (-1°E)
  // sits at x ≈ 205, y ≈ 64 and China (113°E) sits at x ≈ 352, y ≈ 98 — keeping
  // all origins and both UK/SG destinations 100% visible in the right window.
  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .rotate([-55, 0])
        .scale(82)
        .translate([W * 0.72, H * 0.65]),
    []
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const landPaths = useMemo(
    () =>
      worldGeo.features.map((f, idx) => ({
        key: idx,
        d: pathGen(f),
        isActive: origins.includes(f.properties.name),
        isHome: f.properties.name === homeCountry,
      })),
    [pathGen, origins, homeCountry]
  );

  const homeXY = useMemo(() => {
    const coords =
      ORIGIN_COORDS[homeCountry] || ORIGIN_COORDS["United Kingdom"];
    const raw = projection(coords) || [W * 0.56, H * 0.34];
    return [
      Math.max(W * 0.53, Math.min(W - 24, raw[0])),
      Math.max(46, Math.min(H - 36, raw[1])),
    ];
  }, [projection, homeCountry]);

  const arcs = useMemo(
    () =>
      origins
        .map((orig) => {
          const coords = ORIGIN_COORDS[orig];
          if (!coords) return null;
          const xy = projection(coords);
          if (!xy) return null;
          const sx = Math.max(W * 0.56, Math.min(W - 18, xy[0]));
          const sy = Math.max(44, Math.min(H - 30, xy[1]));
          const [ex, ey] = homeXY;
          // Keep control point strictly in the right half so arcs never cross behind left text
          const cx = Math.max(W * 0.55, (sx + ex) / 2);
          const cy = Math.max(28, Math.min(sy, ey) - 22);
          return {
            origin: orig,
            sx,
            sy,
            ex,
            ey,
            d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
          };
        })
        .filter(Boolean),
    [origins, projection, homeXY]
  );

  const shortAddr = formatShortWalletAddress(walletSession?.address);

  return (
    <motion.div
      animate={{
        height: isCompact ? 116 : 196,
      }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 340, damping: 32 }
      }
      className="relative w-full overflow-hidden rounded-3xl bg-[#0E213B] border border-slate-800/40 shadow-md text-white select-none"
    >
      {/* World map background shifted to the right with protective left scrim */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bankHeroArc" x1="100%" y1="50%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFC24B" />
            <stop offset="55%" stopColor="#FF8A65" />
            <stop offset="100%" stopColor="#2FBF71" />
          </linearGradient>
          {/* Strong left scrim protecting CURRENT ACCOUNT & balance in the left ~58% */}
          <linearGradient id="bankLeftScrim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0D1F38" stopOpacity="0.98" />
            <stop offset="46%" stopColor="#0D1F38" stopOpacity="0.94" />
            <stop offset="62%" stopColor="#0D1F38" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0D1F38" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Continents */}
        {landPaths.map((c) => (
          <path
            key={c.key}
            d={c.d}
            fill={
              withJejak && c.isHome
                ? "#2FBF71"
                : withJejak && c.isActive
                ? "#FF9F5A"
                : "#244772"
            }
            fillOpacity={
              withJejak && (c.isActive || c.isHome) ? 0.62 : 0.38
            }
            stroke="#366296"
            strokeWidth="0.4"
          />
        ))}

        {/* Left gradient scrim */}
        <rect width={W} height={H} fill="url(#bankLeftScrim)" />

        {/* Route arcs & visible destination marker in the right half */}
        <AnimatePresence>
          {withJejak && (
            <motion.g
              key={`hero-arcs-${market}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.28 }}
            >
              {arcs.map((arc, idx) => (
                <g key={arc.origin}>
                  <motion.path
                    d={arc.d}
                    fill="none"
                    stroke="url(#bankHeroArc)"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: reduce ? 0 : 0.65,
                      delay: reduce ? 0 : idx * 0.08,
                      ease: "easeOut",
                    }}
                  />
                  <circle
                    cx={arc.sx}
                    cy={arc.sy}
                    r="3.2"
                    fill="#FFC24B"
                    stroke="#FFFFFF"
                    strokeWidth="1.1"
                  />
                </g>
              ))}

              {/* Visible destination marker (UK or SG) */}
              <g transform={`translate(${homeXY[0]}, ${homeXY[1]})`}>
                {!reduce && (
                  <circle r="8" fill="#2FBF71" opacity="0.35">
                    <animate
                      attributeName="r"
                      values="5;10;5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.45;0.1;0.45"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  r="4.5"
                  fill="#2FBF71"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <rect
                  x="-11"
                  y="-19"
                  width="22"
                  height="12"
                  rx="6"
                  fill="#0D1F38"
                  stroke="#2FBF71"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="-10.5"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="7.5"
                  fontWeight="800"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {destLabel}
                </text>
              </g>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Overlaid Foreground Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="max-w-[60%]">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">
              Current account
            </p>
            <p
              className={`mt-0.5 font-extrabold tracking-tight text-white tabular-nums transition-all ${
                isCompact ? "text-2xl" : "text-3xl"
              }`}
            >
              {formatMoney(displayBalance, currency)}
            </p>
          </div>

          {/* Single "6 countries" chip on the map */}
          <AnimatePresence>
            {withJejak && (
              <motion.span
                key="countries-chip"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: reduce ? 0 : 0.22 }}
                className="shrink-0 rounded-full bg-[#0D1F38]/85 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[11px] font-extrabold text-amber-300 shadow-sm"
              >
                {countryCount} countries
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom row: Slim Passport chip + Just-in-Time Spend Limit trigger */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              onOpenPassport();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 px-3 py-1.5 text-xs font-extrabold text-white transition-colors no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {walletSession ? (
              <>
                <span className="font-mono text-[11px] text-amber-300">
                  {shortAddr}
                </span>
                <Check size={13} className="text-emerald-400" strokeWidth={3} />
              </>
            ) : (
              <>
                <Fingerprint size={14} className="text-amber-300" />
                <span>Passport · Set up</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              vibrate(5);
              onTriggerSpendCap();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-[#0D1F38]/80 hover:bg-[#0D1F38] backdrop-blur-md border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/90 transition-colors no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Sliders size={11} className="text-amber-300" />
            <span>
              {walletSession?.spendingLimit?.dailyCapAmount
                ? `Limit ${formatMoney(
                    walletSession.spendingLimit.dailyCapAmount,
                    currency
                  )}/d`
                : "Set limit"}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
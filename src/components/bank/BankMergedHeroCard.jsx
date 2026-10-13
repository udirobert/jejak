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
const H = 185;

// Single merged Hero Card for Bank:
// - Dimmed world map is the card background with animated route arcs (when With Jejak is on)
// - Balance is overlaid on top
// - "6 countries" is a single pill chip on the map (no separate flags row or caption)
// - Slim Passport chip sits directly under the balance ("Passport · Set up" or "G…XXXX ✓")
// - Shrinks smoothly when the transactions sheet rises to full height
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

  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .rotate([-50, 0])
        .scale(84)
        .translate([W * 0.48, H * 0.58]),
    []
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const landPaths = useMemo(
    () =>
      worldGeo.features.map((f, idx) => ({
        key: idx,
        d: pathGen(f),
        isActive: origins.includes(f.properties.name),
      })),
    [pathGen, origins]
  );

  const homeXY = useMemo(() => {
    const coords =
      ORIGIN_COORDS[homeCountry] || ORIGIN_COORDS["United Kingdom"];
    return projection(coords) || [W * 0.24, H * 0.28];
  }, [projection, homeCountry]);

  const arcs = useMemo(
    () =>
      origins
        .map((orig) => {
          const coords = ORIGIN_COORDS[orig];
          if (!coords) return null;
          const xy = projection(coords);
          if (!xy) return null;
          const [sx, sy] = xy;
          const [ex, ey] = homeXY;
          const cx = (sx + ex) / 2;
          const cy = Math.min(sy, ey) - 26;
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
        height: isCompact ? 116 : 178,
      }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 340, damping: 32 }
      }
      className="relative w-full overflow-hidden rounded-3xl bg-[#122847] border border-slate-800/40 shadow-md text-white select-none"
    >
      {/* Dimmed world map background */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bankHeroArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFC24B" />
            <stop offset="55%" stopColor="#FF8A65" />
            <stop offset="100%" stopColor="#2FBF71" />
          </linearGradient>
          <radialGradient id="bankMapVignette" cx="30%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#0E213B" stopOpacity="0.68" />
            <stop offset="65%" stopColor="#0E213B" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0B1A30" stopOpacity="0.78" />
          </radialGradient>
        </defs>

        {/* Continents */}
        {landPaths.map((c) => (
          <path
            key={c.key}
            d={c.d}
            fill={withJejak && c.isActive ? "#FF9F5A" : "#244772"}
            fillOpacity={withJejak && c.isActive ? 0.58 : 0.42}
            stroke="#366296"
            strokeWidth="0.35"
          />
        ))}

        {/* Route arcs fade in/out smoothly when With Jejak is toggled */}
        <AnimatePresence>
          {withJejak && (
            <motion.g
              key="hero-arcs"
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
                    strokeWidth="2"
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
                    strokeWidth="1"
                  />
                </g>
              ))}

              <g transform={`translate(${homeXY[0]}, ${homeXY[1]})`}>
                <circle
                  r="4.2"
                  fill="#2FBF71"
                  stroke="#FFFFFF"
                  strokeWidth="1.4"
                />
              </g>
            </motion.g>
          )}
        </AnimatePresence>

        {/* Soft dark scrim so overlaid balance is crisp */}
        <rect width={W} height={H} fill="url(#bankMapVignette)" />
      </svg>

      {/* Overlaid Foreground Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/65">
              Current account ·{" "}
              {market === "SG" ? "Demo SG · 000-000" : "Demo UK · 00-00-00"}
            </p>
            <p
              className={`mt-0.5 font-extrabold tracking-tight text-white tabular-nums transition-all ${
                isCompact ? "text-2xl" : "text-3xl"
              }`}
            >
              {formatMoney(displayBalance, currency)}
            </p>
          </div>

          {/* Single "6 countries" chip on the map (fades with toggle) */}
          <AnimatePresence>
            {withJejak && (
              <motion.span
                key="countries-chip"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: reduce ? 0 : 0.22 }}
                className="shrink-0 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[11px] font-extrabold text-amber-300"
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

          {/* Action that requires a wallet: opens Passport sheet just-in-time if not set up */}
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              onTriggerSpendCap();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-black/25 hover:bg-black/35 backdrop-blur-md border border-white/15 px-2.5 py-1 text-[11px] font-bold text-white/85 transition-colors no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
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
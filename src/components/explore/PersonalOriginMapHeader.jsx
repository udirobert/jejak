import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { ORIGIN_COORDS } from "./exploreUtils";
import OriginFlagChip from "./OriginFlagChip";

const worldGeo = feature(worldTopo, worldTopo.objects.countries);

const W = 356;
const H = 112;

export default function PersonalOriginMapHeader({
  origins = ["Ethiopia", "Bangladesh", "Vietnam", "China"],
  allCountries = [
    "Ethiopia",
    "Bangladesh",
    "Vietnam",
    "China",
    "India",
    "Netherlands",
  ],
  homeCountry = "United Kingdom",
  reduce = false,
}) {
  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .rotate([-52, 0])
        .scale(74)
        .translate([W * 0.44, H * 0.6]),
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
    return projection(coords) || [W * 0.22, H * 0.25];
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
          const cy = Math.min(sy, ey) - 24;
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

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5"
    >
      {/* Compact personal origin-arc map */}
      <div className="relative h-[108px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#16365C] via-[#132C4E] to-[#1A2D54] border border-slate-200/60 shadow-inner">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-label="Personal map showing this week's origins converging toward you"
        >
          <defs>
            <linearGradient id="personalArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFC24B" />
              <stop offset="55%" stopColor="#FF8A65" />
              <stop offset="100%" stopColor="#2FBF71" />
            </linearGradient>
          </defs>

          {/* Continents */}
          {landPaths.map((c) => (
            <path
              key={c.key}
              d={c.d}
              fill={c.isActive ? "#FF9F5A" : "#274E7B"}
              fillOpacity={c.isActive ? 0.85 : 0.75}
              stroke="#3D6B9E"
              strokeWidth="0.35"
            />
          ))}

          {/* Converging arcs from each origin to the user */}
          {arcs.map((arc, idx) => (
            <g key={arc.origin}>
              <motion.path
                d={arc.d}
                fill="none"
                stroke="url(#personalArcGrad)"
                strokeWidth="1.9"
                strokeLinecap="round"
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: reduce ? 0 : 0.75,
                  delay: reduce ? 0 : idx * 0.1,
                  ease: "easeOut",
                }}
              />
              <circle
                cx={arc.sx}
                cy={arc.sy}
                r="3.4"
                fill="#FFC24B"
                stroke="#FFFFFF"
                strokeWidth="1.1"
              />
            </g>
          ))}

          {/* User destination node */}
          <g transform={`translate(${homeXY[0]}, ${homeXY[1]})`}>
            {!reduce && (
              <circle r="8" fill="#2FBF71" opacity="0.35">
                <animate
                  attributeName="r"
                  values="5;11;5"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.45;0.08;0.45"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <circle
              r="4.2"
              fill="#2FBF71"
              stroke="#FFFFFF"
              strokeWidth="1.4"
            />
          </g>
        </svg>

        {/* Subtle overlay caption */}
        <div className="pointer-events-none absolute bottom-2 left-2.5 rounded-full bg-[#0F2442]/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-extrabold text-white/90 border border-white/15">
          This week’s origins → {homeCountry === "Singapore" ? "SG" : "UK"}
        </div>
      </div>

      {/* Animated row of crisp vector flag chips */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-slate-500">
          {allCountries.length} supply-chain countries
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {allCountries.map((country, idx) => (
            <motion.span
              key={country}
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.2,
                delay: reduce ? 0 : 0.12 + idx * 0.05,
              }}
            >
              <OriginFlagChip country={country} size="xs" />
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
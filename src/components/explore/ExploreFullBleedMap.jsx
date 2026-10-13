import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { Info } from "lucide-react";
import { FLAGS, ORIGIN_COORDS } from "./exploreUtils";
import { vibrate } from "@/lib/haptics";

const worldGeo = feature(worldTopo, worldTopo.objects.countries);

const W = 420;
const H = 560;
const CLUSTER_RADIUS_PX = 38;

const CATEGORY_ACCENTS = [
  "#FFC24B", // gold
  "#FF7A1A", // labour orange
  "#2FBF71", // materials green
  "#2D5BFF", // freight blue
  "#FF3D81", // retail magenta
];

export default function ExploreFullBleedMap({
  originChips,
  originFilter,
  onSelectOrigin,
  onOpenInfo,
  arcOrigin,
  reduce,
}) {
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  const [graticuleOffset, setGraticuleOffset] = useState(0);

  // Subtle animated graticule drift (respects prefers-reduced-motion)
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setGraticuleOffset((d) => (d + 0.5) % 24);
    }, 90);
    return () => clearInterval(id);
  }, [reduce]);

  // Collapse expanded cluster when originFilter resets to All
  useEffect(() => {
    if (originFilter === "All") {
      // keep cluster open if user just expanded it, otherwise no-op
    }
  }, [originFilter]);

  const tracedSet = useMemo(
    () => new Set(originChips.map((c) => c.origin)),
    [originChips]
  );

  // Center the projection on the Afro-Eurasian origin belt where traces cluster,
  // while showing the surrounding world ocean & continents full-bleed.
  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .rotate([-65, 0])
        .scale(138)
        .translate([W * 0.46, H * 0.41]),
    []
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);
  const graticulePath = useMemo(() => pathGen(geoGraticule10()), [pathGen]);

  const countries = useMemo(
    () =>
      worldGeo.features.map((f, idx) => {
        const name = f.properties.name;
        const isTraced = tracedSet.has(name);
        const isSelected = originFilter !== "All" && originFilter === name;
        return {
          key: idx,
          d: pathGen(f),
          name,
          isTraced,
          isSelected,
        };
      }),
    [pathGen, tracedSet, originFilter]
  );

  // Raw projected pins for each origin country
  const rawPins = useMemo(
    () =>
      originChips
        .map((chip, idx) => {
          const coords = ORIGIN_COORDS[chip.origin];
          if (!coords) return null;
          const xy = projection(coords);
          if (!xy) return null;
          return {
            ...chip,
            x: xy[0],
            y: xy[1],
            color: CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length],
            active: originFilter === chip.origin,
          };
        })
        .filter(Boolean),
    [originChips, projection, originFilter]
  );

  // Group nearby dots within CLUSTER_RADIUS_PX into clusters
  const clusters = useMemo(() => {
    const groups = [];
    const visited = new Set();

    for (let i = 0; i < rawPins.length; i++) {
      if (visited.has(i)) continue;
      const seed = rawPins[i];
      const members = [seed];
      visited.add(i);

      for (let j = i + 1; j < rawPins.length; j++) {
        if (visited.has(j)) continue;
        const cand = rawPins[j];
        const dist = Math.hypot(cand.x - seed.x, cand.y - seed.y);
        if (dist <= CLUSTER_RADIUS_PX) {
          members.push(cand);
          visited.add(j);
        }
      }

      const cx =
        members.reduce((sum, m) => sum + m.x, 0) / members.length;
      const cy =
        members.reduce((sum, m) => sum + m.y, 0) / members.length;
      const id = members.map((m) => m.origin).join("|");
      const totalCount = members.reduce((sum, m) => sum + m.total, 0);

      groups.push({
        id,
        cx,
        cy,
        members,
        totalCount,
      });
    }
    return groups;
  }, [rawPins]);

  // Compute animated arrival arc from origin dot into the bottom sheet
  const activeArc = useMemo(() => {
    if (!arcOrigin) return null;
    const pin = rawPins.find((p) => p.origin === arcOrigin);
    if (!pin) return null;
    const startX = pin.x;
    const startY = pin.y;
    const endX = W * 0.5;
    const endY = H * 0.72;
    const ctrlX = (startX + endX) / 2 + (startX < endX ? -35 : 35);
    const ctrlY = Math.min(startY, endY) - 68;
    return {
      d: `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`,
      startX,
      startY,
      endX,
      endY,
    };
  }, [arcOrigin, rawPins]);

  return (
    <div className="absolute inset-0 overflow-hidden select-none">
      {/* Full-bleed high-contrast SVG map */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-label="Interactive world map of product origins"
        onClick={() => {
          if (expandedClusterId) setExpandedClusterId(null);
        }}
      >
        <defs>
          {/* Rich ocean gradient */}
          <radialGradient id="richOceanBg" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#172A5A" />
            <stop offset="55%" stopColor="#0F1C3F" />
            <stop offset="100%" stopColor="#091024" />
          </radialGradient>

          {/* Warm sunrise glow for traced origin land */}
          <linearGradient id="tracedLandFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8A65" />
            <stop offset="55%" stopColor="#FFC24B" />
            <stop offset="100%" stopColor="#FF3D81" />
          </linearGradient>

          {/* Selected origin land highlight */}
          <linearGradient id="selectedLandFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC24B" />
            <stop offset="100%" stopColor="#2FBF71" />
          </linearGradient>

          {/* Glow filter for origin dots and arcs */}
          <filter id="originGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rich ocean backdrop */}
        <rect x="0" y="0" width={W} height={H} fill="url(#richOceanBg)" />

        {/* Subtle animated graticule */}
        <path
          d={graticulePath}
          fill="none"
          stroke="#4F6EC9"
          strokeWidth="0.55"
          strokeDasharray="4 6"
          strokeDashoffset={graticuleOffset}
          opacity="0.28"
        />

        {/* Saturated land masses + glowing origin countries */}
        {countries.map((c) => (
          <path
            key={c.key}
            d={c.d}
            fill={
              c.isSelected
                ? "url(#selectedLandFill)"
                : c.isTraced
                ? "url(#tracedLandFill)"
                : "#243560"
            }
            fillOpacity={c.isSelected ? 0.95 : c.isTraced ? 0.78 : 0.88}
            stroke={
              c.isSelected
                ? "#FFFFFF"
                : c.isTraced
                ? "#FFE49E"
                : "#395089"
            }
            strokeWidth={c.isSelected ? 1.2 : c.isTraced ? 0.85 : 0.45}
            onClick={(e) => {
              if (!c.isTraced) return;
              e.stopPropagation();
              vibrate(5);
              onSelectOrigin(originFilter === c.name ? "All" : c.name);
            }}
            style={{ cursor: c.isTraced ? "pointer" : "default" }}
          />
        ))}

        {/* Animated arrival arc from origin dot into the bottom sheet */}
        {activeArc && (
          <g>
            <path
              d={activeArc.d}
              fill="none"
              stroke="#FFC24B"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.35"
              filter="url(#originGlow)"
            />
            <motion.path
              key={arcOrigin}
              d={activeArc.d}
              fill="none"
              stroke="#FFC24B"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={reduce ? { pathLength: 1 } : { pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: [1, 1, 0.3] }}
              transition={{ duration: reduce ? 0 : 1.15, ease: "easeOut" }}
            />
            {!reduce && (
              <circle r="5" fill="#FFC24B" filter="url(#originGlow)">
                <animateMotion
                  dur="1.1s"
                  repeatCount="2"
                  path={activeArc.d}
                />
              </circle>
            )}
          </g>
        )}

        {/* Origin dots and expandable clusters */}
        {clusters.map((cluster) => {
          const isSingle = cluster.members.length === 1;
          const isExpanded =
            !isSingle &&
            (expandedClusterId === cluster.id ||
              cluster.members.some((m) => m.origin === originFilter));

          if (!isSingle && !isExpanded) {
            // Clustered bubble with count that expands on tap
            return (
              <g
                key={cluster.id}
                transform={`translate(${cluster.cx}, ${cluster.cy})`}
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(6);
                  setExpandedClusterId(cluster.id);
                }}
                style={{ cursor: "pointer" }}
              >
                {!reduce && (
                  <circle r="18" fill="#FFC24B" opacity="0.25">
                    <animate
                      attributeName="r"
                      values="13;24;13"
                      dur="2.1s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.45;0.05;0.45"
                      dur="2.1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  r="13"
                  fill="#1B1B3A"
                  stroke="#FFC24B"
                  strokeWidth="2.2"
                  filter="url(#originGlow)"
                />
                <text
                  y="3.8"
                  textAnchor="middle"
                  fill="#FFC24B"
                  fontSize="10.5"
                  fontWeight="900"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {cluster.members.length}
                </text>
                <g transform="translate(0, -19)">
                  <rect
                    x="-28"
                    y="-8"
                    width="56"
                    height="13"
                    rx="6.5"
                    fill="rgba(27,27,58,0.88)"
                    stroke="rgba(255,194,75,0.5)"
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="7.5"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {cluster.members.length} origins
                  </text>
                </g>
              </g>
            );
          }

          // Render individual pulsing origin dots (fanned out if part of an expanded cluster)
          return (
            <g key={cluster.id}>
              {cluster.members.map((pin, idx) => {
                const count = cluster.members.length;
                const angle =
                  count > 1
                    ? -Math.PI / 2 + (idx * 2 * Math.PI) / count
                    : 0;
                const fanRadius = count > 1 ? 28 : 0;
                const px =
                  count > 1
                    ? cluster.cx + Math.cos(angle) * fanRadius
                    : pin.x;
                const py =
                  count > 1
                    ? cluster.cy + Math.sin(angle) * fanRadius
                    : pin.y;

                return (
                  <g key={pin.origin}>
                    {/* Leader line from true origin to fanned dot */}
                    {count > 1 && (
                      <line
                        x1={pin.x}
                        y1={pin.y}
                        x2={px}
                        y2={py}
                        stroke="#FFC24B"
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                        opacity="0.75"
                      />
                    )}
                    <g
                      transform={`translate(${px}, ${py})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        vibrate(6);
                        onSelectOrigin(
                          originFilter === pin.origin ? "All" : pin.origin
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Pulsing halo */}
                      {!reduce && (
                        <circle
                          r={pin.active ? 18 : 13}
                          fill={pin.active ? "#2FBF71" : pin.color}
                          opacity="0.3"
                        >
                          <animate
                            attributeName="r"
                            values={pin.active ? "10;22;10" : "7;16;7"}
                            dur="1.9s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.5;0.06;0.5"
                            dur="1.9s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Core glowing dot */}
                      <circle
                        r={pin.active ? 9 : 6.5}
                        fill={pin.active ? "#2FBF71" : pin.color}
                        stroke="#FFFFFF"
                        strokeWidth={pin.active ? 2.4 : 1.8}
                        filter="url(#originGlow)"
                      />

                      {/* Country label pill */}
                      <g transform="translate(0, -14)">
                        <rect
                          x="-30"
                          y="-9"
                          width="60"
                          height="14"
                          rx="7"
                          fill={
                            pin.active
                              ? "#2FBF71"
                              : "rgba(15, 23, 42, 0.86)"
                          }
                          stroke={
                            pin.active
                              ? "#FFFFFF"
                              : "rgba(255, 255, 255, 0.28)"
                          }
                          strokeWidth="0.8"
                        />
                        <text
                          x="0"
                          y="0.5"
                          textAnchor="middle"
                          fill={pin.active ? "#0B132B" : "#FFFFFF"}
                          fontSize="7.8"
                          fontWeight="800"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          {FLAGS[pin.origin] || "🌐"} {pin.origin.slice(0, 8)}
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Top Overlay Controls: Community Live chip + Single Info Icon chip + Edge-Faded Scrollable Filter Strip */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-20 px-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-jejak-navy/75 backdrop-blur-md border border-white/20 px-3 py-1 shadow-md">
            <span
              className={`h-2 w-2 rounded-full bg-jejak-materials ${
                reduce ? "" : "animate-pulse"
              }`}
            />
            <span className="text-xs font-extrabold tracking-tight text-white">
              Community Map
            </span>
            <span className="text-[10px] font-bold text-amber-300 tabular-nums">
              {originChips.length} origins
            </span>
          </div>

          {/* Single clean info icon chip (fixed double icon) */}
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              onOpenInfo();
            }}
            aria-label="Community privacy information"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-jejak-navy/75 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md hover:bg-jejak-navy no-tap"
          >
            <Info size={13} className="text-amber-300" />
            <span>Privacy</span>
          </button>
        </div>

        {/* Scrollable filter pills with visible right-edge fade */}
        <div
          className="pointer-events-auto relative flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 pr-8"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, black 82%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, black 82%, transparent 100%)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              onSelectOrigin("All");
            }}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold transition-colors no-tap border ${
              originFilter === "All"
                ? "bg-jejak-gold text-jejak-navy border-white shadow-sm"
                : "bg-jejak-navy/70 text-white/85 border-white/15 backdrop-blur-md hover:bg-jejak-navy"
            }`}
          >
            All origins
          </button>

          {originChips.map((chip) => {
            const active = originFilter === chip.origin;
            return (
              <button
                key={chip.origin}
                type="button"
                onClick={() => {
                  vibrate(5);
                  onSelectOrigin(active ? "All" : chip.origin);
                }}
                className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-colors no-tap border ${
                  active
                    ? "bg-jejak-gold text-jejak-navy border-white shadow-sm"
                    : "bg-jejak-navy/70 text-white/85 border-white/15 backdrop-blur-md hover:bg-jejak-navy"
                }`}
              >
                <span>{FLAGS[chip.origin] || "🌐"}</span>
                <span>{chip.origin}</span>
                {chip.real > 0 && (
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      active ? "text-jejak-navy" : "text-amber-300"
                    }`}
                  >
                    {chip.real}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
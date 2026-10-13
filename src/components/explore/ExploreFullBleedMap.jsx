import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { Info, RotateCcw } from "lucide-react";
import { ORIGIN_COORDS } from "./exploreUtils";
import { MapSvgFlag } from "./OriginFlagChip";
import { vibrate } from "@/lib/haptics";

const worldGeo = feature(worldTopo, worldTopo.objects.countries);

const W = 420;
const H = 780;
const CLUSTER_RADIUS_PX = 36;

const CATEGORY_ACCENTS = [
  "#FFC24B", // gold
  "#FF7A1A", // labour orange
  "#2FBF71", // materials green
  "#38BDF8", // bright sky-teal
  "#FF3D81", // retail magenta
];

export default function ExploreFullBleedMap({
  originChips,
  originFilter,
  onSelectOrigin,
  onEmptyMapTap,
  onOpenInfo,
  arcOrigin,
  reduce,
}) {
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  const [hoveredOrigin, setHoveredOrigin] = useState(null);
  const [graticuleOffset, setGraticuleOffset] = useState(0);

  // Subtle animated graticule drift (respects prefers-reduced-motion)
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setGraticuleOffset((d) => (d + 0.5) % 24);
    }, 90);
    return () => clearInterval(id);
  }, [reduce]);

  const tracedSet = useMemo(
    () => new Set(originChips.map((c) => c.origin)),
    [originChips]
  );

  // Total live (non-sample) traces across all origins
  const liveCount = useMemo(
    () => originChips.reduce((sum, c) => sum + (c.real || 0), 0),
    [originChips]
  );

  // Center the projection on the Afro-Eurasian origin belt so the map is the hero on load
  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .rotate([-65, 0])
        .scale(152)
        .translate([W * 0.46, H * 0.43]),
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

      groups.push({
        id,
        cx,
        cy,
        members,
      });
    }
    return groups;
  }, [rawPins]);

  // Compute animated arrival arc from origin dot into the bottom peek/sheet
  const activeArc = useMemo(() => {
    if (!arcOrigin) return null;
    const pin = rawPins.find((p) => p.origin === arcOrigin);
    if (!pin) return null;
    const startX = pin.x;
    const startY = pin.y;
    const endX = W * 0.5;
    const endY = H * 0.82;
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

  const handleBackgroundClick = () => {
    if (expandedClusterId) setExpandedClusterId(null);
    if (onEmptyMapTap) onEmptyMapTap();
  };

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden select-none">
      {/* Full-bleed rich indigo/teal ocean SVG map */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full block"
        aria-label="Interactive world map of product origins"
        onClick={handleBackgroundClick}
      >
        <defs>
          {/* Deep, rich indigo/teal ocean gradient (fills full height behind sheet & tab bar) */}
          <radialGradient id="richOceanBg" cx="48%" cy="40%" r="78%">
            <stop offset="0%" stopColor="#1B4D7E" />
            <stop offset="55%" stopColor="#153963" />
            <stop offset="100%" stopColor="#162B4E" />
          </radialGradient>

          {/* Warm sunrise glow for traced origin land */}
          <linearGradient id="tracedLandFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8A65" />
            <stop offset="55%" stopColor="#FFC24B" />
            <stop offset="100%" stopColor="#FF5E7E" />
          </linearGradient>

          {/* Selected origin land highlight */}
          <linearGradient id="selectedLandFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC24B" />
            <stop offset="100%" stopColor="#2FBF71" />
          </linearGradient>

          {/* Soft glow filter for origin dots and arcs */}
          <filter id="originGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rich indigo/teal ocean backdrop */}
        <rect x="0" y="0" width={W} height={H} fill="url(#richOceanBg)" />

        {/* Subtle animated graticule */}
        <path
          d={graticulePath}
          fill="none"
          stroke="#6395CC"
          strokeWidth="0.55"
          strokeDasharray="4 6"
          strokeDashoffset={graticuleOffset}
          opacity="0.3"
        />

        {/* Vivid saturated land masses + glowing origin countries */}
        {countries.map((c) => (
          <path
            key={c.key}
            d={c.d}
            fill={
              c.isSelected
                ? "url(#selectedLandFill)"
                : c.isTraced
                ? "url(#tracedLandFill)"
                : "#265584"
            }
            fillOpacity={c.isSelected ? 0.96 : c.isTraced ? 0.82 : 0.9}
            stroke={
              c.isSelected
                ? "#FFFFFF"
                : c.isTraced
                ? "#FFE49E"
                : "#467EB5"
            }
            strokeWidth={c.isSelected ? 1.25 : c.isTraced ? 0.9 : 0.5}
            onClick={(e) => {
              if (!c.isTraced) return;
              e.stopPropagation();
              vibrate(5);
              onSelectOrigin(c.name);
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
              animate={{ pathLength: 1, opacity: [1, 1, 0.35] }}
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
                  <circle r="18" fill="#FFC24B" opacity="0.28">
                    <animate
                      attributeName="r"
                      values="13;23;13"
                      dur="2.1s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.45;0.06;0.45"
                      dur="2.1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  r="13"
                  fill="#173861"
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
              </g>
            );
          }

          return (
            <g key={cluster.id}>
              {cluster.members.map((pin, idx) => {
                const count = cluster.members.length;
                const angle =
                  count > 1
                    ? -Math.PI / 2 + (idx * 2 * Math.PI) / count
                    : 0;
                const fanRadius = count > 1 ? 30 : 0;
                const px =
                  count > 1
                    ? cluster.cx + Math.cos(angle) * fanRadius
                    : pin.x;
                const py =
                  count > 1
                    ? cluster.cy + Math.sin(angle) * fanRadius
                    : pin.y;

                const showFullLabel =
                  pin.active || hoveredOrigin === pin.origin;
                const pillW = Math.max(76, pin.origin.length * 6.4 + 34);
                const halfW = pillW / 2;
                const clampedX = Math.max(
                  halfW + 10,
                  Math.min(W - halfW - 10, px)
                );
                const labelShiftX = clampedX - px;

                return (
                  <g key={pin.origin}>
                    {count > 1 && (
                      <line
                        x1={pin.x}
                        y1={pin.y}
                        x2={px}
                        y2={py}
                        stroke="#FFC24B"
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                        opacity="0.8"
                      />
                    )}
                    <g
                      transform={`translate(${px}, ${py})`}
                      onMouseEnter={() => setHoveredOrigin(pin.origin)}
                      onMouseLeave={() => setHoveredOrigin(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        vibrate(6);
                        onSelectOrigin(pin.origin);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Soft glowing halo */}
                      {!reduce && (
                        <circle
                          r={pin.active ? 18 : 13}
                          fill={pin.active ? "#2FBF71" : pin.color}
                          opacity="0.32"
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
                        r={pin.active ? 8.5 : 6.5}
                        fill={pin.active ? "#2FBF71" : pin.color}
                        stroke="#FFFFFF"
                        strokeWidth={pin.active ? 2.4 : 1.8}
                        filter="url(#originGlow)"
                      />

                      {/* Flag only until selected/hovered; full unclamped label when selected/hovered */}
                      {showFullLabel ? (
                        <g transform={`translate(${labelShiftX}, -16)`}>
                          <rect
                            x={-halfW}
                            y="-9"
                            width={pillW}
                            height="18"
                            rx="9"
                            fill={
                              pin.active
                                ? "#2FBF71"
                                : "rgba(19, 44, 78, 0.94)"
                            }
                            stroke="#FFFFFF"
                            strokeWidth="1"
                          />
                          <MapSvgFlag
                            country={pin.origin}
                            x={-halfW + 13}
                            y={0}
                            width={14}
                            height={10}
                          />
                          <text
                            x="7"
                            y="3"
                            textAnchor="middle"
                            fill={pin.active ? "#0F2440" : "#FFFFFF"}
                            fontSize="8.8"
                            fontWeight="800"
                            fontFamily="Plus Jakarta Sans, sans-serif"
                          >
                            {pin.origin}
                          </text>
                        </g>
                      ) : (
                        <g transform="translate(0, -14)">
                          <MapSvgFlag
                            country={pin.origin}
                            x={0}
                            y={0}
                            width={16}
                            height={11}
                          />
                        </g>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Top Overlay Bar: Map dots ARE the filter — compact "All" reset chip + Privacy ⓘ */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-20 px-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#122D4F]/80 backdrop-blur-md border border-white/25 px-3 py-1 shadow-md">
              <span
                className={`h-2 w-2 rounded-full bg-jejak-materials ${
                  reduce ? "" : "animate-pulse"
                }`}
              />
              <span className="text-xs font-extrabold tracking-tight text-white">
                {originFilter === "All"
                  ? `${originChips.length} origins`
                  : originFilter}
              </span>
              {liveCount > 0 && (
                <span className="text-[10px] font-bold text-amber-300 tabular-nums">
                  · {liveCount} live
                </span>
              )}
            </div>

            {originFilter !== "All" && (
              <button
                type="button"
                onClick={() => {
                  vibrate(5);
                  onSelectOrigin("All");
                }}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-jejak-gold px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy border border-white shadow-md hover:brightness-105 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <RotateCcw size={11} /> All
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              vibrate(5);
              onOpenInfo();
            }}
            aria-label="Community privacy information"
            className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-[#122D4F]/80 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md hover:bg-[#122D4F] no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Info size={13} className="text-amber-300" />
            <span>Privacy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
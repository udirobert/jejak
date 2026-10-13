import React, { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { Info } from "lucide-react";
import { FLAGS, ORIGIN_COORDS } from "./exploreUtils";
import { vibrate } from "@/lib/haptics";

const worldGeo = feature(worldTopo, worldTopo.objects.countries);

const W = 380;
const H = 168;

export default function ExploreWorldHeader({
  originChips,
  originFilter,
  onSelectOrigin,
  onOpenInfo,
  reduce,
}) {
  const tracedSet = useMemo(
    () => new Set(originChips.map((c) => c.origin)),
    [originChips]
  );

  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale(74)
        .translate([W / 2 - 12, H / 2 + 10]),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

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

  const pins = useMemo(
    () =>
      originChips
        .map((chip) => {
          const coords = ORIGIN_COORDS[chip.origin];
          if (!coords) return null;
          const xy = projection(coords);
          if (!xy) return null;
          return {
            ...chip,
            x: xy[0],
            y: xy[1],
            active: originFilter === chip.origin,
          };
        })
        .filter(Boolean),
    [originChips, projection, originFilter]
  );

  return (
    <div className="pt-1">
      {/* Top title + Live pulse + ⓘ chip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-jejak-navy">
            Community
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-jejak-materials/15 px-2.5 py-0.5 text-[10px] font-extrabold text-jejak-materials">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-jejak-materials ${
                reduce ? "" : "animate-pulse"
              }`}
            />
            Live
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            vibrate(5);
            onOpenInfo();
          }}
          aria-label="Opt-in privacy info"
          className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy no-tap"
        >
          <Info size={12} className="text-jejak-freight" />
          <span>ⓘ</span>
        </button>
      </div>

      {/* Flat world map with interactive origin flags */}
      <div className="relative mt-2 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          aria-label="World map of traced product origins"
        >
          {countries.map((c) => (
            <path
              key={c.key}
              d={c.d}
              fill={
                c.isSelected
                  ? "#FF7A1A"
                  : c.isTraced
                  ? "#FFC24B"
                  : "rgba(27, 27, 58, 0.10)"
              }
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth={c.isSelected ? 0.9 : 0.45}
              onClick={() => {
                if (c.isTraced) {
                  vibrate(5);
                  onSelectOrigin(
                    originFilter === c.name ? "All" : c.name
                  );
                }
              }}
              style={{ cursor: c.isTraced ? "pointer" : "default" }}
            />
          ))}

          {pins.map((pin) => (
            <g
              key={pin.origin}
              transform={`translate(${pin.x}, ${pin.y})`}
              onClick={() => {
                vibrate(5);
                onSelectOrigin(
                  originFilter === pin.origin ? "All" : pin.origin
                );
              }}
              style={{ cursor: "pointer" }}
            >
              {pin.active && !reduce && (
                <circle r={12} fill="#FF7A1A" opacity={0.28}>
                  <animate
                    attributeName="r"
                    values="8;16;8"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0.05;0.4"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                r={pin.active ? 9 : 7}
                fill={pin.active ? "#1B1B3A" : "#FFFFFF"}
                stroke={pin.active ? "#FFC24B" : "#1B1B3A"}
                strokeWidth={pin.active ? 2 : 1.2}
              />
              <text
                y={3.5}
                textAnchor="middle"
                fontSize={pin.active ? "10" : "8.5"}
              >
                {FLAGS[pin.origin] || "🌐"}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Inline Origin Flag Filter Strip */}
      <div className="mt-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 border-b border-jejak-navy/10">
        <button
          type="button"
          onClick={() => {
            vibrate(5);
            onSelectOrigin("All");
          }}
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold transition-colors no-tap ${
            originFilter === "All"
              ? "bg-jejak-navy text-white"
              : "text-jejak-navy/65 hover:text-jejak-navy"
          }`}
        >
          All
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
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold transition-colors no-tap ${
                active
                  ? "bg-jejak-navy text-white"
                  : "text-jejak-navy/75 hover:text-jejak-navy"
              }`}
            >
              <span>{FLAGS[chip.origin] || "🌐"}</span>
              <span>{chip.origin}</span>
              {chip.real > 0 && (
                <span
                  className={`text-[10px] font-bold tabular-nums ${
                    active ? "text-amber-300" : "text-jejak-navy/45"
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
  );
}
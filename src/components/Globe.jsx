import React, { useMemo, useRef, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { COLORS } from "@/lib/tokens";

// Convert the world-atlas TopoJSON to GeoJSON once.
const worldGeo = feature(worldTopo, worldTopo.objects.countries);

// Route country names to highlight (matched against feature.properties.name).
function makeRouteSet(route) {
  return new Set(route.map((s) => s.country));
}

const SIZE = 300;
const R = 140;

export default function Globe({ route, activeStop = route.length }) {
  const reduce = useReducedMotion();
  const routeSet = useMemo(() => makeRouteSet(route), [route]);
  const pathGen = useMemo(() => geoPath(geoOrthographic()), []);

  // Centre the globe on the route centroid, then spin longitude slowly.
  const centroid = useMemo(() => {
    const lngs = route.map((s) => s.lng);
    const lats = route.map((s) => s.lat);
    const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
    return [lng, lat];
  }, [route]);

  const [rot, setRot] = useState({ lng: -centroid[0], lat: -centroid[1] });
  const [coinPos, setCoinPos] = useState(0); // 0..(route.length-1) continuous
  const raf = useRef();
  const start = useRef();

  // Precompute sphere interpolators for each leg (in [lng,lat] space).
  const legs = useMemo(() => {
    const list = [];
    for (let i = 0; i < route.length - 1; i++) {
      const a = [route[i].lng, route[i].lat];
      const b = [route[i + 1].lng, route[i + 1].lat];
      list.push({ interp: geoInterpolate(a, b), a, b, value: route[i + 1].value, from: route[i], to: route[i + 1] });
    }
    return list;
  }, [route]);

  const maxVal = useMemo(() => Math.max(...route.map((s) => s.value), 1), [route]);

  useEffect(() => {
    if (reduce) return;
    start.current = performance.now();
    const loop = (t) => {
      const elapsed = (t - start.current) / 1000;
      setRot((prev) => ({ lng: prev.lng + 0.18, lat: prev.lat }));
      // coin travels the whole route in ~ (legs * 1.4)s, then holds.
      const totalLen = legs.length;
      const segDur = 1.4;
      const p = Math.min(elapsed / (totalLen * segDur), totalLen);
      setCoinPos(p);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [reduce, legs.length]);

  const projection = useMemo(
    () => geoOrthographic().scale(R).translate([SIZE / 2, SIZE / 2]).rotate([rot.lng, rot.lat]),
    [rot]
  );
  const gen = useMemo(() => geoPath(projection), [projection]);

  const spherePath = gen({ type: "Sphere" });
  const graticulePath = gen(geoGraticule10());
  const countryPaths = useMemo(
    () =>
      worldGeo.features.map((f) => ({
        d: gen(f),
        name: f.properties.name,
        highlight: routeSet.has(f.properties.name),
      })),
    // recompute each rotation change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gen]
  );

  // Project a [lng,lat] to [x,y] for coins/markers.
  const project = (pt) => projection(pt);

  // Current coin position.
  let coin = null;
  if (legs.length) {
    const seg = Math.min(Math.floor(coinPos), legs.length - 1);
    const t = Math.min(coinPos - seg, 1);
    const pt = legs[seg].interp(t);
    const xy = project(pt);
    if (xy) coin = { x: xy[0], y: xy[1], seg };
  }

  // Stop markers + arc paths.
  const markers = route.map((s) => project([s.lng, s.lat])).filter(Boolean);
  const arcPaths = legs.map((leg) => {
    const pts = [];
    for (let i = 0; i <= 36; i++) pts.push(leg.interp(i / 36));
    const line = { type: "LineString", coordinates: pts };
    return { d: gen(line), w: 1.5 + (leg.value / maxVal) * 5, seg: legs.indexOf(leg) };
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="mx-auto" aria-label="Rotating globe showing the product route">
      <defs>
        <radialGradient id="oceanG" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#EAF2FF" />
          <stop offset="100%" stopColor="#C9DBFF" />
        </radialGradient>
        <radialGradient id="coinG" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="55%" stopColor="#FFC24B" />
          <stop offset="100%" stopColor="#E8921A" />
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} />
        </clipPath>
      </defs>

      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="url(#oceanG)" />

      <g clipPath="url(#globeClip)">
        <path d={graticulePath} fill="none" stroke="#B9C9E8" strokeWidth="0.5" opacity="0.5" />
        {countryPaths.map((c, i) => (
          <path
            key={i}
            d={c.d}
            fill={c.highlight ? COLORS.amber : "#F4E9FF"}
            stroke={c.highlight ? COLORS.coral : "#E0D4F5"}
            strokeWidth={c.highlight ? 0.8 : 0.4}
            opacity={c.highlight ? 0.95 : 0.85}
          />
        ))}

        {/* arcs */}
        {arcPaths.map((a, i) => (
          <path
            key={`arc-${i}`}
            d={a.d}
            fill="none"
            stroke={COLORS.freight}
            strokeWidth={a.w}
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}

        {/* stop markers */}
        {markers.map((m, i) => (
          <g key={`m-${i}`}>
            <circle cx={m[0]} cy={m[1]} r={4.5} fill={COLORS.coral} stroke="#fff" strokeWidth="1.5" />
          </g>
        ))}

        {/* travelling coin */}
        {coin && (
          <circle cx={coin.x} cy={coin.y} r={6} fill="url(#coinG)" stroke="#B5750E" strokeWidth="1">
            <animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#9FB6E6" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
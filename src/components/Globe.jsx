import React, { useMemo, useRef, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { COLORS } from "@/lib/tokens";
import { vibrate } from "@/lib/haptics";

// Convert the world-atlas TopoJSON to GeoJSON once.
const worldGeo = feature(worldTopo, worldTopo.objects.countries);

// Route country names to highlight (matched against feature.properties.name).
function makeRouteSet(route) {
  return new Set(route.map((s) => s.country));
}

export default function Globe({
  route,
  activeStop = route.length,
  size = 300,
  focusedIdx = null,
  onSelectStop = null,
}) {
  const reduce = useReducedMotion();
  const R = Math.round(size * 0.465);
  const routeSet = useMemo(() => makeRouteSet(route), [route]);

  // Centre the globe on the route centroid initially.
  const centroid = useMemo(() => {
    const lngs = route.map((s) => s.lng);
    const lats = route.map((s) => s.lat);
    const lng = lngs.reduce((a, b) => a + b, 0) / (lngs.length || 1);
    const lat = lats.reduce((a, b) => a + b, 0) / (lats.length || 1);
    return [lng, lat];
  }, [route]);

  const [rot, setRot] = useState({ lng: -centroid[0], lat: -centroid[1] * 0.65 });
  const [coinPos, setCoinPos] = useState(0); // continuous 0..legs.length loop
  const [dashOffset, setDashOffset] = useState(0);
  const dragging = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });
  const targetRot = useRef(null);
  const raf = useRef();
  const start = useRef();

  // When a stop is focused externally, smoothly rotate toward it.
  useEffect(() => {
    if (focusedIdx != null && route[focusedIdx]) {
      const s = route[focusedIdx];
      targetRot.current = { lng: -s.lng, lat: Math.max(-45, Math.min(45, -s.lat * 0.75)) };
    } else {
      targetRot.current = null;
    }
  }, [focusedIdx, route]);

  // Precompute sphere interpolators for each leg (in [lng,lat] space).
  const legs = useMemo(() => {
    const list = [];
    for (let i = 0; i < route.length - 1; i++) {
      const a = [route[i].lng, route[i].lat];
      const b = [route[i + 1].lng, route[i + 1].lat];
      list.push({
        interp: geoInterpolate(a, b),
        a,
        b,
        value: route[i + 1].value || 10,
        from: route[i],
        to: route[i + 1],
      });
    }
    return list;
  }, [route]);

  const maxVal = useMemo(() => Math.max(...route.map((s) => s.value || 10), 1), [route]);

  useEffect(() => {
    if (reduce) return;
    start.current = performance.now();
    const loop = (t) => {
      const elapsed = (t - start.current) / 1000;
      setRot((prev) => {
        if (dragging.current) return prev;
        if (targetRot.current) {
          const dLng = targetRot.current.lng - prev.lng;
          const dLat = targetRot.current.lat - prev.lat;
          if (Math.abs(dLng) < 0.25 && Math.abs(dLat) < 0.25) {
            return prev;
          }
          return {
            lng: prev.lng + dLng * 0.12,
            lat: prev.lat + dLat * 0.12,
          };
        }
        return { lng: prev.lng + 0.22, lat: prev.lat };
      });
      // Continuous looping coin along all legs
      const totalLen = Math.max(1, legs.length);
      const segDur = 1.35;
      const p = (elapsed / segDur) % totalLen;
      setCoinPos(p);
      setDashOffset((d) => (d - 0.6) % 24);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [reduce, legs.length]);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .scale(R)
        .translate([size / 2, size / 2])
        .rotate([rot.lng, rot.lat])
        .clipAngle(90),
    [rot, R, size]
  );
  const gen = useMemo(() => geoPath(projection), [projection]);

  const graticulePath = gen(geoGraticule10());
  const countryPaths = useMemo(
    () =>
      worldGeo.features.map((f) => ({
        d: gen(f),
        name: f.properties.name,
        highlight: routeSet.has(f.properties.name),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gen]
  );

  const project = (pt) => projection(pt);

  // Current coin + trailing pulse position.
  let coin = null;
  let trail = null;
  if (legs.length) {
    const seg = Math.min(Math.floor(coinPos), legs.length - 1);
    const t = Math.min(coinPos - seg, 1);
    const pt = legs[seg].interp(t);
    const xy = project(pt);
    if (xy) coin = { x: xy[0], y: xy[1], seg };

    const tTrail = Math.max(0, t - 0.12);
    const ptTrail = legs[seg].interp(tTrail);
    const xyTrail = project(ptTrail);
    if (xyTrail) trail = { x: xyTrail[0], y: xyTrail[1] };
  }

  // Stop markers with country label + stage info.
  const markers = route
    .slice(0, activeStop)
    .map((s, idx) => {
      const xy = project([s.lng, s.lat]);
      return xy ? { x: xy[0], y: xy[1], stop: s, idx } : null;
    })
    .filter(Boolean);

  const arcPaths = legs.slice(0, Math.max(0, activeStop - 1)).map((leg, idx) => {
    const pts = [];
    for (let i = 0; i <= 36; i++) pts.push(leg.interp(i / 36));
    const line = { type: "LineString", coordinates: pts };
    return {
      d: gen(line),
      w: 1.8 + (leg.value / maxVal) * 4,
      seg: idx,
    };
  });

  // Pointer drag handlers for interactive globe spin
  const onPointerDown = (e) => {
    dragging.current = true;
    targetRot.current = null;
    lastPt.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };
    setRot((prev) => ({
      lng: prev.lng + dx * 0.45,
      lat: Math.max(-60, Math.min(60, prev.lat - dy * 0.45)),
    }));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="mx-auto cursor-grab active:cursor-grabbing touch-none"
        aria-label="Interactive 3D globe showing the product supply chain route"
      >
        <defs>
          <radialGradient id="oceanG" cx="36%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#F2F7FF" />
            <stop offset="65%" stopColor="#D4E4FF" />
            <stop offset="100%" stopColor="#B3CBF7" />
          </radialGradient>
          <radialGradient id="atmoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="82%" stopColor="#2D5BFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#FF8A65" stopOpacity="0.28" />
          </radialGradient>
          <radialGradient id="coinG" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#FFF3C4" />
            <stop offset="55%" stopColor="#FFC24B" />
            <stop offset="100%" stopColor="#E8921A" />
          </radialGradient>
          <clipPath id="globeClip">
            <circle cx={size / 2} cy={size / 2} r={R} />
          </clipPath>
        </defs>

        {/* Outer atmospheric halo */}
        <circle cx={size / 2} cy={size / 2} r={R + 8} fill="url(#atmoGlow)" />
        <circle cx={size / 2} cy={size / 2} r={R} fill="url(#oceanG)" />

        <g clipPath="url(#globeClip)">
          <path d={graticulePath} fill="none" stroke="#B4C6E8" strokeWidth="0.5" opacity="0.55" />
          {countryPaths.map((c, i) => (
            <path
              key={i}
              d={c.d}
              fill={c.highlight ? COLORS.amber : "#F6EEFF"}
              stroke={c.highlight ? COLORS.coral : "#DECFF5"}
              strokeWidth={c.highlight ? 0.9 : 0.4}
              opacity={c.highlight ? 0.98 : 0.88}
            />
          ))}

          {/* Base route arcs */}
          {arcPaths.map((a, i) => (
            <g key={`arc-${i}`}>
              <path
                d={a.d}
                fill="none"
                stroke={COLORS.freight}
                strokeWidth={a.w}
                strokeLinecap="round"
                opacity={0.32}
              />
              {/* Animated flowing trade stream */}
              <path
                d={a.d}
                fill="none"
                stroke={COLORS.freight}
                strokeWidth={Math.max(1.8, a.w * 0.65)}
                strokeLinecap="round"
                strokeDasharray="5 7"
                strokeDashoffset={dashOffset}
                opacity={0.95}
              />
            </g>
          ))}

          {/* Stop markers + pulsing rings + country callout pills */}
          {markers.map((m) => {
            const isFocused = focusedIdx === m.idx;
            const isOrigin = m.idx === 0;
            const isFinal = m.idx === route.length - 1;
            return (
              <g
                key={`m-${m.idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectStop) {
                    vibrate(6);
                    onSelectStop(m.idx);
                  }
                }}
                style={{ cursor: onSelectStop ? "pointer" : "default" }}
              >
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={isFocused ? 11 : 8}
                  fill={isOrigin ? COLORS.labour : COLORS.coral}
                  opacity={0.25}
                >
                  <animate
                    attributeName="r"
                    values={isFocused ? "7;15;7" : "5;11;5"}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.45;0.05;0.45"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={isFocused ? 6 : 4.8}
                  fill={isOrigin ? COLORS.labour : isFinal ? COLORS.materials : COLORS.coral}
                  stroke="#fff"
                  strokeWidth="1.8"
                />
                {/* Compact country tag on globe */}
                <g transform={`translate(${m.x}, ${m.y - 10})`}>
                  <rect
                    x={-26}
                    y={-11}
                    width={52}
                    height={13}
                    rx={6.5}
                    fill={isFocused ? "#1B1B3A" : "rgba(27,27,58,0.82)"}
                  />
                  <text
                    x={0}
                    y={-2}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="7.5"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {m.idx + 1}. {m.stop.country.slice(0, 8)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Coin wake trail */}
          {trail && (
            <circle cx={trail.x} cy={trail.y} r={3.5} fill="#FFC24B" opacity="0.55" />
          )}

          {/* Travelling gold coin */}
          {coin && (
            <g>
              <circle
                cx={coin.x}
                cy={coin.y}
                r={7}
                fill="url(#coinG)"
                stroke="#B5750E"
                strokeWidth="1.2"
              >
                <animate attributeName="r" values="6.5;8.5;6.5" dur="0.9s" repeatCount="indefinite" />
              </circle>
              <text
                x={coin.x}
                y={coin.y + 2.5}
                textAnchor="middle"
                fill="#7A4B04"
                fontSize="7"
                fontWeight="900"
              >
                £
              </text>
            </g>
          )}
        </g>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          opacity="0.75"
        />
      </svg>
    </div>
  );
}
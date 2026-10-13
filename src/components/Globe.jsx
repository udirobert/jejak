import React, { useMemo, useRef, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { COLORS } from "@/lib/tokens";
import { vibrate } from "@/lib/haptics";
import { useApp } from "@/lib/AppContext";
import { currencySymbolOf } from "@/lib/money";
import { MapSvgFlag } from "@/components/explore/OriginFlagChip";

// Convert the world-atlas TopoJSON to GeoJSON once.
const worldGeo = feature(worldTopo, worldTopo.objects.countries);

// Route country names to highlight (matched against feature.properties.name).
function makeRouteSet(route) {
  return new Set(route.map((s) => s.country));
}

function displayCountryName(country) {
  if (country === "United Kingdom") return "UK";
  return country || "";
}

export default function Globe({
  route,
  activeStop = route.length,
  size = 300,
  focusedIdx = null,
  onSelectStop = null,
  currency: currencyProp = null,
}) {
  const appCtx = useApp();
  const currency = currencyProp || appCtx?.currency || "GBP";
  const coinSymbol = currencySymbolOf(currency);
  const reduce = useReducedMotion();
  const R = Math.round(size * 0.465);

  // Dedupe route stops by country so each country appears only once on the globe
  const uniqueRoute = useMemo(() => {
    const seen = new Map();
    const list = [];
    (route || []).slice(0, activeStop).forEach((s) => {
      if (!seen.has(s.country)) {
        const clone = { ...s };
        seen.set(s.country, clone);
        list.push(clone);
      } else {
        const existing = seen.get(s.country);
        if (s.stage && existing.stage && !existing.stage.includes(s.stage)) {
          existing.stage = `${existing.stage} · ${s.stage}`;
        }
        existing.value = Math.max(existing.value || 10, s.value || 10);
      }
    });
    return list;
  }, [route, activeStop]);

  const routeSet = useMemo(() => makeRouteSet(uniqueRoute), [uniqueRoute]);

  // Centre the globe on the route centroid initially.
  const centroid = useMemo(() => {
    const lngs = uniqueRoute.map((s) => s.lng);
    const lats = uniqueRoute.map((s) => s.lat);
    const lng = lngs.reduce((a, b) => a + b, 0) / (lngs.length || 1);
    const lat = lats.reduce((a, b) => a + b, 0) / (lats.length || 1);
    return [lng, lat];
  }, [uniqueRoute]);

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
    if (focusedIdx != null && uniqueRoute[focusedIdx]) {
      const s = uniqueRoute[focusedIdx];
      targetRot.current = { lng: -s.lng, lat: Math.max(-45, Math.min(45, -s.lat * 0.75)) };
    } else {
      targetRot.current = null;
    }
  }, [focusedIdx, uniqueRoute]);

  // Precompute sphere interpolators for each leg (in [lng,lat] space).
  const legs = useMemo(() => {
    const list = [];
    for (let i = 0; i < uniqueRoute.length - 1; i++) {
      const a = [uniqueRoute[i].lng, uniqueRoute[i].lat];
      const b = [uniqueRoute[i + 1].lng, uniqueRoute[i + 1].lat];
      list.push({
        interp: geoInterpolate(a, b),
        a,
        b,
        value: uniqueRoute[i + 1].value || 10,
        from: uniqueRoute[i],
        to: uniqueRoute[i + 1],
      });
    }
    return list;
  }, [uniqueRoute]);

  const maxVal = useMemo(
    () => Math.max(...uniqueRoute.map((s) => s.value || 10), 1),
    [uniqueRoute]
  );

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
      // Continuous looping coin along all legs (always non-negative)
      const totalLen = Math.max(1, legs.length);
      const segDur = 1.35;
      const p = Math.max(0, elapsed / segDur) % totalLen;
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

  // Signature animation: coin arcing along corridors into wallet markers (respects prefers-reduced-motion).
  let coin = null;
  let trail = null;
  if (!reduce && legs.length) {
    const safePos = Number.isFinite(coinPos) && coinPos >= 0 ? coinPos : 0;
    const seg = Math.max(0, Math.min(Math.floor(safePos), legs.length - 1));
    const leg = legs[seg];
    if (leg && leg.interp) {
      const t = Math.max(0, Math.min(safePos - seg, 1));
      const pt = leg.interp(t);
      const xy = project(pt);
      const arcLift = Math.sin(t * Math.PI) * 10;
      if (xy) coin = { x: xy[0], y: xy[1] - arcLift, seg };

      const tTrail = Math.max(0, t - 0.11);
      const ptTrail = leg.interp(tTrail);
      const xyTrail = project(ptTrail);
      const trailLift = Math.sin(tTrail * Math.PI) * 10;
      if (xyTrail) trail = { x: xyTrail[0], y: xyTrail[1] - trailLift };
    }
  }

  // Stop markers with country label + stage info (deduped so each country appears once).
  const markers = uniqueRoute
    .map((s, idx) => {
      const xy = project([s.lng, s.lat]);
      return xy ? { x: xy[0], y: xy[1], stop: s, idx } : null;
    })
    .filter(Boolean);

  const arcPaths = legs.map((leg, idx) => {
    const pts = [];
    for (let i = 0; i <= 36; i++) pts.push(leg.interp(i / 36));
    const line = { type: "LineString", coordinates: pts };
    // Brighten dashed route connected to the selected stop
    const isConnectedToFocused =
      focusedIdx != null && (idx === focusedIdx - 1 || idx === focusedIdx);
    return {
      d: gen(line),
      w: 1.8 + (leg.value / maxVal) * 4,
      seg: idx,
      bright: isConnectedToFocused,
      dimmed: focusedIdx != null && !isConnectedToFocused,
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
              {a.bright && (
                <path
                  d={a.d}
                  fill="none"
                  stroke="#FFC24B"
                  strokeWidth={a.w + 3.2}
                  strokeLinecap="round"
                  opacity={0.55}
                />
              )}
              <path
                d={a.d}
                fill="none"
                stroke={COLORS.freight}
                strokeWidth={a.bright ? a.w + 0.8 : a.w}
                strokeLinecap="round"
                opacity={a.bright ? 0.55 : a.dimmed ? 0.16 : 0.32}
              />
              {/* Animated flowing trade stream */}
              <path
                d={a.d}
                fill="none"
                stroke={a.bright ? "#1B1B3A" : COLORS.freight}
                strokeWidth={a.bright ? Math.max(2.4, a.w * 0.8) : Math.max(1.8, a.w * 0.65)}
                strokeLinecap="round"
                strokeDasharray={a.bright ? "6 5" : "5 7"}
                strokeDashoffset={dashOffset}
                opacity={a.bright ? 1 : a.dimmed ? 0.38 : 0.95}
              />
            </g>
          ))}

          {/* Stop markers: short flag-only pill until selected; full untruncated country name when selected */}
          {markers.map((m) => {
            const isFocused = focusedIdx === m.idx;
            const isOrigin = m.idx === 0;
            const isFinal = m.idx === uniqueRoute.length - 1;
            const labelText = displayCountryName(m.stop.country);
            const pillWidth = isFocused
              ? Math.max(54, Math.round(labelText.length * 5.8 + 28))
              : 24;
            const pillHeight = isFocused ? 16 : 14;

            return (
              <g
                key={`m-${m.stop.country}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectStop) {
                    vibrate(6);
                    const offset = {
                      x: Math.round((m.x - size / 2) * 0.35),
                      y: Math.round((m.y - size) * 0.25),
                    };
                    onSelectStop(m.idx, m.stop, offset);
                  }
                }}
                style={{ cursor: onSelectStop ? "pointer" : "default" }}
              >
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={isFocused ? 12 : 8}
                  fill={isOrigin ? COLORS.labour : COLORS.coral}
                  opacity={0.25}
                >
                  {!reduce && (
                    <>
                      <animate
                        attributeName="r"
                        values={isFocused ? "8;16;8" : "5;11;5"}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.45;0.05;0.45"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </>
                  )}
                </circle>
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={isFocused ? 6.5 : 4.8}
                  fill={isOrigin ? COLORS.labour : isFinal ? COLORS.materials : COLORS.coral}
                  stroke="#fff"
                  strokeWidth="1.8"
                />

                {/* Callout pill: flag-only until selected, full country name when selected */}
                <g transform={`translate(${m.x}, ${m.y - 11})`}>
                  <rect
                    x={-pillWidth / 2}
                    y={-pillHeight}
                    width={pillWidth}
                    height={pillHeight}
                    rx={pillHeight / 2}
                    fill={isFocused ? "#1B1B3A" : "rgba(27,27,58,0.84)"}
                    stroke={isFocused ? "#FFC24B" : "rgba(255,255,255,0.65)"}
                    strokeWidth={isFocused ? 1.2 : 0.7}
                  />
                  {isFocused ? (
                    <>
                      <MapSvgFlag
                        country={m.stop.country}
                        x={-pillWidth / 2 + 11}
                        y={-pillHeight / 2}
                        width={12}
                        height={8.5}
                      />
                      <text
                        x={6}
                        y={-pillHeight / 2 + 2.8}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontWeight="800"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {labelText}
                      </text>
                    </>
                  ) : (
                    <MapSvgFlag
                      country={m.stop.country}
                      x={0}
                      y={-pillHeight / 2}
                      width={13}
                      height={9}
                    />
                  )}
                </g>
              </g>
            );
          })}

          {/* Coin wake trail */}
          {trail && (
            <circle cx={trail.x} cy={trail.y} r={3.5} fill="#FFC24B" opacity="0.55" />
          )}

          {/* Travelling gold coin following active currency (£ or S$) */}
          {coin && (
            <g>
              <circle
                cx={coin.x}
                cy={coin.y}
                r={7.5}
                fill="url(#coinG)"
                stroke="#B5750E"
                strokeWidth="1.2"
              >
                {!reduce && (
                  <animate
                    attributeName="r"
                    values="6.8;8.6;6.8"
                    dur="0.9s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <text
                x={coin.x}
                y={coin.y + (coinSymbol.length > 1 ? 2.1 : 2.5)}
                textAnchor="middle"
                fill="#7A4B04"
                fontSize={coinSymbol.length > 1 ? "5.6" : "7.2"}
                fontWeight="900"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {coinSymbol}
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
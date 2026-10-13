import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AMBIENT_TRANSPORT_CORRIDORS,
  WAVE_SHIMMER_SPOTS,
  CREATURE_SPOTS,
  buildMultiModeRouteLegs,
  sampleProjectedPolyline,
} from "./exploreSeaRoutes";
import {
  TransportVehicleSvg,
  SurfacingCreatureSvg,
} from "./ExploreVehiclesSvg";

export default function ExploreAmbientSea({
  projection,
  W,
  H,
  zoom = 1,
  activeRoute,
  reduce,
}) {
  // Inverse scale so vehicles, wakes, and labels stay readable from 1x to 8x zoom
  const invScale = useMemo(() => 1 / Math.pow(Math.max(1, zoom), 0.78), [zoom]);

  const [animState, setAnimState] = useState({
    elapsedSec: 0,
    routeProgress: 0,
    creature: null,
  });

  const routeStartRef = useRef(0);
  const creatureWindowRef = useRef({
    nextTriggerSec: 8,
    activeStartSec: null,
    spotIdx: 0,
  });

  useEffect(() => {
    routeStartRef.current = performance.now() / 1000;
  }, [activeRoute?.key]);

  // Pre-project all transport corridors once
  const projectedCorridors = useMemo(
    () =>
      AMBIENT_TRANSPORT_CORRIDORS.map((c) => ({
        ...c,
        pts: c.waypoints.map((wp) => projection(wp)).filter(Boolean),
      })),
    [projection]
  );

  // Level-of-Detail selection:
  // At world zoom (< 1.75): show ocean ships + long-haul planes (7 objects).
  // When zoomed into a region (>= 1.75): reveal overland trains + regional lorries, capped at <= 9 ambient vehicles total
  // so total animated objects (including active route vehicle / wave shimmer) stays ~10.
  const visibleCorridors = useMemo(() => {
    if (zoom < 1.75) {
      return projectedCorridors.filter((c) => c.minZoom <= 1).slice(0, 7);
    }
    const regional = projectedCorridors.filter((c) => c.minZoom > 1);
    const world = projectedCorridors.filter((c) => c.minZoom <= 1).slice(0, 4);
    return [...regional, ...world].slice(0, 9);
  }, [projectedCorridors, zoom]);

  const projectedWaves = useMemo(
    () =>
      WAVE_SHIMMER_SPOTS.map((coords, idx) => {
        const xy = projection(coords);
        return xy ? { id: idx, x: xy[0], y: xy[1] } : null;
      }).filter(Boolean),
    [projection]
  );

  const projectedCreatures = useMemo(
    () =>
      CREATURE_SPOTS.map((spot) => {
        const xy = projection(spot.coords);
        return xy ? { x: xy[0], y: xy[1], kind: spot.kind } : null;
      }).filter(Boolean),
    [projection]
  );

  // Project multi-leg origin-to-market route (lorry/train -> ship -> lorry)
  const activeRouteProjected = useMemo(() => {
    if (!activeRoute?.origin) return null;
    const rawLegs = buildMultiModeRouteLegs(
      activeRoute.origin,
      activeRoute.market
    );
    const legs = rawLegs
      .map((leg) => {
        const pts = leg.waypoints.map((wp) => projection(wp)).filter(Boolean);
        if (pts.length < 2) return null;
        let len = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          len += Math.hypot(
            pts[i + 1][0] - pts[i][0],
            pts[i + 1][1] - pts[i][1]
          );
        }
        const pathD = pts
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
          )
          .join(" ");
        return { mode: leg.mode, pts, len: Math.max(len, 12), pathD };
      })
      .filter(Boolean);

    if (legs.length === 0) return null;
    const totalLen = legs.reduce((acc, l) => acc + l.len, 0);
    let cursor = 0;
    const weightedLegs = legs.map((l) => {
      const startFrac = cursor / totalLen;
      cursor += l.len;
      const endFrac = cursor / totalLen;
      return { ...l, startFrac, endFrac };
    });

    const lastLeg = weightedLegs[weightedLegs.length - 1];
    const destPt = lastLeg.pts[lastLeg.pts.length - 1];

    return {
      legs: weightedLegs,
      destPt,
      productName: activeRoute.productName || "Traced item",
      marketLabel: activeRoute.market === "SG" ? "SG" : "UK",
    };
  }, [activeRoute, projection]);

  // Single requestAnimationFrame loop that pauses when page is hidden and disables ambient motion when prefers-reduced-motion
  useEffect(() => {
    if (reduce) return;

    let rafId = null;
    let isHidden = document.visibilityState === "hidden";
    const t0 = performance.now() / 1000;

    const tick = (nowMs) => {
      if (isHidden) return;
      const nowSec = nowMs / 1000;
      const elapsedSec = nowSec - t0;

      // Multi-leg route sequence loops every 6.2s
      const routeElapsed = Math.max(0, nowSec - routeStartRef.current);
      const routeProgress = (routeElapsed / 6.2) % 1;

      // Rare whale / fin surfacing every 32-55 seconds
      const cw = creatureWindowRef.current;
      let creature = null;
      if (cw.activeStartSec != null) {
        const cProg = (elapsedSec - cw.activeStartSec) / 4.2;
        if (cProg <= 1 && projectedCreatures.length > 0) {
          const spot =
            projectedCreatures[cw.spotIdx % projectedCreatures.length];
          creature = { ...spot, progress: cProg };
        } else {
          cw.activeStartSec = null;
          cw.nextTriggerSec = elapsedSec + 32 + ((cw.spotIdx * 11) % 24);
          cw.spotIdx += 1;
        }
      } else if (
        elapsedSec >= cw.nextTriggerSec &&
        projectedCreatures.length > 0
      ) {
        cw.activeStartSec = elapsedSec;
      }

      setAnimState({
        elapsedSec,
        routeProgress,
        creature,
      });

      rafId = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      isHidden = document.visibilityState === "hidden";
      if (isHidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!isHidden && !rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    if (!isHidden) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reduce, projectedCreatures]);

  // Real-time moving day/night terminator shadow
  const terminatorX = useMemo(() => {
    const now = new Date();
    const utcHours =
      now.getUTCHours() +
      now.getUTCMinutes() / 60 +
      (reduce ? 0 : (animState.elapsedSec * 0.04) % 24);
    const frac = (utcHours % 24) / 24;
    return (frac * W) % W;
  }, [W, animState.elapsedSec, reduce]);

  const nightBandWidth = W * 0.44;

  // Determine which leg & vehicle mode is active on the tapped origin's route sequence
  const activeRoutePose = useMemo(() => {
    if (!activeRouteProjected) return null;
    const t = reduce ? 0.55 : animState.routeProgress;
    const leg =
      activeRouteProjected.legs.find(
        (l) => t >= l.startFrac && t <= l.endFrac
      ) || activeRouteProjected.legs[activeRouteProjected.legs.length - 1];
    const span = Math.max(0.001, leg.endFrac - leg.startFrac);
    const localT = Math.max(0, Math.min(1, (t - leg.startFrac) / span));
    const pose = sampleProjectedPolyline(leg.pts, localT);
    if (!pose) return null;
    return { ...pose, mode: leg.mode };
  }, [activeRouteProjected, animState.routeProgress, reduce]);

  return (
    <g className="pointer-events-none">
      {/* Real-time moving day/night terminator shadow */}
      <g opacity="0.24">
        <path
          d={`M ${terminatorX - nightBandWidth / 2} 0
              Q ${terminatorX - nightBandWidth / 2 + 28} ${H * 0.5} ${
            terminatorX - nightBandWidth / 2 - 14
          } ${H}
              L ${terminatorX + nightBandWidth / 2 - 14} ${H}
              Q ${terminatorX + nightBandWidth / 2 + 28} ${H * 0.5} ${
            terminatorX + nightBandWidth / 2
          } 0 Z`}
          fill="#050F1E"
          filter="url(#nightShadowBlur)"
        />
      </g>

      {/* Slow ocean wave shimmer (disabled when prefers-reduced-motion) */}
      {!reduce &&
        projectedWaves.map((w) => {
          const phase =
            (animState.elapsedSec * 0.45 + w.id * 0.9) % (Math.PI * 2);
          const op = 0.08 + ((Math.sin(phase) + 1) * 0.5) * 0.22;
          const dx = Math.sin(phase) * 2.2;
          return (
            <g
              key={w.id}
              transform={`translate(${(w.x + dx).toFixed(1)}, ${w.y.toFixed(
                1
              )}) scale(${invScale.toFixed(3)})`}
              opacity={op.toFixed(2)}
            >
              <path
                d="M -7 0 Q -3.5 -1.6 0 0 T 7 0"
                fill="none"
                stroke="#BAE6FD"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
              <path
                d="M -4 2.6 Q -1 1.3 2 2.6 T 8 2.6"
                fill="none"
                stroke="#E0F2FE"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
            </g>
          );
        })}

      {/* Ambient mixed transport (ships & planes at world zoom; reveals trains & lorries when zoomed in) */}
      {!reduce &&
        visibleCorridors.map((corridor) => {
          const t =
            (corridor.phase + animState.elapsedSec * corridor.speed) % 1;
          const pose = sampleProjectedPolyline(corridor.pts, t);
          if (!pose) return null;
          return (
            <TransportVehicleSvg
              key={corridor.id}
              mode={corridor.mode}
              x={pose.x}
              y={pose.y}
              angle={pose.angle}
              containers={corridor.containers}
              invScale={invScale}
            />
          );
        })}

      {/* Rare surfacing whale fluke / shark fin every 30-60s (purely playful, no text) */}
      {!reduce && animState.creature && (
        <SurfacingCreatureSvg
          x={animState.creature.x}
          y={animState.creature.y}
          kind={animState.creature.kind}
          progress={animState.creature.progress}
          invScale={invScale}
        />
      )}

      {/* Active Origin -> User's Market Multi-Leg Route & Vehicle Sequence */}
      {activeRouteProjected && (
        <g>
          {activeRouteProjected.legs.map((leg, idx) => (
            <g key={`leg-${idx}`}>
              {/* Soft wake/trail glow */}
              <path
                d={leg.pathD}
                fill="none"
                stroke={leg.mode === "ship" ? "#FFC24B" : "#FF8A65"}
                strokeWidth={3.2 * invScale}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.34"
              />
              <path
                d={leg.pathD}
                fill="none"
                stroke={leg.mode === "ship" ? "#FFC24B" : "#FFE49E"}
                strokeWidth={1.8 * invScale}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${4 * invScale} ${3.5 * invScale}`}
                opacity="0.92"
              />
              {/* Intermodal transfer node between legs */}
              {idx > 0 && (
                <circle
                  cx={leg.pts[0][0]}
                  cy={leg.pts[0][1]}
                  r={2.8 * invScale}
                  fill="#FFC24B"
                  stroke="#0F2440"
                  strokeWidth={0.9 * invScale}
                />
              )}
            </g>
          ))}

          {/* Destination market port beacon (UK or SG) */}
          <g
            transform={`translate(${activeRouteProjected.destPt[0].toFixed(
              1
            )}, ${activeRouteProjected.destPt[1].toFixed(
              1
            )}) scale(${invScale.toFixed(3)})`}
          >
            <circle r="7" fill="#2FBF71" opacity="0.3" />
            <circle
              r="3.8"
              fill="#2FBF71"
              stroke="#FFFFFF"
              strokeWidth="1.4"
            />
            <g transform="translate(0, -11)">
              <rect
                x="-14"
                y="-6.5"
                width="28"
                height="13"
                rx="6.5"
                fill="#0F2440"
                stroke="#2FBF71"
                strokeWidth="0.9"
              />
              <text
                x="0"
                y="2.5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="7.2"
                fontWeight="800"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {activeRouteProjected.marketLabel}
              </text>
            </g>
          </g>

          {/* Active vehicle in the multi-leg sequence (lorry/train -> ship -> lorry) */}
          {activeRoutePose && (
            <g>
              <TransportVehicleSvg
                mode={activeRoutePose.mode}
                x={activeRoutePose.x}
                y={activeRoutePose.y}
                angle={activeRoutePose.angle}
                containers={["#2FBF71", "#FF7A1A", "#FFC24B"]}
                invScale={invScale}
                highlight
              />
              {/* Product badge carried along the route */}
              <g
                transform={`translate(${activeRoutePose.x.toFixed(
                  1
                )}, ${activeRoutePose.y.toFixed(
                  1
                )}) scale(${invScale.toFixed(3)}) translate(0, -13)`}
              >
                <rect
                  x="-36"
                  y="-7"
                  width="72"
                  height="13.5"
                  rx="6.75"
                  fill="rgba(15, 36, 64, 0.94)"
                  stroke="#FFC24B"
                  strokeWidth="0.85"
                />
                <text
                  x="0"
                  y="2.3"
                  textAnchor="middle"
                  fill="#FFC24B"
                  fontSize="6.8"
                  fontWeight="800"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {activeRouteProjected.productName.slice(0, 14)}
                </text>
              </g>
            </g>
          )}
        </g>
      )}
    </g>
  );
}
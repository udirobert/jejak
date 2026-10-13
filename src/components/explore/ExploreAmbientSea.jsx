import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AMBIENT_SHIP_LANES,
  WAVE_SHIMMER_SPOTS,
  CREATURE_SPOTS,
  buildOriginToMarketWaypoints,
  sampleProjectedPolyline,
} from "./exploreSeaRoutes";

// Small illustrated cargo ship with soft V-wake and category-coloured containers
function CargoShipSvg({ x, y, angle, containers, scale = 1, highlight = false }) {
  // Flip ship vertically if sailing westward so the bridge/containers stay upright
  const normalized = ((angle % 360) + 360) % 360;
  const flipY = normalized > 90 && normalized < 270 ? -1 : 1;

  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${angle.toFixed(
        1
      )}) scale(${scale}, ${scale * flipY})`}
    >
      {/* Soft V-shaped wake trailing behind the stern */}
      <path
        d="M -7 0 L -19 -4.2 M -7 0 L -19 4.2"
        stroke={highlight ? "#FFE49E" : "#BAE6FD"}
        strokeWidth={highlight ? "1.1" : "0.85"}
        strokeLinecap="round"
        opacity={highlight ? "0.7" : "0.38"}
        fill="none"
      />
      <path
        d="M -8 0 L -14 0"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity={highlight ? "0.65" : "0.32"}
      />

      {/* Hull */}
      <path
        d="M -6.5 1.8 L 5.5 1.8 L 8.2 -0.6 L -5.5 -0.6 Z"
        fill={highlight ? "#FFC24B" : "#0F243C"}
        stroke="#FFFFFF"
        strokeWidth="0.55"
      />

      {/* 3 Category-Coloured Containers on Deck */}
      <rect
        x="-4.2"
        y="-2.8"
        width="2.6"
        height="2.1"
        rx="0.35"
        fill={containers[0]}
      />
      <rect
        x="-1.3"
        y="-2.8"
        width="2.6"
        height="2.1"
        rx="0.35"
        fill={containers[1]}
      />
      <rect
        x="1.6"
        y="-2.8"
        width="2.6"
        height="2.1"
        rx="0.35"
        fill={containers[2]}
      />

      {/* White Bridge Superstructure */}
      <rect
        x="-5.6"
        y="-3.4"
        width="1.4"
        height="2.7"
        rx="0.3"
        fill="#F8FAFC"
      />
    </g>
  );
}

// Playful surfacing whale tail or shark fin with concentric ripple (no text or facts)
function SurfacingCreatureSvg({ x, y, kind, progress }) {
  // progress: 0 -> 1 over ~4.2 seconds
  const rippleR1 = 3 + progress * 16;
  const rippleR2 = Math.max(2, (progress - 0.2) * 14);
  const alpha = Math.sin(progress * Math.PI);

  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
      opacity={Math.max(0, Math.min(1, alpha))}
    >
      {/* Concentric water ripples */}
      <ellipse
        cx="0"
        cy="1"
        rx={rippleR1}
        ry={rippleR1 * 0.52}
        fill="none"
        stroke="#BAE6FD"
        strokeWidth="1"
        opacity={Math.max(0, 0.75 * (1 - progress))}
      />
      {progress > 0.2 && (
        <ellipse
          cx="0"
          cy="1"
          rx={rippleR2}
          ry={rippleR2 * 0.52}
          fill="none"
          stroke="#E0F2FE"
          strokeWidth="0.8"
          opacity={Math.max(0, 0.6 * (1 - progress))}
        />
      )}

      {/* Surfacing silhouette */}
      <g
        transform={`translate(0, ${((1 - alpha) * 4).toFixed(1)}) scale(${
          0.85 + alpha * 0.25
        })`}
      >
        {kind === "whale" ? (
          /* Playful whale fluke silhouette */
          <path
            d="M 0 1 C -0.5 -2, -3.5 -5, -6.5 -5.5 C -4.5 -3, -2.5 -1.5, -1 -0.5 C -0.3 -2.5, 0.3 -2.5, 1 -0.5 C 2.5 -1.5, 4.5 -3, 6.5 -5.5 C 3.5 -5, 0.5 -2, 0 1 Z"
            fill="#E0F2FE"
            stroke="#0F2942"
            strokeWidth="0.5"
          />
        ) : (
          /* Dorsal fin silhouette */
          <path
            d="M -3.5 1 C -1.5 -3.5, 1.5 -5.5, 3.2 -5.8 C 2.1 -2.8, 2.2 -0.5, 3.5 1 Z"
            fill="#BAE6FD"
            stroke="#0F2942"
            strokeWidth="0.5"
          />
        )}
      </g>
    </g>
  );
}

export default function ExploreAmbientSea({
  projection,
  W,
  H,
  activeRoute,
  reduce,
}) {
  const [animState, setAnimState] = useState({
    elapsedSec: 0,
    routeProgress: 0,
    creature: null, // { x, y, kind, progress }
  });

  const routeStartRef = useRef(0);
  const creatureWindowRef = useRef({
    nextTriggerSec: 7, // first playful surface ~7s in, then every 32-55s
    activeStartSec: null,
    spotIdx: 0,
  });

  // Reset route ship progress when activeRoute changes
  useEffect(() => {
    routeStartRef.current = performance.now() / 1000;
  }, [activeRoute?.key]);

  // Pre-project static trade lane polylines
  const projectedLanes = useMemo(
    () =>
      AMBIENT_SHIP_LANES.map((lane) => ({
        ...lane,
        pts: lane.waypoints
          .map((wp) => projection(wp))
          .filter(Boolean),
      })),
    [projection]
  );

  // Pre-project wave shimmer spots
  const projectedWaves = useMemo(
    () =>
      WAVE_SHIMMER_SPOTS.map((coords, idx) => {
        const xy = projection(coords);
        return xy ? { id: idx, x: xy[0], y: xy[1] } : null;
      }).filter(Boolean),
    [projection]
  );

  // Pre-project creature surfacing spots
  const projectedCreatures = useMemo(
    () =>
      CREATURE_SPOTS.map((spot) => {
        const xy = projection(spot.coords);
        return xy ? { x: xy[0], y: xy[1], kind: spot.kind } : null;
      }).filter(Boolean),
    [projection]
  );

  // Project active origin-to-market route waypoints
  const activeRouteProjected = useMemo(() => {
    if (!activeRoute?.origin) return null;
    const waypoints = buildOriginToMarketWaypoints(
      activeRoute.origin,
      activeRoute.market
    );
    const pts = waypoints.map((wp) => projection(wp)).filter(Boolean);
    if (pts.length < 2) return null;
    const pathD = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
      .join(" ");
    return {
      pts,
      pathD,
      destPt: pts[pts.length - 1],
      productName: activeRoute.productName || "Traced item",
      marketLabel: activeRoute.market === "SG" ? "SG" : "UK",
    };
  }, [activeRoute, projection]);

  // Single requestAnimationFrame loop that pauses when page/tab is hidden and respects prefers-reduced-motion
  useEffect(() => {
    if (reduce) return;

    let rafId = null;
    let isHidden = document.visibilityState === "hidden";
    const t0 = performance.now() / 1000;

    const tick = (nowMs) => {
      if (isHidden) return;
      const nowSec = nowMs / 1000;
      const elapsedSec = nowSec - t0;

      // Active route ship progress (loops smoothly every 5.5s while active)
      const routeElapsed = Math.max(0, nowSec - routeStartRef.current);
      const routeProgress = (routeElapsed / 5.2) % 1;

      // Rare whale / fin surfacing every 32-55 seconds (duration 4.2s)
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
          // Schedule next surfacing in 32-55 seconds
          cw.nextTriggerSec = elapsedSec + 32 + ((cw.spotIdx * 11) % 24);
          cw.spotIdx += 1;
        }
      } else if (elapsedSec >= cw.nextTriggerSec && projectedCreatures.length > 0) {
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

  // Real-time solar terminator shadow position (moves slowly across the map)
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

  // Compute active route ship position
  const routeShipPose = useMemo(() => {
    if (!activeRouteProjected) return null;
    const t = reduce ? 0.55 : animState.routeProgress;
    return sampleProjectedPolyline(activeRouteProjected.pts, t);
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

      {/* Slow ocean wave shimmer (static or hidden when prefers-reduced-motion) */}
      {!reduce &&
        projectedWaves.map((w) => {
          const phase = (animState.elapsedSec * 0.45 + w.id * 0.9) % (Math.PI * 2);
          const op = 0.08 + ((Math.sin(phase) + 1) * 0.5) * 0.24;
          const dx = Math.sin(phase) * 2.5;
          return (
            <g
              key={w.id}
              transform={`translate(${(w.x + dx).toFixed(1)}, ${w.y.toFixed(1)})`}
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

      {/* Simplified trade lane dashed guide lines + 8 ambient cargo ships (hidden when reduce is true) */}
      {!reduce &&
        projectedLanes.map((lane) => {
          const t = (lane.phase + animState.elapsedSec * lane.speed) % 1;
          const pose = sampleProjectedPolyline(lane.pts, t);
          if (!pose) return null;
          return (
            <CargoShipSvg
              key={lane.id}
              x={pose.x}
              y={pose.y}
              angle={pose.angle}
              containers={lane.containers}
              scale={0.92}
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
        />
      )}

      {/* Active Origin -> User's Market (UK or SG) Sea Route + Sailing Product Ship */}
      {activeRouteProjected && (
        <g>
          {/* Glowing route under-stroke */}
          <path
            d={activeRouteProjected.pathD}
            fill="none"
            stroke="#FFC24B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.28"
            filter="url(#originGlow)"
          />
          {/* Crisp dashed sea lane */}
          <path
            d={activeRouteProjected.pathD}
            fill="none"
            stroke="#FFC24B"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 4"
            opacity="0.92"
          />

          {/* Destination market port beacon (UK or SG) */}
          <g
            transform={`translate(${activeRouteProjected.destPt[0].toFixed(
              1
            )}, ${activeRouteProjected.destPt[1].toFixed(1)})`}
          >
            <circle
              r="7"
              fill="#2FBF71"
              opacity="0.3"
            />
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

          {/* Dedicated Ship sailing along the tapped origin's route */}
          {routeShipPose && (
            <g>
              <CargoShipSvg
                x={routeShipPose.x}
                y={routeShipPose.y}
                angle={routeShipPose.angle}
                containers={["#2FBF71", "#FF7A1A", "#FFC24B"]}
                scale={1.25}
                highlight
              />
              {/* Compact product tag carried by the route ship */}
              <g
                transform={`translate(${routeShipPose.x.toFixed(1)}, ${(
                  routeShipPose.y - 11
                ).toFixed(1)})`}
              >
                <rect
                  x="-34"
                  y="-7"
                  width="68"
                  height="13"
                  rx="6.5"
                  fill="rgba(15, 36, 64, 0.92)"
                  stroke="#FFC24B"
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="2.2"
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
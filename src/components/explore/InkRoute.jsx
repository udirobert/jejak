import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildMultiModeRouteLegs, sampleProjectedPolyline } from "./exploreSeaRoutes";

// Ink vehicle icons — small journal line drawings (ship hull / plane silhouette).
function InkVehicle({ mode, x, y, angle }) {
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`}>
      {mode === "plane" ? (
        <g fill="none" stroke="var(--j-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M -9 0 L 9 0" />
          <path d="M -2 0 L 4 -5 M -2 0 L 4 5" />
          <path d="M -8 0 L -11 -3 M -8 0 L -11 3" strokeWidth="1.2" />
        </g>
      ) : (
        <g fill="none" stroke="var(--j-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M -9 2 L 9 2 L 6 6 L -6 6 Z" />
          <path d="M -6 2 L -6 -3 L 3 -3 L 3 2" />
          <path d="M 4 2 L 4 -1 L 7 -1 L 7 2" strokeWidth="1.2" />
        </g>
      )}
    </g>
  );
}

// Draws a traced item's illustrative journey: dashed ink legs + an ink vehicle
// arriving at its market. Replace the old ambient-sea layer.
export default function InkRoute({ projection, activeRoute, reduce }) {
  const [progress, setProgress] = useState(reduce ? 1 : 0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const projected = useMemo(() => {
    if (!activeRoute?.origin) return null;
    const legs = buildMultiModeRouteLegs(activeRoute.origin, activeRoute.market)
      .map((leg) => {
        const pts = leg.waypoints.map((wp) => projection(wp)).filter(Boolean);
        if (pts.length < 2) return null;
        let len = 0;
        for (let i = 0; i < pts.length - 1; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        return { mode: leg.mode, pts, len: Math.max(len, 12) };
      })
      .filter(Boolean);
    if (!legs.length) return null;
    const total = legs.reduce((a, l) => a + l.len, 0);
    let cur = 0;
    const weighted = legs.map((l) => { const s = cur / total; cur += l.len; return { ...l, startFrac: s, endFrac: cur / total }; });
    return { legs: weighted, dest: weighted[weighted.length - 1].pts.at(-1) };
  }, [activeRoute, projection]);

  useEffect(() => {
    if (!projected) return;
    if (reduce) { setProgress(1); return; }
    startRef.current = null;
    const DUR = 5200;
    const step = (t) => {
      if (startRef.current == null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / DUR);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [projected, reduce]);

  if (!projected) return null;
  const { legs, dest } = projected;
  const t = progress;
  const leg = legs.find((l) => t >= l.startFrac && t <= l.endFrac) || legs[legs.length - 1];
  const local = Math.max(0, Math.min(1, (t - leg.startFrac) / Math.max(0.001, leg.endFrac - leg.startFrac)));
  const pose = sampleProjectedPolyline(leg.pts, local);

  return (
    <g className="pointer-events-none">
      {legs.map((l, i) => {
        const d = l.pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
        const legT = Math.max(0, Math.min(1, (t - l.startFrac) / (l.endFrac - l.startFrac || 1)));
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--j-ink)"
            strokeWidth="1.4"
            strokeDasharray="5 4"
            strokeLinecap="round"
            opacity={legT > 0 ? 0.85 : 0.3}
            pathLength={100}
            strokeDashoffset={reduce ? 0 : 100 - legT * 100}
          />
        );
      })}
      <g transform={`translate(${dest[0].toFixed(1)}, ${dest[1].toFixed(1)})`}>
        <circle r="9" fill="none" stroke="var(--j-stamp)" strokeWidth="1.4" strokeDasharray="2 2" />
        <text y="3" textAnchor="middle" fontSize="6" fill="var(--j-stamp)" fontFamily="'IBM Plex Mono', monospace">
          {activeRoute.market === "SG" ? "SG" : "GB"}
        </text>
      </g>
      {pose && <InkVehicle mode={leg.mode} x={pose.x} y={pose.y} angle={pose.angle || 0} />}
    </g>
  );
}

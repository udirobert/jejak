import { useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import Stamp from "./Stamp";

const worldGeo = feature(worldTopo, worldTopo.objects.countries);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clamp01 = (v) => clamp(v, 0, 1);

// Ink-on-paper world map fitted tightly to the route. stops: [{lat,lng,country,code,date?}].
// progress 0..1 draws dashed arcs and reveals stops. stampAt: indices that get a
// full postmark Stamp (default: all stops). Stamps are pushed away from the route
// centroid and nudged to avoid overlap, with a leader line back to their dot.
export default function RouteMap({
  stops = [],
  progress = 1,
  width = 900,
  height = 520,
  padDegrees = 8,
  stampAt = null,
  extraRoutes = [],
  stampDelay = 0,
  stampClass = "h-14 w-14 sm:h-16 sm:w-16",
  fill = false,
  activeIndex = null,
  onSelectStop = null,
  className = "",
  reducedMotion = false,
  "aria-label": ariaLabel = "World map showing the product journey",
}) {
  const wrapRef = useRef(null);
  const [box, setBox] = useState({ w: width, h: height });

  // In fill mode the map measures its container so the route fills the column.
  useEffect(() => {
    if (!fill || !wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      if (r.width > 0 && r.height > 0) setBox({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [fill]);

  const W = fill ? box.w : width;
  const H = fill ? box.h : height;

  const { path, legs, pts } = useMemo(() => {
    const proj = geoEqualEarth();
    if (stops.length > 0) {
      const lngs = stops.map((s) => s.lng);
      const lats = stops.map((s) => s.lat);
      const coords = [
        [Math.min(...lngs) - padDegrees, Math.min(...lats) - padDegrees],
        [Math.max(...lngs) + padDegrees, Math.max(...lats) + padDegrees],
      ];
      proj.fitExtent([[16, 14], [W - 16, H - 14]], {
        type: "MultiPoint",
        coordinates: coords,
      });
    } else {
      proj.fitExtent([[16, 14], [W - 16, H - 14]], worldGeo);
    }
    const p = geoPath(proj);
    const projected = stops.map((s) => proj([s.lng, s.lat]));
    const legDs = [];
    for (let i = 0; i < projected.length - 1; i++) {
      const [x1, y1] = projected[i];
      const [x2, y2] = projected[i + 1];
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const k = 0.2;
      const cx = mx - (dy / len) * len * k;
      const cy = my + (dx / len) * len * k;
      legDs.push(`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    }
    const extraDs = (extraRoutes || []).flatMap((rs) => {
      const ppts = (rs || []).map((s) => proj([s.lng, s.lat]));
      const ds = [];
      for (let i = 0; i < ppts.length - 1; i++) {
        const [x1, y1] = ppts[i]; const [x2, y2] = ppts[i + 1];
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
        ds.push(`M ${x1} ${y1} Q ${mx - (dy / len) * len * 0.2} ${my + (dx / len) * len * 0.2} ${x2} ${y2}`);
      }
      return ds;
    });
    return { path: p, legs: legDs, pts: projected, extraDs };
  }, [stops, W, H, padDegrees, extraRoutes]);

  const stampIdx = useMemo(
    () => new Set(stampAt ?? stops.map((_, i) => i)),
    [stampAt, stops]
  );

  // Deterministic stamp placement: push outward from the route centroid, then
  // nudge along that direction until clear of previously placed stamps, then
  // clamp inside the map bounds. radius is in viewBox units (~half stamp box).
  const stampPos = useMemo(() => {
    const R = W >= 700 ? 34 : 26;
    const cx = pts.reduce((a, p) => a + p[0], 0) / (pts.length || 1);
    const cy = pts.reduce((a, p) => a + p[1], 0) / (pts.length || 1);
    const placed = [];
    return pts.map(([x, y], i) => {
      if (!stampIdx.has(i)) return null;
      let dx = x - cx;
      let dy = y - cy;
      if (Math.hypot(dx, dy) < 1) {
        dx = i % 2 === 0 ? 1 : -1;
        dy = -0.6;
      }
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      let d = R + 26;
      let sx = x + dx * d;
      let sy = y + dy * d;
      for (let iter = 0; iter < 12; iter++) {
        const clash = placed.some((p) => Math.hypot(sx - p[0], sy - p[1]) < R * 1.7);
        if (!clash) break;
        d += R * 0.9;
        sx = x + dx * d;
        sy = y + dy * d;
      }
      sx = clamp(sx, R, W - R);
      sy = clamp(sy, R, H - R);
      placed.push([sx, sy]);
      return { x: sx, y: sy, leader: Math.hypot(sx - x, sy - y) > R + 8 };
    });
  }, [pts, stampIdx, W, H]);

  const nLegs = Math.max(legs.length, 1);
  const legP = legs.map((_, i) => clamp01(progress * nLegs - i));
  const stopShown = stops.map((_, i) => progress * nLegs >= i - 0.001);
  const dashTransition = reducedMotion ? "none" : "stroke-dasharray 0.45s ease";
  // Route stroke ~1.75px on a ~900-unit map; scale with map size.
  const strokeW = Math.max(1.4, (W / 900) * 1.75);
  const dotR = Math.max(2.4, (W / 900) * 3);

  const svg = (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={fill ? "block h-full w-full" : "h-auto w-full"}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <pattern id="j-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--j-rule)" strokeWidth="0.7" opacity="0.7" />
        </pattern>
        {legs.map((d, i) => (
          <mask id={`leg-mask-${i}`} key={i} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <path
              d={d}
              fill="none"
              stroke="#fff"
              strokeWidth={strokeW * 3}
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray={`${legP[i]} 1`}
              style={{ transition: dashTransition }}
            />
          </mask>
        ))}
      </defs>
      <path d={path(geoGraticule10())} fill="none" stroke="var(--j-rule)" strokeWidth="0.5" opacity="0.6" />
      <path d={path(worldGeo)} fill="var(--j-paper-deep)" stroke="none" />
      <path d={path(worldGeo)} fill="url(#j-hatch)" stroke="none" />
      <path d={path(worldGeo)} fill="none" stroke="var(--j-ink)" strokeWidth="0.6" opacity="0.75" />
      {(extraDs || []).map((d, i) => (
        <path key={`ex-${i}`} d={d} fill="none" stroke="var(--j-ink-soft)" strokeWidth={strokeW * 0.55} strokeDasharray="2 5" opacity="0.55" strokeLinecap="round" />
      ))}
      {legs.map((d, i) => (
        <g key={i} mask={`url(#leg-mask-${i})`}>
          <path d={d} fill="none" stroke="var(--j-ink)" strokeWidth={strokeW} strokeDasharray={`${strokeW * 3} ${strokeW * 2.4}`} strokeLinecap="round" />
        </g>
      ))}
      {pts.map(([x, y], i) => {
        if (!stopShown[i]) return null;
        const interactive = Boolean(onSelectStop);
        const active = i === activeIndex;
        return (
          <g
            key={i}
            onClick={interactive ? () => onSelectStop(i) : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectStop(i); } } : undefined}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? `Stop ${i + 1}: ${stops[i].stage}, ${stops[i].country}` : undefined}
            style={interactive ? { cursor: "pointer", outline: "none" } : undefined}
          >
            {stampPos[i]?.leader && (
              <line x1={x} y1={y} x2={stampPos[i].x} y2={stampPos[i].y} stroke="var(--j-ink)" strokeWidth="0.7" opacity="0.55" />
            )}
            {interactive && (
              <circle cx={x} cy={y} r={Math.max(14, dotR * 4)} fill="transparent" />
            )}
            <circle cx={x} cy={y} r={dotR} fill={active ? "var(--j-stamp)" : "var(--j-ink)"} />
            <circle cx={x} cy={y} r={dotR * 2} fill="none" stroke={active ? "var(--j-stamp)" : "var(--j-ink)"} strokeWidth={active ? 1.4 : 0.8} opacity={active ? 0.95 : 0.5} />
            {active && <circle cx={x} cy={y} r={dotR * 3.1} fill="none" stroke="var(--j-stamp)" strokeWidth="0.8" strokeDasharray="2 3" />}
          </g>
        );
      })}
    </svg>
  );

  return (
    <div ref={wrapRef} className={`${fill ? "absolute inset-0" : "relative"} ${className}`}>
      {svg}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {stampPos.map((pos, i) =>
          pos && stopShown[i] ? (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(pos.x / W) * 100}%`, top: `${(pos.y / H) * 100}%` }}
            >
              <Stamp
                country={stops[i].country}
                code={stops[i].code}
                date={stops[i].date || `STOP ${String(i + 1).padStart(2, "0")}`}
                rotation={i % 2 === 0 ? -7 : 5}
                animate={!reducedMotion}
                delay={stampDelay}
                className={stampClass}
              />
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

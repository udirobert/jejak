import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import {
  Info,
  RotateCcw,
  Globe2,
  Map as MapIcon,
  Camera,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { ORIGIN_COORDS } from "./exploreUtils";
import { UNTRACED_CANDIDATE_ORIGINS } from "./exploreSeaRoutes";
import { MapSvgFlag } from "./OriginFlagChip";
import OriginFlagChip from "./OriginFlagChip";
import ExploreAmbientSea from "./ExploreAmbientSea";
import Globe from "@/components/Globe";
import { vibrate } from "@/lib/haptics";

const worldGeo = feature(worldTopo, worldTopo.objects.countries);

// Crop Antarctica so the inhabited continents scale to fill the full screen height
const croppedFeatures = worldGeo.features.filter(
  (f) => f.properties?.name !== "Antarctica" && String(f.id) !== "010"
);

const W = 420;
const H = 780;
const BASE_CLUSTER_RADIUS_PX = 36;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

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
  onTraceUntracedOrigin,
  activeRoute,
  globeRoute,
  reduce,
}) {
  const [viewMode, setViewMode] = useState("map"); // "map" | "globe"
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  const [hoveredOrigin, setHoveredOrigin] = useState(null);
  const [untracedPromptOrigin, setUntracedPromptOrigin] = useState(null);

  // Pan & zoom transform state: scaleExtent [1, 8], translateExtent clamped
  const [viewTransform, setViewTransform] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  const svgRef = useRef(null);
  const gestureRef = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    pinchDist: null,
    pinchMidX: W / 2,
    pinchMidY: H / 2,
    origScale: 1,
    lastTapMs: 0,
  });

  // Inverse scale so flags, dots, and labels remain readable at any zoom (1x to 8x)
  const invScale = useMemo(
    () => 1 / Math.pow(Math.max(1, viewTransform.scale), 0.78),
    [viewTransform.scale]
  );

  // Clamp pan within translateExtent so the map can pan freely even at 1x without exposing blank margins
  const clampTransform = (x, y, scale) => {
    const s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
    // Extra world pan slack at 1x (since projection extends beyond the 420px viewport) + full zoom extent up to 8x
    const maxShiftX = 85 * s + ((s - 1) * W) / 2;
    const maxShiftY = 45 * s + ((s - 1) * H) / 2;
    return {
      scale: s,
      x: Math.max(-maxShiftX, Math.min(maxShiftX, x)),
      y: Math.max(-maxShiftY, Math.min(maxShiftY, y)),
    };
  };

  // Convert client screen coordinates to SVG viewBox (0..W, 0..H) coordinates
  const clientToSvgPoint = (clientX, clientY) => {
    const el = svgRef.current;
    if (!el) return { sx: W / 2, sy: H / 2 };
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return { sx: W / 2, sy: H / 2 };
    // account for preserveAspectRatio="xMidYMid slice"
    const scaleX = rect.width / W;
    const scaleY = rect.height / H;
    const sliceScale = Math.max(scaleX, scaleY);
    const renderedW = W * sliceScale;
    const renderedH = H * sliceScale;
    const offsetX = (rect.width - renderedW) / 2;
    const offsetY = (rect.height - renderedH) / 2;
    return {
      sx: (clientX - rect.left - offsetX) / sliceScale,
      sy: (clientY - rect.top - offsetY) / sliceScale,
    };
  };

  // Zoom around a specific SVG focal point (sx, sy)
  const zoomAroundPoint = (targetScale, sx = W / 2, sy = H / 2) => {
    setViewTransform((prev) => {
      const nextScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetScale));
      const ratio = nextScale / prev.scale;
      const dxFromCenter = sx - W / 2;
      const dyFromCenter = sy - H / 2;
      const nextX = dxFromCenter - ratio * (dxFromCenter - prev.x);
      const nextY = dyFromCenter - ratio * (dyFromCenter - prev.y);
      return clampTransform(nextX, nextY, nextScale);
    });
  };

  const tracedSet = useMemo(
    () => new Set(originChips.map((c) => c.origin)),
    [originChips]
  );

  const liveCount = useMemo(
    () => originChips.reduce((sum, c) => sum + (c.real || 0), 0),
    [originChips]
  );

  // Scale the Antarctica-cropped map to fill the full vertical height behind sheet & tab bar
  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .rotate([-60, 0])
        .scale(210)
        .translate([W * 0.44, H * 0.52]),
    []
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);
  const graticulePath = useMemo(() => pathGen(geoGraticule10()), [pathGen]);

  const countries = useMemo(
    () =>
      croppedFeatures.map((f, idx) => {
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

  const allLandPath = useMemo(
    () => countries.map((c) => c.d).filter(Boolean).join(" "),
    [countries]
  );

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

  // Untraced candidate origins shown as subtle pulsing "?" dots
  const untracedPins = useMemo(
    () =>
      UNTRACED_CANDIDATE_ORIGINS.filter((name) => !tracedSet.has(name))
        .map((origin) => {
          const coords = ORIGIN_COORDS[origin];
          if (!coords) return null;
          const xy = projection(coords);
          if (!xy) return null;
          return { origin, x: xy[0], y: xy[1] };
        })
        .filter(Boolean),
    [tracedSet, projection]
  );

  // Re-compute clusters dynamically on zoom so clusters split into individual origins as you zoom in
  const clusters = useMemo(() => {
    const effectiveRadius =
      BASE_CLUSTER_RADIUS_PX / Math.pow(Math.max(1, viewTransform.scale), 0.9);
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
        if (dist <= effectiveRadius) {
          members.push(cand);
          visited.add(j);
        }
      }

      const cx =
        members.reduce((sum, m) => sum + m.x, 0) / members.length;
      const cy =
        members.reduce((sum, m) => sum + m.y, 0) / members.length;
      const id = members.map((m) => m.origin).join("|");

      groups.push({ id, cx, cy, members });
    }
    return groups;
  }, [rawPins, viewTransform.scale]);

  // Pointer & touch gesture handlers (pan at all zoom levels + pinch zoom + double-tap zoom + wheel zoom)
  const handlePointerDown = (e) => {
    if (e.pointerType === "touch" && gestureRef.current.pinchDist) return;
    gestureRef.current.dragging = true;
    gestureRef.current.moved = false;
    gestureRef.current.startX = e.clientX;
    gestureRef.current.startY = e.clientY;
    gestureRef.current.origX = viewTransform.x;
    gestureRef.current.origY = viewTransform.y;
  };

  const handlePointerMove = (e) => {
    if (!gestureRef.current.dragging || gestureRef.current.pinchDist) return;
    const dx = e.clientX - gestureRef.current.startX;
    const dy = e.clientY - gestureRef.current.startY;
    if (Math.hypot(dx, dy) > 4) {
      gestureRef.current.moved = true;
    }
    setViewTransform((prev) =>
      clampTransform(
        gestureRef.current.origX + dx,
        gestureRef.current.origY + dy,
        prev.scale
      )
    );
  };

  const handlePointerUp = () => {
    gestureRef.current.dragging = false;
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      gestureRef.current.dragging = false;
      gestureRef.current.moved = true;
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const midClientX = (t0.clientX + t1.clientX) / 2;
      const midClientY = (t0.clientY + t1.clientY) / 2;
      const { sx, sy } = clientToSvgPoint(midClientX, midClientY);
      gestureRef.current.pinchDist = d;
      gestureRef.current.pinchMidX = sx;
      gestureRef.current.pinchMidY = sy;
      gestureRef.current.origScale = viewTransform.scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && gestureRef.current.pinchDist) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const nextScale =
        gestureRef.current.origScale * (d / gestureRef.current.pinchDist);
      zoomAroundPoint(
        nextScale,
        gestureRef.current.pinchMidX,
        gestureRef.current.pinchMidY
      );
    }
  };

  const handleTouchEnd = () => {
    gestureRef.current.pinchDist = null;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const { sx, sy } = clientToSvgPoint(e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 1.18 : 0.85;
    zoomAroundPoint(viewTransform.scale * factor, sx, sy);
  };

  const handleBackgroundClick = (e) => {
    if (gestureRef.current.moved) return;

    // Double-tap / double-click zoom support
    const now = Date.now();
    if (now - gestureRef.current.lastTapMs < 280) {
      gestureRef.current.lastTapMs = 0;
      vibrate(5);
      const { sx, sy } = clientToSvgPoint(e.clientX, e.clientY);
      const nextScale =
        viewTransform.scale >= 4 ? 1 : Math.min(MAX_ZOOM, viewTransform.scale * 2);
      if (nextScale === 1) {
        setViewTransform({ scale: 1, x: 0, y: 0 });
      } else {
        zoomAroundPoint(nextScale, sx, sy);
      }
      return;
    }
    gestureRef.current.lastTapMs = now;

    if (expandedClusterId) setExpandedClusterId(null);
    if (untracedPromptOrigin) setUntracedPromptOrigin(null);
    if (onEmptyMapTap) onEmptyMapTap();
  };

  return (
    <div
      className="absolute inset-0 h-full w-full overflow-hidden select-none bg-[#0E2847] touch-none"
      style={{ touchAction: "none" }}
    >
      <AnimatePresence mode="wait">
        {viewMode === "map" ? (
          <motion.div
            key="2d-map"
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="h-full w-full touch-none"
            style={{ touchAction: "none" }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid slice"
              className="h-full w-full block cursor-grab active:cursor-grabbing touch-none"
              style={{ touchAction: "none" }}
              aria-label="Interactive world map of product origins"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              onClick={handleBackgroundClick}
            >
              <defs>
                <radialGradient id="deepOpenOceanBg" cx="48%" cy="46%" r="75%">
                  <stop offset="0%" stopColor="#174472" />
                  <stop offset="55%" stopColor="#113257" />
                  <stop offset="100%" stopColor="#0C223D" />
                </radialGradient>

                <filter
                  id="coastalShelfBlur"
                  x="-15%"
                  y="-15%"
                  width="130%"
                  height="130%"
                >
                  <feGaussianBlur stdDeviation="8" />
                </filter>

                <filter
                  id="nightShadowBlur"
                  x="-20%"
                  y="-10%"
                  width="140%"
                  height="120%"
                >
                  <feGaussianBlur stdDeviation="16" />
                </filter>

                <linearGradient
                  id="tracedLandFill"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FF8A65" />
                  <stop offset="55%" stopColor="#FFC24B" />
                  <stop offset="100%" stopColor="#FF5E7E" />
                </linearGradient>

                <linearGradient
                  id="selectedLandFill"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FFC24B" />
                  <stop offset="100%" stopColor="#2FBF71" />
                </linearGradient>

                <filter
                  id="originGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Open-water backdrop */}
              <rect
                x="0"
                y="0"
                width={W}
                height={H}
                fill="url(#deepOpenOceanBg)"
              />

              {/* Pan & Zoom Group */}
              <g
                transform={`translate(${
                  W / 2 + viewTransform.x
                }, ${H / 2 + viewTransform.y}) scale(${
                  viewTransform.scale
                }) translate(${-W / 2}, ${-H / 2})`}
              >
                {/* Lighter coastal shelf depth halo around all landmasses */}
                <path
                  d={allLandPath}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="16"
                  strokeLinejoin="round"
                  filter="url(#coastalShelfBlur)"
                  opacity="0.24"
                />

                {/* Subtle graticule */}
                <path
                  d={graticulePath}
                  fill="none"
                  stroke="#6395CC"
                  strokeWidth={0.5 * invScale}
                  strokeDasharray="4 6"
                  opacity="0.24"
                />

                {/* Continents (Antarctica cropped) */}
                {countries.map((c) => (
                  <path
                    key={c.key}
                    d={c.d}
                    fill={
                      c.isSelected
                        ? "url(#selectedLandFill)"
                        : c.isTraced
                        ? "url(#tracedLandFill)"
                        : "#235280"
                    }
                    fillOpacity={
                      c.isSelected ? 0.96 : c.isTraced ? 0.84 : 0.92
                    }
                    stroke={
                      c.isSelected
                        ? "#FFFFFF"
                        : c.isTraced
                        ? "#FFE49E"
                        : "#4982B8"
                    }
                    strokeWidth={
                      (c.isSelected ? 1.25 : c.isTraced ? 0.9 : 0.5) * invScale
                    }
                    onClick={(e) => {
                      if (gestureRef.current.moved || !c.isTraced) return;
                      e.stopPropagation();
                      vibrate(5);
                      setUntracedPromptOrigin(null);
                      onSelectOrigin(c.name);
                    }}
                    style={{ cursor: c.isTraced ? "pointer" : "default" }}
                  />
                ))}

                {/* Ambient Mixed Transport (Ships, Planes, Trains, Lorries), Day/Night Shadow, Wave Shimmer, Whale/Fin, Multi-Leg Route Sequence */}
                <ExploreAmbientSea
                  projection={projection}
                  W={W}
                  H={H}
                  zoom={viewTransform.scale}
                  activeRoute={activeRoute}
                  reduce={reduce}
                />

                {/* Untraced Candidate Origins: subtle pulsing "?" dots, labeled "No traces from here yet" on first view or tap */}
                {untracedPins.map((uPin, uIdx) => {
                  const isPromptOpen = untracedPromptOrigin === uPin.origin;
                  const showFirstViewHint =
                    uIdx === 0 &&
                    !untracedPromptOrigin &&
                    originFilter === "All";

                  return (
                    <g
                      key={`untraced-${uPin.origin}`}
                      transform={`translate(${uPin.x}, ${
                        uPin.y
                      }) scale(${invScale.toFixed(3)})`}
                      onClick={(e) => {
                        if (gestureRef.current.moved) return;
                        e.stopPropagation();
                        vibrate(5);
                        setUntracedPromptOrigin(
                          isPromptOpen ? null : uPin.origin
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {!reduce && (
                        <circle r="11" fill="#BAE6FD" opacity="0.22">
                          <animate
                            attributeName="r"
                            values="7;13;7"
                            dur="2.6s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.32;0.05;0.32"
                            dur="2.6s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                      <circle
                        r={isPromptOpen ? 8 : 6.5}
                        fill={isPromptOpen ? "#FFC24B" : "#153860"}
                        stroke="#BAE6FD"
                        strokeWidth="1.3"
                        strokeDasharray="2 1.5"
                      />
                      <text
                        y="2.8"
                        textAnchor="middle"
                        fill={isPromptOpen ? "#0F2440" : "#E0F2FE"}
                        fontSize="8.5"
                        fontWeight="900"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        ?
                      </text>

                      {/* First-view or tapped label: "No traces from here yet" */}
                      {(showFirstViewHint || isPromptOpen) && (
                        <g transform="translate(0, 14)">
                          <rect
                            x="-52"
                            y="-6.5"
                            width="104"
                            height="13.5"
                            rx="6.75"
                            fill="rgba(15, 36, 64, 0.92)"
                            stroke="#BAE6FD"
                            strokeWidth="0.75"
                          />
                          <text
                            x="0"
                            y="2.4"
                            textAnchor="middle"
                            fill="#E0F2FE"
                            fontSize="6.7"
                            fontWeight="800"
                            fontFamily="Plus Jakarta Sans, sans-serif"
                          >
                            No traces from here yet
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Traced Origin Dots and Zoom-Responsive Clusters (inverse-scaled so sizes stay readable) */}
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
                        transform={`translate(${cluster.cx}, ${
                          cluster.cy
                        }) scale(${invScale.toFixed(3)})`}
                        onClick={(e) => {
                          if (gestureRef.current.moved) return;
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
                        const fanRadius = count > 1 ? 28 * invScale : 0;
                        const px =
                          count > 1
                            ? cluster.cx + Math.cos(angle) * fanRadius
                            : pin.x;
                        const py =
                          count > 1
                            ? cluster.cy + Math.sin(angle) * fanRadius
                            : pin.y;

                        const showFullLabel =
                          pin.active ||
                          hoveredOrigin === pin.origin ||
                          viewTransform.scale >= 2.2;
                        const pillW = Math.max(
                          76,
                          pin.origin.length * 6.4 + 34
                        );
                        const halfW = pillW / 2;

                        return (
                          <g key={pin.origin}>
                            {count > 1 && (
                              <line
                                x1={pin.x}
                                y1={pin.y}
                                x2={px}
                                y2={py}
                                stroke="#FFC24B"
                                strokeWidth={1.2 * invScale}
                                strokeDasharray={`${2 * invScale} ${
                                  2 * invScale
                                }`}
                                opacity="0.8"
                              />
                            )}
                            <g
                              transform={`translate(${px}, ${py}) scale(${invScale.toFixed(
                                3
                              )})`}
                              onMouseEnter={() => setHoveredOrigin(pin.origin)}
                              onMouseLeave={() => setHoveredOrigin(null)}
                              onClick={(e) => {
                                if (gestureRef.current.moved) return;
                                e.stopPropagation();
                                vibrate(6);
                                setUntracedPromptOrigin(null);
                                onSelectOrigin(pin.origin);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              {!reduce && (
                                <circle
                                  r={pin.active ? 18 : 13}
                                  fill={pin.active ? "#2FBF71" : pin.color}
                                  opacity="0.32"
                                >
                                  <animate
                                    attributeName="r"
                                    values={
                                      pin.active ? "10;22;10" : "7;16;7"
                                    }
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

                              <circle
                                r={pin.active ? 8.5 : 6.5}
                                fill={pin.active ? "#2FBF71" : pin.color}
                                stroke="#FFFFFF"
                                strokeWidth={pin.active ? 2.4 : 1.8}
                                filter="url(#originGlow)"
                              />

                              {showFullLabel ? (
                                <g transform="translate(0, -16)">
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
              </g>
            </svg>
          </motion.div>
        ) : (
          /* Morph to 3D Globe view */
          <motion.div
            key="3d-globe"
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={handleBackgroundClick}
            className="flex h-full w-full flex-col items-center justify-center pb-20"
            style={{
              background:
                "radial-gradient(circle at 50% 42%, #1B4D7E 0%, #113257 60%, #0C223D 100%)",
            }}
          >
            <Globe
              route={globeRoute}
              activeStop={globeRoute.length}
              size={340}
              onSelectStop={(_, stop) => {
                if (stop?.country && tracedSet.has(stop.country)) {
                  onSelectOrigin(stop.country);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Card when tapping an untraced "?" origin dot */}
      <AnimatePresence>
        {untracedPromptOrigin && viewMode === "map" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.95 }}
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute left-4 right-4 top-28 z-30 flex items-center justify-between gap-2.5 rounded-2xl bg-[#102A49]/95 backdrop-blur-md border border-white/25 px-3.5 py-2.5 text-white shadow-xl"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <OriginFlagChip country={untracedPromptOrigin} size="xs" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">
                  {untracedPromptOrigin} · No traces from here yet
                </p>
                <p className="text-[11px] font-semibold text-sky-200/90">
                  Be the first to trace something from here
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  vibrate(6);
                  onTraceUntracedOrigin();
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-jejak-gold px-3 py-1.5 text-[11px] font-extrabold text-jejak-navy shadow-sm hover:brightness-105 no-tap"
              >
                <Camera size={12} /> Trace
              </button>
              <button
                type="button"
                aria-label="Dismiss prompt"
                onClick={() => setUntracedPromptOrigin(null)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 no-tap"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Zoom In / Out / Reset Control (only captures pointer events on its own buttons) */}
      {viewMode === "map" && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute right-4 top-32 z-20 flex flex-col items-center gap-1 rounded-2xl bg-[#122D4F]/85 backdrop-blur-md border border-white/25 p-1 shadow-lg"
        >
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => {
              vibrate(4);
              zoomAroundPoint(viewTransform.scale * 1.45);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-white hover:bg-white/15 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => {
              vibrate(4);
              const next = viewTransform.scale / 1.45;
              if (next <= 1.05) {
                setViewTransform({ scale: 1, x: 0, y: 0 });
              } else {
                zoomAroundPoint(next);
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-white hover:bg-white/15 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          {(viewTransform.scale > 1.02 ||
            Math.hypot(viewTransform.x, viewTransform.y) > 4) && (
            <button
              type="button"
              aria-label="Reset map view"
              onClick={() => {
                vibrate(4);
                setViewTransform({ scale: 1, x: 0, y: 0 });
              }}
              className="flex h-6 w-7 items-center justify-center rounded-lg bg-jejak-gold/90 text-[9px] font-extrabold text-jejak-navy no-tap"
            >
              1x
            </button>
          )}
        </div>
      )}

      {/* Top Overlay Bar: Origin status + Map/Globe toggle + Honesty info chip */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-20 px-4 space-y-1.5">
        <div className="flex items-center justify-between gap-1.5">
          {/* Left: Origin count + Reset */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-[#122D4F]/85 backdrop-blur-md border border-white/25 px-2.5 py-1 shadow-md"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full bg-jejak-materials ${
                  reduce ? "" : "animate-pulse"
                }`}
              />
              <span className="text-[11px] font-extrabold tracking-tight text-white truncate">
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
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  vibrate(5);
                  onSelectOrigin("All");
                }}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-jejak-gold px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy border border-white shadow-md hover:brightness-105 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <RotateCcw size={10} /> All
              </button>
            )}
          </div>

          {/* Right: Map / Globe Morph Toggle */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto inline-flex items-center rounded-full bg-[#122D4F]/85 backdrop-blur-md border border-white/25 p-0.5 shadow-md"
          >
            <button
              type="button"
              onClick={() => {
                vibrate(4);
                setViewMode("map");
              }}
              aria-pressed={viewMode === "map"}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-colors no-tap ${
                viewMode === "map"
                  ? "bg-jejak-gold text-jejak-navy shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <MapIcon size={11} /> Map
            </button>
            <button
              type="button"
              onClick={() => {
                vibrate(4);
                setViewMode("globe");
              }}
              aria-pressed={viewMode === "globe"}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-colors no-tap ${
                viewMode === "globe"
                  ? "bg-jejak-gold text-jejak-navy shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Globe2 size={11} /> Globe
            </button>
          </div>
        </div>

        {/* Honesty Info Chip: "Illustrative routes, not live tracking" */}
        <div className="flex justify-start">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              vibrate(5);
              onOpenInfo();
            }}
            aria-label="Community privacy and illustrative routes notice"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-[#122D4F]/80 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[10px] font-bold text-sky-100/95 shadow-sm hover:bg-[#122D4F] no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Info size={11} className="text-amber-300 shrink-0" />
            <span>Illustrative routes, not live tracking</span>
          </button>
        </div>
      </div>
    </div>
  );
}
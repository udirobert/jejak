import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import {
  Info,
  RotateCcw,
  Camera,
  X,
  Plus,
  Minus,
  Globe2,
  Map as MapIcon,
} from "lucide-react";
import { ORIGIN_COORDS } from "./exploreUtils";
import { UNTRACED_CANDIDATE_ORIGINS } from "./exploreSeaRoutes";
import { MapSvgFlag } from "./OriginFlagChip";
import OriginFlagChip from "./OriginFlagChip";
import InkRoute from "./InkRoute";
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
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  const [hoveredOrigin, setHoveredOrigin] = useState(null);
  const [untracedPromptOrigin, setUntracedPromptOrigin] = useState(null);
  // "map" = the ink field atlas · "globe" = the colourful spinning planet view
  const [viewMode, setViewMode] = useState("map");

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
      className="absolute inset-0 h-full w-full overflow-hidden select-none bg-journal-paper touch-none lg:!right-[400px]"
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
                <pattern id="atlasHatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="7" stroke="#D8CBB4" strokeWidth="0.7" />
                </pattern>
                <pattern id="atlasHatchTraced" width="7" height="7" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="7" stroke="#C8A17F" strokeWidth="0.9" />
                </pattern>
              </defs>



              {/* Pan & Zoom Group */}
              <g
                transform={`translate(${
                  W / 2 + viewTransform.x
                }, ${H / 2 + viewTransform.y}) scale(${
                  viewTransform.scale
                }) translate(${-W / 2}, ${-H / 2})`}
              >
                {/* Faint rule graticule */}
                <path
                  d={graticulePath}
                  fill="none"
                  stroke="var(--j-rule)"
                  strokeWidth={0.5 * invScale}
                  strokeDasharray="3 6"
                  opacity="0.6"
                />

                {/* Continents (Antarctica cropped) */}
                {/* Paper landmasses: hatched fill, ink coastlines; traced = denser hatch */}
                <path d={allLandPath} fill="#E8DFCF" stroke="var(--j-ink)" strokeWidth={0.6 * invScale} strokeLinejoin="round" />
                <path d={allLandPath} fill="url(#atlasHatch)" opacity="0.55" pointerEvents="none" />
                {countries.map((c) => (
                  <g key={c.key}>
                    {(c.isTraced || c.isSelected) && (
                      <path
                        d={c.d}
                        fill={c.isSelected ? "#E0CBA8" : "transparent"}
                        stroke={c.isSelected ? "var(--j-stamp)" : "var(--j-ink-soft)"}
                        strokeWidth={(c.isSelected ? 1.4 : 0.7) * invScale}
                        pointerEvents="none"
                      />
                    )}
                    <path
                      d={c.d}
                      fill="transparent"
                      onClick={(e) => {
                        if (gestureRef.current.moved || !c.isTraced) return;
                        e.stopPropagation();
                        vibrate(5);
                        setUntracedPromptOrigin(null);
                        onSelectOrigin(c.name);
                      }}
                      style={{ cursor: c.isTraced ? "pointer" : "default" }}
                    />
                  </g>
                ))}

                {/* Ambient background traffic: vessels on real corridors, wave shimmer, creatures. Active route ship stays on top via InkRoute. */}
                <ExploreAmbientSea
                  projection={projection}
                  W={W}
                  H={H}
                  zoom={viewTransform.scale}
                  activeRoute={null}
                  reduce={reduce}
                />

                {/* Ambient Mixed Transport (Ships, Planes, Trains, Lorries), Day/Night Shadow, Wave Shimmer, Whale/Fin, Multi-Leg Route Sequence */}
                <InkRoute
                  projection={projection}
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
                        <circle r="11" fill="var(--j-ink-soft)" opacity="0.15">
                          <animate attributeName="r" values="7;13;7" dur="2.6s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2.6s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle
                        r={isPromptOpen ? 8 : 6.5}
                        fill={isPromptOpen ? "var(--j-card)" : "var(--j-paper)"}
                        stroke="var(--j-ink-soft)"
                        strokeWidth="1.2"
                        strokeDasharray="2 1.5"
                      />
                      <text
                        y="2.8"
                        textAnchor="middle"
                        fill="var(--j-ink)"
                        fontSize="8.5"
                        fontWeight="500"
                        fontFamily="'IBM Plex Mono', monospace"
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
                            rx="2"
                            fill="var(--j-card)"
                            stroke="var(--j-rule)"
                            strokeWidth="0.75"
                          />
                          <text
                            x="0"
                            y="2.4"
                            textAnchor="middle"
                            fill="var(--j-ink-soft)"
                            fontSize="6.7"
                            fontWeight="500"
                            fontFamily="'IBM Plex Mono', monospace"
                          >
                            NO TRACES FROM HERE YET
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
                          <circle r="18" fill="none" stroke="var(--j-stamp)" strokeWidth="0.8" opacity="0.5">
                            <animate attributeName="r" values="13;23;13" dur="2.1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.5;0.06;0.5" dur="2.1s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <circle
                          r="12"
                          fill="var(--j-card)"
                          stroke="var(--j-stamp)"
                          strokeWidth="1.4"
                        />
                        <circle
                          r="9"
                          fill="none"
                          stroke="var(--j-stamp)"
                          strokeWidth="0.6"
                        />
                        <text
                          y="3.4"
                          textAnchor="middle"
                          fill="var(--j-stamp)"
                          fontSize="9.5"
                          fontWeight="500"
                          fontFamily="'IBM Plex Mono', monospace"
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
                                stroke="var(--j-ink-soft)"
                                strokeWidth={1 * invScale}
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
                                  r={pin.active ? 16 : 11}
                                  fill="none"
                                  stroke={pin.active ? "var(--j-stamp)" : "var(--j-ink-soft)"}
                                  strokeWidth="0.8"
                                  opacity="0.5"
                                >
                                  <animate
                                    attributeName="r"
                                    values={pin.active ? "9;20;9" : "6;14;6"}
                                    dur="1.9s"
                                    repeatCount="indefinite"
                                  />
                                  <animate
                                    attributeName="opacity"
                                    values="0.55;0.05;0.55"
                                    dur="1.9s"
                                    repeatCount="indefinite"
                                  />
                                </circle>
                              )}

                              <circle
                                r={pin.active ? 8 : 6}
                                fill={pin.active ? "var(--j-stamp)" : "var(--j-card)"}
                                stroke={pin.active ? "var(--j-stamp)" : "var(--j-ink)"}
                                strokeWidth={pin.active ? 1.4 : 1.1}
                              />

                              {showFullLabel ? (
                                <g transform="translate(0, -16)">
                                  <rect
                                    x={-halfW}
                                    y="-9"
                                    width={pillW}
                                    height="18"
                                    rx="2"
                                    fill={
                                      pin.active
                                        ? "var(--j-stamp)"
                                        : "var(--j-card)"
                                    }
                                    stroke="var(--j-ink)"
                                    strokeWidth="0.8"
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
                                    y="3.4"
                                    textAnchor="middle"
                                    fill={pin.active ? "var(--j-card)" : "var(--j-ink)"}
                                    fontSize="7.5"
                                    fontWeight="500"
                                    fontFamily="'IBM Plex Mono', monospace"
                                  >
                                    {pin.origin.toUpperCase()}
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
          /* Morph to the spinning planet view — the same atlas, in colour */
          <motion.div
            key="3d-globe"
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex h-full w-full flex-col items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 42%, #1B4D7E 0%, #113257 60%, #0C223D 100%)",
            }}
          >
            <div className="w-full max-w-[min(88vw,70vh)] aspect-square">
              <Globe
                route={globeRoute || []}
                activeStop={(globeRoute || []).length}
                focusedIdx={(globeRoute || []).length - 1}
                fluid
                onSelectStop={(_, stop) => {
                  if (stop?.country && tracedSet.has(stop.country)) {
                    vibrate(6);
                    onSelectOrigin(stop.country);
                  }
                }}
              />
            </div>
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
            className="pointer-events-auto absolute left-4 right-4 top-28 z-30 flex items-center justify-between gap-2.5 border border-journal-rule bg-journal-card px-3.5 py-2.5 text-journal-ink shadow-[4px_4px_0_0_var(--j-ink)]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <OriginFlagChip country={untracedPromptOrigin} size="xs" />
              <div className="min-w-0">
                <p className="font-grotesk text-xs font-semibold text-journal-ink truncate">
                  {untracedPromptOrigin} · No traces from here yet
                </p>
                <p className="font-grotesk text-[11px] text-journal-ink-soft">
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
                className="inline-flex items-center gap-1 border border-journal-ink bg-journal-ink px-3 py-1.5 font-grotesk text-[11px] font-semibold text-journal-card no-tap"
              >
                <Camera size={12} /> Trace
              </button>
              <button
                type="button"
                aria-label="Dismiss prompt"
                onClick={() => setUntracedPromptOrigin(null)}
                className="flex h-7 w-7 items-center justify-center border border-journal-rule text-journal-ink-soft hover:bg-journal-paper-deep no-tap"
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
          className="pointer-events-auto absolute right-4 top-32 z-20 flex flex-col items-center gap-1 border border-journal-rule bg-journal-card p-1 shadow-[3px_3px_0_0_rgba(30,27,22,0.15)]"
        >
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => {
              vibrate(4);
              zoomAroundPoint(viewTransform.scale * 1.45);
            }}
            className="flex h-9 w-9 items-center justify-center text-journal-ink hover:bg-journal-paper-deep no-tap focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
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
            className="flex h-9 w-9 items-center justify-center text-journal-ink hover:bg-journal-paper-deep no-tap focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
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
              className="flex h-8 w-9 items-center justify-center font-plexmono text-[9px] font-medium text-journal-stamp no-tap"
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
              className="pointer-events-auto inline-flex items-center gap-1.5 border border-journal-rule bg-journal-card px-2.5 py-1 shadow-[2px_2px_0_0_rgba(30,27,22,0.12)]"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full bg-jejak-materials ${
                  reduce ? "" : "animate-pulse"
                }`}
              />
              <span className="font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink truncate">
                {originFilter === "All"
                  ? `${originChips.length} origins`
                  : originFilter}
              </span>
              {liveCount > 0 && (
                <span className="font-plexmono text-[9px] uppercase text-journal-stamp tabular-nums">
                  {/* A count of one would point at the only person on the
                      map. Say "the first one" instead — same information,
                      nobody singled out. */}
                  · {liveCount === 1 ? "the first one" : `${liveCount} live`}
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
                className="pointer-events-auto inline-flex items-center gap-1 border border-journal-ink bg-journal-ink px-2.5 py-1 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-card no-tap focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
              >
                <RotateCcw size={10} /> All
              </button>
            )}

            {/* ink atlas ⇄ planet morph toggle */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto inline-flex items-center border border-journal-rule bg-journal-card p-0.5 shadow-[2px_2px_0_0_rgba(30,27,22,0.12)]"
            >
              {[
                { id: "map", label: "Map", icon: MapIcon },
                { id: "globe", label: "Globe", icon: Globe2 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    vibrate(4);
                    setViewMode(id);
                  }}
                  aria-pressed={viewMode === id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 font-plexmono text-[10px] uppercase tracking-[0.08em] transition-colors no-tap focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp ${
                    viewMode === id
                      ? "bg-journal-ink text-journal-card"
                      : "text-journal-ink-soft hover:text-journal-ink"
                  }`}
                >
                  <Icon size={11} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Honesty Info Chip */}
        <div className="flex justify-start">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              vibrate(5);
              onOpenInfo();
            }}
            aria-label="Community privacy and illustrative routes notice"
            className="pointer-events-auto inline-flex items-center gap-1.5 border border-journal-rule bg-journal-card px-2.5 py-1 font-plexmono text-[9px] uppercase tracking-[0.1em] text-journal-ink-soft shadow-[2px_2px_0_0_rgba(30,27,22,0.1)] no-tap focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
          >
            <Info size={11} className="text-journal-stamp shrink-0" />
            <span>Illustrative routes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
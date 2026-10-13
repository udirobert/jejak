import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getRoute, formatMoney } from "@/lib/money";
import { routeDistance } from "@/lib/metrics";
import ScreenShell from "@/components/ScreenShell";
import Globe from "@/components/Globe";
import StageIllustration from "@/components/StageIllustration";
import TodaySnapPulse from "@/components/TodaySnapPulse";
import CoachmarkPill from "@/components/CoachmarkPill";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { ArrowRight, MapPin, Compass, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export default function Journey() {
  const { product, market, currency, setScreen, shareMode, setShareMode } = useApp();
  const reduce = useReducedMotion();
  const route = getRoute(product, market);
  const totalKm = routeDistance(product, market);
  const price = product.markets[market].price;

  const [activeIdx, setActiveIdx] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(true);
  const [pulseOpen, setPulseOpen] = useState(false);

  // Auto-advance the stepper through each stop once so the 3D globe spins stop-to-stop.
  useEffect(() => {
    setActiveIdx(0);
    setAutoPlaying(true);
  }, [product.id, market]);

  useEffect(() => {
    if (!autoPlaying || reduce) return;
    if (activeIdx >= route.length - 1) {
      setAutoPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      vibrate(5);
      setActiveIdx((i) => Math.min(route.length - 1, i + 1));
    }, 1500);
    return () => clearTimeout(t);
  }, [activeIdx, autoPlaying, route.length, reduce]);

  const currentStop = route[activeIdx] || route[0];

  const selectStop = (i) => {
    vibrate(6);
    setAutoPlaying(false);
    setActiveIdx(i);
  };

  return (
    <ScreenShell variant="sunrise">
      <div className="flex flex-1 flex-col px-5 pb-6">
        {/* Compact header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-1">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              <Compass size={11} /> {route.length}-stop trade route
            </span>
            <span className="rounded-full bg-jejak-navy/30 px-2.5 py-0.5 text-[11px] font-extrabold text-white tabular-nums">
              {totalKm.toLocaleString()} km
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            {product.emoji} {product.name} · {formatMoney(price, currency)}
          </h1>
        </motion.div>

        <CoachmarkPill
          id="journey_globe"
          stepBadge="Step 2 of 3"
          text="Spin the 3D globe or tap any numbered country below to inspect each factory stage."
          variant="dark"
        />

        {/* Interactive 3D Globe */}
        <div className="relative mt-1.5 flex flex-col items-center justify-center">
          <div className="rounded-full bg-white/20 p-1.5 backdrop-blur-sm shadow-xl">
            <Globe
              route={route}
              activeStop={route.length}
              size={270}
              focusedIdx={activeIdx}
              onSelectStop={selectStop}
            />
          </div>
        </div>

        {/* Single-Card Progressive Disclosure Stage Stepper (replaces long vertical card list) */}
        <div className="mt-2.5">
          {/* Interactive step pills */}
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              {route.map((s, i) => {
                const isCurr = i === activeIdx;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectStop(i)}
                    className={`h-6 rounded-full px-2.5 text-[10px] font-extrabold transition-all no-tap ${
                      isCurr
                        ? "bg-jejak-navy text-white shadow"
                        : "bg-white/40 text-jejak-navy/80 hover:bg-white/70"
                    }`}
                  >
                    {i + 1}. {s.country}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => selectStop((activeIdx - 1 + route.length) % route.length)}
                aria-label="Previous stop"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-jejak-navy no-tap"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => selectStop((activeIdx + 1) % route.length)}
                aria-label="Next stop"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-jejak-navy no-tap"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Animated active stage card with bespoke SVG illustration */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, x: 18, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -18, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="flex items-center gap-3 rounded-2xl frosted-strong border border-white/85 p-3 shadow-md"
            >
              <StageIllustration stage={currentStop.stage} index={activeIdx} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-extrabold text-jejak-navy">
                    {activeIdx + 1}. {currentStop.stage}
                  </p>
                  {currentStop.value != null && (
                    <span className="shrink-0 rounded-full bg-jejak-navy/10 px-2 py-0.5 text-[10px] font-extrabold text-jejak-navy tabular-nums">
                      ~{currentStop.value}% value
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-jejak-navy/70">
                  <MapPin size={11} className="text-jejak-coral" /> {currentStop.country} ·{" "}
                  <span className="font-semibold text-jejak-navy/60 truncate">
                    {currentStop.note}
                  </span>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Collapsible privacy / community pulse pill */}
        <div className="mt-2.5">
          {!pulseOpen ? (
            <button
              type="button"
              onClick={() => {
                vibrate(5);
                setPulseOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl bg-white/45 px-3 py-1.5 text-[11px] font-bold text-jejak-navy no-tap"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-jejak-navy/70" />
                Visibility: <strong className="capitalize">{shareMode}</strong>
              </span>
              <span className="underline opacity-75">Change</span>
            </button>
          ) : (
            <TodaySnapPulse
              product={product}
              shareMode={shareMode}
              setShareMode={setShareMode}
            />
          )}
        </div>

        <motion.button
          type="button"
          whileTap={TAP}
          onClick={() => {
            vibrate(8);
            setScreen("split");
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-jejak-navy py-3.5 text-sm font-extrabold text-white shadow-lg no-tap"
        >
          Drop the coins · see the split <ArrowRight size={16} />
        </motion.button>
      </div>
    </ScreenShell>
  );
}
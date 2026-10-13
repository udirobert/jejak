import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getRoute, formatMoney } from "@/lib/money";
import { routeDistance } from "@/lib/metrics";
import ScreenShell from "@/components/ScreenShell";
import Globe from "@/components/Globe";
import TodaySnapPulse from "@/components/TodaySnapPulse";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { RotateCcw, ArrowRight, MapPin, Compass, Hand } from "lucide-react";

export default function Journey() {
  const { product, market, currency, setScreen, shareMode, setShareMode } = useApp();
  const reduce = useReducedMotion();
  const route = getRoute(product, market);
  const totalKm = routeDistance(product, market);
  const price = product.markets[market].price;
  const [revealed, setRevealed] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [focusedIdx, setFocusedIdx] = useState(null);

  // Reveal one stop at a time.
  useEffect(() => {
    setRevealed(0);
    setFocusedIdx(null);
    const timers = route.map((_, i) =>
      setTimeout(() => setRevealed(i + 1), reduce ? 150 : 520 * i + 300)
    );
    return () => timers.forEach(clearTimeout);
  }, [route, reduce, replayKey]);

  const replay = () => {
    vibrate(6);
    setReplayKey((k) => k + 1);
  };

  return (
    <ScreenShell variant="sunrise">
      <div className="flex flex-1 flex-col px-5 pb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-1">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              <Compass size={11} /> Live 3D trade route
            </span>
            <span className="rounded-full bg-jejak-navy/30 px-2.5 py-0.5 text-[11px] font-extrabold text-white tabular-nums">
              {totalKm.toLocaleString()} km
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold text-white">
            {product.emoji} {product.name} · {formatMoney(price, currency)}
          </h1>
          <p className="text-xs font-semibold text-white/85">
            {route.length} stops · {route[0]?.country} → {route[route.length - 1]?.country}
          </p>
        </motion.div>

        <div className="relative mt-2 flex flex-col items-center justify-center">
          <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm shadow-xl">
            <Globe
              key={replayKey}
              route={route}
              activeStop={revealed}
              focusedIdx={focusedIdx}
              onSelectStop={(idx) => setFocusedIdx((prev) => (prev === idx ? null : idx))}
            />
          </div>
          <span className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-white/85">
            <Hand size={11} /> Drag globe to spin · tap any stop below to focus
          </span>
        </div>

        <div className="mt-2.5 space-y-2">
          <AnimatePresence>
            {route.slice(0, revealed).map((stop, i) => {
              const isFocused = focusedIdx === i;
              return (
                <motion.button
                  key={`${replayKey}-${i}`}
                  type="button"
                  whileTap={TAP}
                  onClick={() => {
                    vibrate(6);
                    setFocusedIdx((prev) => (prev === i ? null : i));
                  }}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all no-tap ${
                    isFocused
                      ? "bg-jejak-navy text-white shadow-lg ring-2 ring-white/80"
                      : "frosted text-jejak-navy hover:bg-white/90"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                      isFocused
                        ? "bg-amber-300 text-jejak-navy"
                        : i === 0
                        ? "bg-jejak-labour text-white"
                        : "bg-jejak-navy text-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{stop.stage}</p>
                    <p
                      className={`flex items-center gap-1 text-xs ${
                        isFocused ? "text-white/80" : "text-jejak-navy/65"
                      }`}
                    >
                      <MapPin size={11} /> {stop.country}
                    </p>
                  </div>
                  <div className="text-right max-w-[44%]">
                    <span
                      className={`block text-[11px] font-semibold leading-tight ${
                        isFocused ? "text-amber-300" : "text-jejak-navy/55"
                      }`}
                    >
                      {stop.note}
                    </span>
                    {stop.value != null && (
                      <span
                        className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums ${
                          isFocused
                            ? "bg-white/15 text-white"
                            : "bg-jejak-navy/10 text-jejak-navy/70"
                        }`}
                      >
                        ~{stop.value}% value added
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-4">
          <TodaySnapPulse
            product={product}
            shareMode={shareMode}
            setShareMode={setShareMode}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={replay}
            className="flex items-center gap-1.5 rounded-full frosted border border-white/60 px-4 py-2.5 text-sm font-bold text-jejak-navy no-tap"
          >
            <RotateCcw size={15} /> Replay
          </button>
          <motion.button
            type="button"
            whileTap={TAP}
            onClick={() => {
              vibrate(8);
              setScreen("split");
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-jejak-navy px-4 py-3 text-sm font-extrabold text-white shadow-lg no-tap"
          >
            See where your money went <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    </ScreenShell>
  );
}
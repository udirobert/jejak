import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getRoute } from "@/lib/money";
import ScreenShell from "@/components/ScreenShell";
import Globe from "@/components/Globe";
import { RotateCcw, ArrowRight, MapPin } from "lucide-react";

export default function Journey() {
  const { product, market, setScreen } = useApp();
  const reduce = useReducedMotion();
  const route = getRoute(product, market);
  const [revealed, setRevealed] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  // Reveal one stop at a time.
  useEffect(() => {
    setRevealed(0);
    const timers = route.map((_, i) =>
      setTimeout(() => setRevealed(i + 1), reduce ? 150 : 650 * i + 400)
    );
    return () => timers.forEach(clearTimeout);
  }, [route, reduce, replayKey]);

  const replay = () => setReplayKey((k) => k + 1);

  return (
    <ScreenShell variant="sunrise">
      <div className="flex flex-1 flex-col px-5 pb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">Likely journey</p>
          <h1 className="text-2xl font-extrabold text-white">{product.name}</h1>
          <p className="text-sm font-semibold text-white/80">
            {route.length} stops · {route[0]?.country} → {route[route.length - 1]?.country}
          </p>
        </motion.div>

        <div className="relative mt-2 flex justify-center">
          <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
            <Globe key={replayKey} route={route} activeStop={revealed} />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <AnimatePresence>
            {route.slice(0, revealed).map((stop, i) => (
              <motion.div
                key={`${replayKey}-${i}`}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="flex items-center gap-3 rounded-2xl frosted p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jejak-navy text-xs font-extrabold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-jejak-navy">{stop.stage}</p>
                  <p className="flex items-center gap-1 text-xs text-jejak-navy/60">
                    <MapPin size={11} /> {stop.country}
                  </p>
                </div>
                <span className="text-right text-[11px] font-semibold text-jejak-navy/50 max-w-[40%]">{stop.note}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={replay}
            className="flex items-center gap-1.5 rounded-full frosted border border-white/60 px-4 py-2.5 text-sm font-bold text-jejak-navy no-tap"
          >
            <RotateCcw size={15} /> Replay
          </button>
          <button
            type="button"
            onClick={() => setScreen("split")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-jejak-navy px-4 py-3 text-sm font-extrabold text-white no-tap"
          >
            See where your money went <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
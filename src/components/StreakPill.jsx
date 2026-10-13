import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Route, Coins } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { formatMoney } from "@/lib/money";

// Tiny rAF count-up so the streak feels rewarding each time it grows.
function CountUp({ value, duration = 750 }) {
  const [n, setN] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = prev.current;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return n;
}

// Session-long impact streak — surfaces the engagement loop on Home.
export default function StreakPill() {
  const { traces, distanceTotal, workerTotal, currency } = useApp();
  if (!traces) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="flex items-center gap-2.5 rounded-2xl frosted border border-white/70 px-3.5 py-2"
    >
      <span className="flex items-center gap-1 text-xs font-bold text-jejak-navy">
        <Flame size={14} className="text-jejak-coral" />
        <CountUp value={traces} /> traced
      </span>
      <span className="h-3.5 w-px bg-jejak-navy/15" />
      <span className="flex items-center gap-1 text-xs font-bold text-jejak-navy">
        <Route size={14} className="text-jejak-freight" />
        <CountUp value={distanceTotal} /> km
      </span>
      <span className="h-3.5 w-px bg-jejak-navy/15" />
      <span className="flex items-center gap-1 text-xs font-bold text-jejak-navy">
        <Coins size={14} className="text-jejak-labour" />
        {formatMoney(workerTotal, currency)} to workers
      </span>
    </motion.div>
  );
}
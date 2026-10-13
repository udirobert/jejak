import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ConfidenceBadge from "./ConfidenceBadge";

// Swipeable carousel of impact metrics — one huge number, an everyday
// comparison, a confidence badge and a cited source per card.
export default function MetricsCarousel({ metrics, interval = 3800 }) {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || metrics.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % metrics.length), interval);
    return () => clearInterval(t);
  }, [reduce, metrics.length, interval]);

  if (!metrics.length) return null;
  const m = metrics[idx];

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl frosted p-5"
        style={{ borderTop: `4px solid ${m.color}` }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={m.key}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-jejak-navy/50">{m.label}</p>
              <ConfidenceBadge level={m.confidence} />
            </div>
            <p className="mt-2 text-4xl font-extrabold leading-none" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="mt-2 text-sm font-semibold text-jejak-navy/70">{m.everyday}</p>
            {m.range && <p className="mt-0.5 text-xs text-jejak-navy/50">Range {m.range}</p>}
            <p className="mt-2 text-[11px] font-semibold text-jejak-navy/45">
              Source: {m.source} · Basis: {m.basis}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        {metrics.map((metric, i) => (
          <button
            key={metric.key}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Show ${metric.label}`}
            className={`h-1.5 rounded-full transition-all no-tap ${
              i === idx ? "w-6 bg-jejak-navy" : "w-1.5 bg-jejak-navy/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
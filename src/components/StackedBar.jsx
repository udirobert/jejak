import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "@/lib/money";

// Horizontal stacked bar with the same colours as the coin columns.
// Each segment shows amount + percentage for the active currency.
export default function StackedBar({ split, currency }) {
  const reduce = useReducedMotion();
  return (
    <div className="w-full">
      <div
        className="flex h-12 w-full overflow-hidden rounded-2xl frosted border border-white/70"
        role="img"
        aria-label="Money split stacked bar"
      >
        {split.map((cat, i) => (
          <motion.div
            key={cat.key}
            className="relative flex items-center justify-center"
            style={{ background: cat.color }}
            initial={{ width: 0 }}
            animate={{ width: `${cat.pct.mid}%` }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 90, damping: 18, delay: 0.1 + i * 0.05 }}
          >
            {cat.pct.mid >= 10 && (
              <span className="text-[10px] font-extrabold text-white drop-shadow-sm">{cat.pct.mid}%</span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {split.map((cat) => (
          <div key={cat.key} className="flex items-center gap-2 text-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
            <span className="font-semibold text-jejak-navy/80">{cat.label}</span>
            <span className="ml-auto font-extrabold text-jejak-navy">
              {formatMoney(cat.amount, currency)}
            </span>
            <span className="text-jejak-navy/50 w-9 text-right">{cat.pct.mid}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
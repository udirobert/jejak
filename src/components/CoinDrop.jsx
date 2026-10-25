import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// The price as 100 coins (one per 1%) dropping into five frosted-glass columns.
// Each column fills to its category share; coins rain in with spring easing.
// `split` = output of computeSplit() — array of {key,label,color,pct,amount}.
export default function CoinDrop({ split }) {
  const reduce = useReducedMotion();
  const COL_H = 230;
  const COIN_R = 7;

  return (
    <div className="flex items-end justify-between gap-2 px-1" role="list" aria-label="Money split as 100 coins">
      {split.map((cat, catIdx) => {
        const count = Math.round(cat.pct.mid);
        const fillH = (cat.pct.mid / 100) * COL_H;
        const spacing = count > 1 ? fillH / count : 0;
        return (
          <div key={cat.key} className="flex flex-1 flex-col items-center" role="listitem" aria-label={`${cat.label}: ${cat.pct.mid}%`}>
            <div
              className="relative w-full overflow-hidden border border-journal-rule bg-journal-card"
              style={{ height: COL_H, maxWidth: 64 }}
            >
              {/* fill glow */}
              <motion.div
                className="absolute inset-x-0 bottom-0 rounded-2xl"
                style={{ background: `linear-gradient(180deg, ${cat.color}14, ${cat.color}38)` }}
                initial={{ height: 0 }}
                animate={{ height: fillH }}
                transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
              />
              {/* coins */}
              {!reduce &&
                Array.from({ length: count }, (_, i) => (
                  <motion.span
                    key={`${cat.key}-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: COIN_R * 2,
                      height: COIN_R * 2,
                      left: "50%",
                      marginLeft: -COIN_R,
                      bottom: 4 + i * spacing,
                      background: cat.color,
                      border: "1.5px solid var(--j-ink)",
                      boxShadow: "inset 0 0 0 2px var(--j-card), inset 0 0 0 3px var(--j-ink)",
                      willChange: "transform, opacity",
                    }}
                    initial={{ y: -COL_H - 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 16,
                      delay: 0.15 + i * 0.012 + catIdx * 0.02,
                    }}
                  />
                ))}
              {reduce && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-plexmono text-xl font-medium" style={{ color: cat.color }}>{count}</span>
                </div>
              )}
            </div>
            <span className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.08em]" style={{ color: cat.color }}>{cat.label.split(" ")[0]}</span>
            <span className="font-plexmono text-[11px] font-medium text-journal-ink">{cat.pct.mid}%</span>
          </div>
        );
      })}
    </div>
  );
}
import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { formatMoney } from "@/lib/money";
import { vibrate } from "@/lib/haptics";
import { ChevronRight } from "lucide-react";

// Interactive scrubbable horizontal bar. Tapping any colored segment highlights it
// and reveals a single compact progressive-disclosure callout pill underneath
// (with a 1-tap "Deep dive" trigger into DetailDrawer).
export default function StackedBar({ split, currency, onInspectCategory }) {
  const reduce = useReducedMotion();
  const [selectedKey, setSelectedKey] = useState("labour");
  const active = split.find((c) => c.key === selectedKey) || split[0];

  return (
    <div className="w-full">
      <div
        className="flex h-11 w-full overflow-hidden rounded-2xl frosted border border-white/80 p-1 gap-0.5"
        role="group"
        aria-label="Interactive money split bar — tap a segment to inspect"
      >
        {split.map((cat, i) => {
          const isSelected = cat.key === active.key;
          return (
            <motion.button
              key={cat.key}
              type="button"
              onClick={() => {
                vibrate(6);
                setSelectedKey(cat.key);
              }}
              className="relative flex items-center justify-center rounded-xl transition-opacity no-tap focus:outline-none"
              style={{
                background: cat.color,
                opacity: isSelected ? 1 : 0.72,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${cat.pct.mid}%` }}
              transition={
                reduce
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 110, damping: 19, delay: i * 0.04 }
              }
              aria-label={`${cat.label}: ${cat.pct.mid}%`}
            >
              {cat.pct.mid >= 11 && (
                <span className="text-[10px] font-extrabold text-white drop-shadow-sm tabular-nums">
                  {cat.pct.mid}%
                </span>
              )}
              {isSelected && (
                <motion.span
                  layoutId="barFocusRing"
                  className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-jejak-navy"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Category dot selector pills + single active callout */}
      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="flex flex-wrap items-center gap-1">
          {split.map((cat) => {
            const isSelected = cat.key === active.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  vibrate(5);
                  setSelectedKey(cat.key);
                }}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold transition-all no-tap ${
                  isSelected
                    ? "bg-jejak-navy text-white shadow-sm"
                    : "bg-white/65 text-jejak-navy/70 hover:bg-white"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: cat.color }}
                />
                {cat.label.split(" ")[0]}
              </button>
            );
          })}
        </div>

        {onInspectCategory && (
          <AnimatePresence mode="wait">
            <motion.button
              key={active.key}
              type="button"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              onClick={() => {
                vibrate(8);
                onInspectCategory(active.key);
              }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-white/90 border border-white px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy shadow-sm no-tap"
            >
              <span className="tabular-nums" style={{ color: active.color }}>
                {formatMoney(active.amount, currency)}
              </span>
              <span className="text-jejak-navy/50 tabular-nums">({active.pct.mid}%)</span>
              <ChevronRight size={12} className="text-jejak-navy/50" />
            </motion.button>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
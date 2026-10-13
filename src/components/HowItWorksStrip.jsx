import React from "react";
import { motion } from "framer-motion";
import { Camera, Globe2, Coins, Play } from "lucide-react";
import { vibrate } from "@/lib/haptics";

const STEPS = [
  { num: "1", label: "Scan & label", sub: "Item + care tag", icon: Camera, color: "#FF7A1A" },
  { num: "2", label: "Provenance", sub: "Route + Stellar hash", icon: Globe2, color: "#2D5BFF" },
  { num: "3", label: "Follow money", sub: "5-way cost split", icon: Coins, color: "#2FBF71" },
];

// Compact 1-2-3 visual strip on the Home screen that teaches the entire
// mental model in 2 seconds and offers a 1-tap interactive guided demo.
export default function HowItWorksStrip({ onStartGuidedDemo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2.5 rounded-2xl frosted-strong border border-white/85 px-3 py-2.5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {STEPS.map(({ num, label, sub, icon: Icon, color }) => (
            <div key={num} className="flex items-center gap-1.5 min-w-0">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white shadow-sm"
                style={{ background: color }}
              >
                <Icon size={12} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-extrabold leading-tight text-jejak-navy">
                  {num}. {label}
                </p>
                <p className="truncate text-[9px] font-semibold leading-tight text-jejak-navy/55">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {onStartGuidedDemo && (
          <button
            type="button"
            onClick={() => {
              vibrate(8);
              onStartGuidedDemo();
            }}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-jejak-navy px-2.5 py-1.5 text-[10px] font-extrabold text-amber-300 shadow-sm hover:opacity-95 no-tap"
          >
            <Play size={10} fill="currentColor" /> 15s Tour
          </button>
        )}
      </div>
    </motion.div>
  );
}
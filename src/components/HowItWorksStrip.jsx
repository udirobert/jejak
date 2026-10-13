import React from "react";
import { Camera, ShieldCheck, Coins } from "lucide-react";

const STEPS = [
  { label: "Scan", icon: Camera, color: "#FF7A1A" },
  { label: "Prove", icon: ShieldCheck, color: "#2D5BFF" },
  { label: "Follow", icon: Coins, color: "#2FBF71" },
];

// Crisp 3-pill step strip using icon + one-word label (Scan / Prove / Follow)
// with zero truncation at 375px width and no duplicate Tour button.
export default function HowItWorksStrip() {
  return (
    <div
      aria-label="How Jejak works: Scan, Prove, Follow"
      className="mt-2.5 grid grid-cols-3 gap-2"
    >
      {STEPS.map(({ label, icon: Icon, color }, idx) => (
        <div
          key={label}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/14 border border-white/25 px-2.5 py-2 text-white backdrop-blur-md"
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
            style={{ background: color }}
          >
            <Icon size={11} />
          </span>
          <span className="text-xs font-extrabold tracking-tight whitespace-nowrap">
            {idx + 1}. {label}
          </span>
        </div>
      ))}
    </div>
  );
}
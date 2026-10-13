import React from "react";
import { motion } from "framer-motion";
import ShutterButton from "./ShutterButton";
import { CATEGORIES } from "@/lib/tokens";
import { TAP } from "@/lib/motion";
import { Camera, Image as ImageIcon, ShieldCheck } from "lucide-react";

const PREVIEW_SPLIT = [
  { key: "materials", pct: 18, color: CATEGORIES[0].color },
  { key: "labour", pct: 7.5, color: CATEGORIES[1].color },
  { key: "freight", pct: 9.5, color: CATEGORIES[2].color },
  { key: "brand", pct: 30, color: CATEGORIES[3].color },
  { key: "retail", pct: 35, color: CATEGORIES[4].color },
];

// Frosted camera viewfinder card with corner brackets, live thesis preview bar,
// primary shutter action, and photo library upload button.
export default function ViewfinderStage({ onPickCamera, onPickLibrary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.05 }}
      className="relative mt-4 rounded-3xl frosted-strong border border-white/80 p-4 shadow-xl overflow-hidden"
    >
      {/* Corner viewfinder brackets */}
      <span className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 border-l-2 border-t-2 border-jejak-navy/35 rounded-tl-md" />
      <span className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 border-r-2 border-t-2 border-jejak-navy/35 rounded-tr-md" />
      <span className="pointer-events-none absolute left-3.5 bottom-3.5 h-4 w-4 border-l-2 border-b-2 border-jejak-navy/35 rounded-bl-md" />
      <span className="pointer-events-none absolute right-3.5 bottom-3.5 h-4 w-4 border-r-2 border-b-2 border-jejak-navy/35 rounded-br-md" />

      {/* Top provenance preview strip */}
      <div className="rounded-2xl bg-white/80 border border-white/90 px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/60">
          <span>Trace where it came from</span>
          <span className="text-jejak-freight">Stellar MEMO_HASH anchor</span>
        </div>
        <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-jejak-navy/10">
          {PREVIEW_SPLIT.map((seg) => (
            <div
              key={seg.key}
              style={{ width: `${seg.pct}%`, background: seg.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-jejak-navy/55">
          <span>Origin route + care-label evidence + cost split</span>
          <span className="flex items-center gap-1 text-jejak-materials font-bold">
            <ShieldCheck size={11} /> Private AI scan
          </span>
        </div>
      </div>

      {/* Center shutter button */}
      <div className="my-4 flex flex-col items-center justify-center">
        <ShutterButton onPick={onPickCamera} />
        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-extrabold text-jejak-navy">
          <Camera size={14} className="text-jejak-coral" /> Tap to trace · map origins & anchor on Stellar
        </p>
      </div>

      {/* Secondary photo library button */}
      <motion.button
        type="button"
        onClick={onPickLibrary}
        whileTap={TAP}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-jejak-navy py-3 px-4 text-xs font-extrabold text-white shadow-md no-tap hover:bg-jejak-navy/90 transition-colors"
      >
        <ImageIcon size={15} /> Upload from photo library
      </motion.button>
    </motion.div>
  );
}
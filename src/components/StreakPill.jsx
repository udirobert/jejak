import React from "react";
import { motion } from "framer-motion";
import { Flame, Coins, Radio, ArrowUpRight, Stamp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { formatMoney } from "@/lib/money";
import { vibrate } from "@/lib/haptics";

// Self-explanatory session progress bar ("2 traced · 1 of 4 origins mapped · £15.00 to makers").
export default function StreakPill() {
  const { traces, workerTotal, origins = [], currency } = useApp();
  const navigate = useNavigate();

  if (!traces) {
    return (
      <motion.button
        type="button"
        onClick={() => {
          vibrate(6);
          navigate("/explore");
        }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[40px] flex w-full items-center justify-between gap-2 rounded-2xl bg-white/10 border border-white/20 px-3.5 py-1.5 text-left text-white backdrop-blur-md no-tap hover:bg-white/15 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-extrabold">
          <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
            <Radio size={11} /> Live map
          </span>
          <span>0 of 4 origins mapped</span>
        </span>
        <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-300 shrink-0">
          Explore <ArrowUpRight size={13} />
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => {
        vibrate(6);
        navigate("/impact");
      }}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[40px] flex w-full items-center justify-between gap-1.5 rounded-2xl bg-white/12 border border-white/25 px-3 py-1.5 text-white tabular-nums backdrop-blur-md no-tap hover:bg-white/20"
    >
      <span className="flex items-center gap-1 text-[11px] font-extrabold whitespace-nowrap">
        <Flame size={12} className="text-amber-300 shrink-0" />
        <span>{traces} traced</span>
      </span>
      <span className="h-3 w-px bg-white/20" />
      <span className="flex items-center gap-1 text-[11px] font-extrabold whitespace-nowrap">
        <Stamp size={12} className="text-sky-300 shrink-0" />
        <span>{Math.min(origins.length, 4)} of 4 origins mapped</span>
      </span>
      <span className="h-3 w-px bg-white/20" />
      <span className="flex items-center gap-1 text-[11px] font-extrabold whitespace-nowrap">
        <Coins size={12} className="text-emerald-300 shrink-0" />
        <span>{formatMoney(workerTotal, currency)} to makers</span>
      </span>
    </motion.button>
  );
}
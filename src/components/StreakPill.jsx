import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Coins, Radio, ArrowUpRight, Stamp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { formatMoney } from "@/lib/money";
import { vibrate } from "@/lib/haptics";

const ORIGIN_FLAGS = {
  India: "🇮🇳",
  Bangladesh: "🇧🇩",
  Vietnam: "🇻🇳",
  Thailand: "🇹🇭",
  Colombia: "🇨🇴",
  China: "🇨🇳",
};

function CountUp({ value, duration = 750 }) {
  const [n, setN] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = prev.current;
    const tick = (t) => {
      const p = Math.max(0, Math.min(1, (t - start) / duration));
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

// Session-long impact streak + Origin Stamp Passport ring.
export default function StreakPill() {
  const { traces, workerTotal, origins = [], currency } = useApp();
  const [communityCount, setCommunityCount] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    base44.entities.Scan.count({})
      .then((c) => {
        if (mounted) setCommunityCount(c);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!traces) {
    return (
      <motion.button
        type="button"
        onClick={() => {
          vibrate(6);
          navigate("/explore");
        }}
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="flex w-full items-center justify-between gap-2 rounded-2xl frosted border border-white/80 px-3.5 py-2 text-left no-tap hover:bg-white/85 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-extrabold text-jejak-navy">
          <span className="flex items-center gap-1 rounded-full bg-jejak-materials/20 px-2 py-0.5 text-[10px] font-extrabold text-jejak-materials">
            <Radio size={11} className="animate-pulse-soft" /> Live
          </span>
          <span className="tabular-nums">
            {communityCount != null && communityCount > 0
              ? `${communityCount} community traces mapped`
              : "Collect 4 origin stamps"}
          </span>
        </span>
        <span className="flex items-center gap-0.5 text-[11px] font-bold text-jejak-navy/60">
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
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="flex w-full items-center justify-between gap-2 rounded-2xl frosted border border-white/80 px-3.5 py-2 tabular-nums no-tap"
    >
      <span className="flex items-center gap-1 text-xs font-extrabold text-jejak-navy">
        <Flame size={14} className="text-jejak-coral" />
        <CountUp value={traces} /> traced
      </span>
      <span className="h-3.5 w-px bg-jejak-navy/15" />
      <span className="flex items-center gap-1 text-xs font-extrabold text-jejak-navy">
        <Stamp size={13} className="text-jejak-freight" />
        <span className="flex items-center gap-0.5">
          {origins.slice(0, 4).map((o) => (
            <span key={o} title={o} className="text-xs">
              {ORIGIN_FLAGS[o] || "🌍"}
            </span>
          ))}
        </span>
        <span className="text-[10px] font-bold text-jejak-navy/55">
          {origins.length}/4
        </span>
      </span>
      <span className="h-3.5 w-px bg-jejak-navy/15" />
      <span className="flex items-center gap-1 text-xs font-extrabold text-jejak-navy">
        <Coins size={14} className="text-jejak-labour" />
        {formatMoney(workerTotal, currency)}
      </span>
    </motion.button>
  );
}
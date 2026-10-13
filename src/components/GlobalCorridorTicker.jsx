import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProduct } from "@/data";
import { formatMoney } from "@/lib/money";
import { useApp } from "@/lib/AppContext";
import { useNavigate, useLocation } from "react-router-dom";
import { vibrate } from "@/lib/haptics";
import { Globe2, ArrowUpRight } from "lucide-react";

const CORRIDORS = [
  {
    id: "hoodie",
    emoji: "🧥",
    item: "Cotton Hoodie",
    corridor: "Gujarat, IN → Dhaka, BD → Rotterdam → UK",
    km: "12,480 km",
    labourPct: 7.5,
    stuckPct: 92.5,
  },
  {
    id: "coffee",
    emoji: "☕",
    item: "Flat White Coffee",
    corridor: "Huila, CO → Cartagena → Antwerp → London",
    km: "9,120 km",
    labourPct: 4.0,
    stuckPct: 96.0,
  },
  {
    id: "trainers",
    emoji: "👟",
    item: "Running Trainers",
    corridor: "Rayong, TH → Ho Chi Minh, VN → Felixstowe",
    km: "14,290 km",
    labourPct: 6.0,
    stuckPct: 94.0,
  },
  {
    id: "phone_case",
    emoji: "📱",
    item: "Moulded Phone Case",
    corridor: "Dongguan, CN → Yantian Port → Southampton",
    km: "10,640 km",
    labourPct: 5.5,
    stuckPct: 94.5,
  },
];

// Live rotating global supply-chain corridor ticker that makes every screen
// feel connected to real-time global trade flows. Tapping opens that trace.
export default function GlobalCorridorTicker({ dark = false }) {
  const [idx, setIdx] = useState(0);
  const { currency, market, setProduct, setScreen, setCustomPrice, setMakerTip } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % CORRIDORS.length);
    }, 3600);
    return () => clearInterval(t);
  }, []);

  const active = CORRIDORS[idx];
  const prod = getProduct(active.id);
  const price = prod?.markets?.[market]?.price || 45;

  const handleOpen = () => {
    vibrate(8);
    if (prod) {
      setProduct(prod);
      setCustomPrice(null);
      setMakerTip(0);
      setScreen("journey");
      if (location.pathname !== "/") navigate("/");
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={`group w-full overflow-hidden rounded-2xl px-3 py-2 text-left transition-all no-tap ${
        dark
          ? "bg-white/10 border border-white/15 text-white hover:bg-white/15"
          : "frosted border border-white/80 text-jejak-navy hover:bg-white/90"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider opacity-70">
          <Globe2 size={12} className="animate-spin-slow text-jejak-freight" />
          Global corridor pulse
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold opacity-60">
          Tap for 3D route <ArrowUpRight size={11} />
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-1 flex items-center justify-between gap-2"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold">
              {active.emoji} {active.corridor}
            </p>
            <p className="text-[10px] font-semibold opacity-70 tabular-nums">
              {active.item} ({formatMoney(price, currency)}) · {active.km} travelled
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-jejak-labour/20 px-2 py-0.5 text-[10px] font-extrabold text-jejak-labour tabular-nums">
            {active.labourPct}% maker
          </span>
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
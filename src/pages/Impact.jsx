import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { DEMO_CHIPS, getProduct } from "@/data";
import { getRoute, formatMoney } from "@/lib/money";
import ScreenShell from "@/components/ScreenShell";
import Globe from "@/components/Globe";
import Logo from "@/components/Logo";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { Crosshair, Users, Globe2, HandCoins, Route } from "lucide-react";

// Illustrative community baseline — clearly labelled, not live data.
const COMMUNITY_BASE = { traces: 12847, workerPounds: 3920 };

// Counts up to `target` with an ease-out cubic over `duration` ms.
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

export default function Impact() {
  const { traces, workerTotal, distanceTotal, market, currency, setProduct, setScreen, reset } = useApp();
  const navigate = useNavigate();
  const [activeProductId, setActiveProductId] = useState("hoodie");

  const communityTraces = COMMUNITY_BASE.traces + traces;
  const communityWorker = COMMUNITY_BASE.workerPounds + Math.round(workerTotal);
  const animTraces = useCountUp(communityTraces);
  const animWorker = useCountUp(communityWorker);

  const activeProduct = getProduct(activeProductId) || getProduct("hoodie");
  const activeRoute = getRoute(activeProduct, market);

  const startScan = () => {
    reset();
    navigate("/");
  };

  const openCorridorReceipt = (id) => {
    vibrate(8);
    setProduct(getProduct(id));
    setScreen("split");
    navigate("/");
  };

  const yourStats = [
    { icon: Crosshair, label: "Products traced", value: String(traces), tint: "#FF7A1A" },
    { icon: HandCoins, label: "Maker share mapped", value: formatMoney(workerTotal, currency), tint: "#2FBF71" },
    { icon: Route, label: "Supply-chain km", value: `${distanceTotal.toLocaleString()} km`, tint: "#2D5BFF" },
  ];

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-28 pt-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <p className="text-xs font-bold uppercase tracking-widest text-jejak-navy/50">Global impact</p>
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold leading-tight text-jejak-navy">
            Every scan makes the global supply chain visible.
          </h1>
        </motion.div>

        {/* Interactive Global Supply Corridors Globe Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mt-4 rounded-3xl frosted-strong border border-white/80 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-jejak-navy/65">
              <Globe2 size={13} className="text-jejak-freight" /> Live global corridors
            </span>
            <button
              type="button"
              onClick={() => openCorridorReceipt(activeProductId)}
              className="rounded-full bg-jejak-navy px-2.5 py-1 text-[10px] font-extrabold text-amber-300 no-tap"
            >
              Open {activeProduct.name} receipt ↗
            </button>
          </div>

          <div className="my-2 flex justify-center">
            <Globe route={activeRoute} activeStop={activeRoute.length} size={230} />
          </div>

          {/* Corridor switcher pills */}
          <div className="grid grid-cols-4 gap-1.5">
            {DEMO_CHIPS.map((c) => {
              const active = c.id === activeProductId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    vibrate(6);
                    setActiveProductId(c.id);
                  }}
                  className={`flex flex-col items-center rounded-xl py-2 px-1 text-center transition-colors no-tap ${
                    active
                      ? "bg-jejak-navy text-white shadow-sm"
                      : "bg-white/75 text-jejak-navy hover:bg-white"
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span className="mt-0.5 text-[10px] font-extrabold truncate max-w-full">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Your personal stats (3-column) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-3.5 grid grid-cols-3 gap-2"
        >
          {yourStats.map(({ icon: Icon, label, value, tint }) => (
            <div key={label} className="rounded-2xl frosted p-3 border border-white/80">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: `${tint}1F` }}
              >
                <Icon size={14} style={{ color: tint }} />
              </span>
              <p className="mt-1.5 text-base font-extrabold text-jejak-navy tabular-nums truncate">
                {value}
              </p>
              <p className="text-[10px] font-semibold text-jejak-navy/55 leading-tight">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Community counter */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-3.5 rounded-3xl p-5 text-white shadow-lg"
          style={{ background: "linear-gradient(160deg,#FF8A65 0%,#FFC24B 50%,#FF3D81 120%)" }}
        >
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/85">
            <Users size={14} /> The Jejak community
          </p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div>
              <p className="text-4xl font-extrabold tabular-nums">{animTraces.toLocaleString()}</p>
              <p className="text-xs font-semibold text-white/85">products traced together</p>
            </div>
            <div className="rounded-2xl bg-white/20 px-3.5 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/85">Maker share surfaced</p>
              <p className="text-xl font-extrabold tabular-nums">£{animWorker.toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/85">
            <ConfidenceBadge level="low" /> Illustrative community baseline + your live session.
          </p>
        </motion.div>

        {/* Research citation */}
        <div className="mt-3 flex items-center gap-2 px-1">
          <p className="text-xs font-semibold text-jejak-navy/70">
            65% of shoppers would switch to brands that reveal product origins.
          </p>
          <span className="ml-auto shrink-0 text-[10px] font-bold text-jejak-navy/40">Source: ESW</span>
        </div>

        <motion.button
          type="button"
          onClick={startScan}
          whileTap={TAP}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-jejak-navy py-3.5 text-sm font-extrabold text-white no-tap shadow-md"
        >
          <Crosshair size={16} /> Scan your next product
        </motion.button>
      </div>
    </ScreenShell>
  );
}
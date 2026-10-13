import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import ScreenShell from "@/components/ScreenShell";
import Logo from "@/components/Logo";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { formatMoney } from "@/lib/money";
import { TAP } from "@/lib/motion";
import { Crosshair, Users, Globe2, HandCoins } from "lucide-react";

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
  const { traces, workerTotal, currency, reset } = useApp();
  const navigate = useNavigate();

  const communityTraces = COMMUNITY_BASE.traces + traces;
  const communityWorker = COMMUNITY_BASE.workerPounds + Math.round(workerTotal);
  const animTraces = useCountUp(communityTraces);
  const animWorker = useCountUp(communityWorker);

  const startScan = () => {
    reset();
    navigate("/");
  };

  const yourStats = [
    { icon: Crosshair, label: "Products you've traced", value: String(traces), tint: "#FF7A1A" },
    { icon: HandCoins, label: "Worker share you've seen", value: formatMoney(workerTotal, currency), tint: "#2FBF71" },
  ];

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-28 pt-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <Logo size={30} />
            <p className="text-sm font-bold uppercase tracking-widest text-jejak-navy/50">Your impact</p>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-jejak-navy">
            Every scan makes the invisible visible.
          </h1>
        </motion.div>

        {/* Community counter */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-5 rounded-3xl p-6 text-white"
          style={{ background: "linear-gradient(160deg,#FF8A65 0%,#FFC24B 50%,#FF3D81 120%)" }}
        >
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/85">
            <Users size={14} /> The Jejak community
          </p>
          <p className="mt-2 text-5xl font-extrabold tabular-nums">{animTraces.toLocaleString()}</p>
          <p className="text-sm font-semibold text-white/85">products traced together</p>
          <div className="mt-4 rounded-2xl bg-white/20 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">Estimated worker share surfaced</p>
            <p className="text-2xl font-extrabold tabular-nums">£{animWorker.toLocaleString()}</p>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/80">
            <ConfidenceBadge level="low" /> Illustrative community total — not live data.
          </p>
        </motion.div>

        {/* Why this matters */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="mt-3 flex items-center gap-2 px-1"
        >
          <p className="text-xs font-semibold text-jejak-navy/70">
            65% of shoppers would switch to brands that reveal product origins.
          </p>
          <span className="ml-auto text-[10px] font-bold text-jejak-navy/40">Source: ESW</span>
        </motion.div>

        {/* Your traces */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-4 grid grid-cols-2 gap-3"
        >
          {yourStats.map(({ icon: Icon, label, value, tint }) => (
            <div key={label} className="rounded-2xl frosted p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${tint}1F` }}>
                <Icon size={17} style={{ color: tint }} />
              </span>
              <p className="mt-2 text-2xl font-extrabold text-jejak-navy tabular-nums">{value}</p>
              <p className="text-[11px] font-semibold text-jejak-navy/55">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Countries mapped */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-4 rounded-2xl frosted p-4"
        >
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-jejak-navy/50">
            <Globe2 size={14} /> Supply chains mapped
          </p>
          <p className="mt-1 text-sm text-jejak-navy/70">
            Cotton in India, rubber in Vietnam, assembly in Bangladesh, beans in Colombia, ports in Rotterdam and Singapore.
          </p>
        </motion.div>

        <motion.button
          type="button"
          onClick={startScan}
          whileTap={TAP}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-jejak-navy py-3.5 text-sm font-extrabold text-white no-tap"
        >
          <Crosshair size={16} /> Scan your next product
        </motion.button>
      </div>
    </ScreenShell>
  );
}
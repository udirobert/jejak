import React, { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { formatMoney } from "@/lib/money";
import SupplyFlowPipe from "./SupplyFlowPipe";
import StellarSettlementBadge from "./StellarSettlementBadge";
import { celebrate } from "@/lib/celebrate";
import { vibrate, coinClink } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { HeartHandshake, Check, RotateCcw, Zap, Lock } from "lucide-react";

// Concise, visual-first "Flow & Boost" card:
// 1. Animated SVG SupplyFlowPipe showing where money gets stuck vs reaches makers
// 2. One-tap +£1 Round-up or Bridge-the-Gap action settled live on Stellar Testnet
export default function MakerBridgeCard({
  price,
  currency,
  labourPct,
  labourAmount,
  transparentLabourAmount,
}) {
  const {
    makerTip,
    setMakerTip,
    addToWorkerFund,
    lastStellarTx,
    setLastStellarTx,
    stellarLoading,
    stellarError,
    settleStellarPayout,
  } = useApp();
  const [settlementMode, setSettlementMode] = useState("direct"); // "direct" | "escrow"
  const gapAmount = Math.max(1, +(transparentLabourAmount - labourAmount).toFixed(2));
  const unitStep = 1;

  const handleTip = (amt) => {
    vibrate([0, 10, 25, 10]);
    coinClink();
    const nextTip = +(makerTip + amt).toFixed(2);
    setMakerTip(nextTip);
    addToWorkerFund(amt);
    celebrate();
    settleStellarPayout({ amount: amt, mode: settlementMode });
  };

  const resetTip = () => {
    vibrate(6);
    setMakerTip(0);
    setLastStellarTx(null);
  };

  return (
    <div className="space-y-2.5">
      <SupplyFlowPipe
        price={price}
        currency={currency}
        labourPct={labourPct}
        labourAmount={labourAmount}
        makerTip={makerTip}
      />

      <div
        className="rounded-2xl p-3"
        style={{
          background: "linear-gradient(135deg,#2FBF7118,#FFC24B22)",
          border: "1px solid #2FBF7155",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jejak-materials text-white">
              <HeartHandshake size={14} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-jejak-navy">
                Bypass intermediaries · Stellar Direct Boost
              </p>
              <p className="flex items-center gap-1 text-[10px] font-semibold text-jejak-navy/65">
                <Zap size={10} className="text-jejak-labour" /> Instant cross-border USDC/XLM settlement (0.00001 XLM fee)
              </p>
            </div>
          </div>
          {makerTip > 0 && (
            <button
              type="button"
              onClick={resetTip}
              className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-jejak-navy/60 no-tap"
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>

        {/* Stellar Primitive Switcher: Direct SEP-24 Anchor vs Claimable Co-op Escrow */}
        <div className="mt-2 flex items-center gap-1 rounded-xl bg-white/60 p-1 border border-jejak-navy/10">
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              setSettlementMode("direct");
            }}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-extrabold transition-colors no-tap ${
              settlementMode === "direct"
                ? "bg-jejak-navy text-white shadow-sm"
                : "text-jejak-navy/65 hover:text-jejak-navy"
            }`}
          >
            <Zap size={10} /> Instant SEP-24 Anchor
          </button>
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              setSettlementMode("escrow");
            }}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-extrabold transition-colors no-tap ${
              settlementMode === "escrow"
                ? "bg-jejak-navy text-amber-300 shadow-sm"
                : "text-jejak-navy/65 hover:text-jejak-navy"
            }`}
          >
            <Lock size={10} /> Claimable Co-op Escrow
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            whileTap={TAP}
            onClick={() => handleTip(unitStep)}
            className="flex items-center justify-center gap-1 rounded-xl bg-white/90 py-2 px-3 text-xs font-extrabold text-jejak-navy shadow-sm no-tap hover:bg-white"
          >
            + {formatMoney(unitStep, currency)} round-up
          </motion.button>
          <motion.button
            type="button"
            whileTap={TAP}
            onClick={() => handleTip(gapAmount)}
            className="flex items-center justify-center gap-1 rounded-xl bg-jejak-materials py-2 px-3 text-xs font-extrabold text-white shadow-sm no-tap"
          >
            {makerTip >= gapAmount ? <Check size={13} /> : null}
            Bridge {formatMoney(gapAmount, currency)} gap
          </motion.button>
        </div>

        <StellarSettlementBadge
          tx={lastStellarTx}
          loading={stellarLoading}
          error={stellarError}
        />
      </div>
    </div>
  );
}
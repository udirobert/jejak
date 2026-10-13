import React from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { formatMoney } from "@/lib/money";
import { celebrate } from "@/lib/celebrate";
import { vibrate, coinClink } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { AlertCircle, HeartHandshake, Check, RotateCcw } from "lucide-react";

// Shows "Where your payment gets stuck" (intermediaries vs. makers at origin)
// and lets the user bridge the maker gap or round up +1 directly from the receipt.
export default function MakerBridgeCard({
  price,
  currency,
  labourPct,
  labourAmount,
  transparentLabourAmount,
}) {
  const { makerTip, setMakerTip, addToWorkerFund } = useApp();
  const stuckPct = Math.max(0, +(100 - labourPct).toFixed(1));
  const stuckAmount = Math.max(0, price - labourAmount);
  const gapAmount = Math.max(1, +(transparentLabourAmount - labourAmount).toFixed(2));
  const unitStep = 1;
  const effectiveMakerTotal = labourAmount + makerTip;

  const handleTip = (amt) => {
    vibrate([0, 10, 25, 10]);
    coinClink();
    setMakerTip((prev) => +(prev + amt).toFixed(2));
    addToWorkerFund(amt);
    celebrate();
  };

  const resetTip = () => {
    vibrate(6);
    setMakerTip(0);
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Where money gets stuck callout */}
      <div className="rounded-2xl frosted p-3.5 border border-white/70">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-jejak-retail">
            <AlertCircle size={12} /> Where your payment gets stuck
          </span>
          <span className="rounded-full bg-jejak-navy/10 px-2 py-0.5 text-[10px] font-bold text-jejak-navy/70">
            Track 01 · Move Money
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/70 p-2.5">
            <p className="text-[10px] font-bold uppercase text-jejak-navy/50">
              Stuck in intermediaries
            </p>
            <p className="mt-0.5 text-lg font-extrabold text-jejak-navy">
              {formatMoney(stuckAmount, currency)}
            </p>
            <p className="text-[10px] font-semibold text-jejak-navy/55">
              {stuckPct}% · retail, brand, freight & inputs
            </p>
          </div>
          <div
            className="rounded-xl p-2.5"
            style={{ background: "#FF7A1A18", border: "1px solid #FF7A1A55" }}
          >
            <p className="text-[10px] font-bold uppercase text-jejak-labour">
              Reaches makers
            </p>
            <p className="mt-0.5 text-lg font-extrabold text-jejak-navy">
              {formatMoney(effectiveMakerTotal, currency)}
            </p>
            <p className="text-[10px] font-semibold text-jejak-navy/65">
              {makerTip > 0
                ? `${formatMoney(labourAmount, currency)} + ${formatMoney(makerTip, currency)} direct boost`
                : `Only ${labourPct}% of ${formatMoney(price, currency)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Bridge the maker gap action */}
      <div
        className="rounded-2xl p-3.5"
        style={{
          background: "linear-gradient(135deg,#2FBF7118,#FFC24B22)",
          border: "1px solid #2FBF7155",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jejak-materials text-white">
              <HeartHandshake size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-jejak-navy">
                Move money directly to makers
              </p>
              <p className="text-[10px] font-semibold text-jejak-navy/60">
                Concept · bypass intermediaries via verified worker fund
              </p>
            </div>
          </div>
          {makerTip > 0 && (
            <button
              type="button"
              onClick={resetTip}
              aria-label="Reset boost"
              className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-jejak-navy/60 no-tap"
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            whileTap={TAP}
            onClick={() => handleTip(unitStep)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/90 py-2.5 px-3 text-xs font-extrabold text-jejak-navy shadow-sm no-tap hover:bg-white transition-colors"
          >
            + {formatMoney(unitStep, currency)} round-up
          </motion.button>
          <motion.button
            type="button"
            whileTap={TAP}
            onClick={() => handleTip(gapAmount)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-jejak-materials py-2.5 px-3 text-xs font-extrabold text-white shadow-sm no-tap"
          >
            {makerTip >= gapAmount ? <Check size={13} /> : null}
            Bridge {formatMoney(gapAmount, currency)} gap
          </motion.button>
        </div>
      </div>
    </div>
  );
}
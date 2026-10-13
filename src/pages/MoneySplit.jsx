import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { computeSplit, formatMoney, labourPerUnit, sumMid } from "@/lib/money";
import ScreenShell from "@/components/ScreenShell";
import CoinDrop from "@/components/CoinDrop";
import StackedBar from "@/components/StackedBar";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { ArrowLeft, Repeat2, Info } from "lucide-react";

export default function MoneySplit() {
  const { product, market, currency, setScreen, compareMode, setCompareMode, setDetailCategory } = useApp();
  const reduce = useReducedMotion();
  const price = product.markets[market].price;
  const split = computeSplit(product, market, compareMode ? "transparent" : "split");
  const labour = split.find((s) => s.key === "labour");
  const perUnit = labourPerUnit(
    compareMode ? product.transparentAlternative.split : product.split,
    currency
  );
  const intermediaries = compareMode ? 2 : 4;
  const routeLen = (product.route?.length || 0) + 1;

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setScreen("journey")}
            className="flex items-center gap-1 text-sm font-bold text-jejak-navy/70 no-tap"
          >
            <ArrowLeft size={16} /> Route
          </button>
          <p className="text-xs font-bold uppercase tracking-wide text-jejak-navy/50">Money split</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <p className="text-sm font-semibold text-jejak-navy/60">{product.name} · {product.markets[market].retailer}</p>
          <p className="text-4xl font-extrabold text-jejak-navy">{formatMoney(price, currency)}</p>
          <p className="text-xs text-jejak-navy/50">Estimated · shown as a range · 100 coins = 100% of the price</p>
        </motion.div>

        {/* Compare toggle */}
        <button
          type="button"
          onClick={() => setCompareMode(!compareMode)}
          className="mt-4 flex items-center justify-between rounded-2xl frosted p-4 no-tap"
          aria-pressed={compareMode}
        >
          <div className="text-left">
            <p className="text-sm font-extrabold text-jejak-navy">What if you bought direct from a transparent brand?</p>
            <p className="text-xs text-jejak-navy/55">Illustrative scenario — not a specific real brand</p>
          </div>
          <span
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{ background: compareMode ? "#2FBF71" : "#D9DBE8" }}
          >
            <motion.span
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
              animate={{ left: compareMode ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          </span>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={compareMode ? "transparent" : "standard"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <CoinDrop split={split} />
          </motion.div>
        </AnimatePresence>

        <div className="mt-5">
          <StackedBar split={split} currency={currency} />
        </div>

        {/* Headline garment-worker share */}
        <div className="mt-4 rounded-2xl frosted p-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-jejak-navy/50">Estimated garment-worker share</p>
            <ConfidenceBadge level={labour.confidence} />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-jejak-navy">
            {perUnit.lowLabel} – {perUnit.highLabel}
            <span className="text-base font-bold text-jejak-navy/60"> per {currency === "SGD" ? "S$1" : "£1"}</span>
          </p>
          <p className="text-xs text-jejak-navy/55">
            Mid estimate: <strong>{perUnit.midLabel}</strong> · range {labour.pct.low}–{labour.pct.high}%
          </p>
        </div>

        {/* Compare summary */}
        <AnimatePresence>
          {compareMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl frosted p-3">
                  <p className="text-[11px] font-bold uppercase text-jejak-navy/50">Standard</p>
                  <p className="mt-1 text-lg font-extrabold text-jejak-navy">7.5%</p>
                  <p className="text-[11px] text-jejak-navy/55">labour share</p>
                  <p className="mt-1 text-xs font-bold text-jejak-navy/70">{routeLen} stops · 4 intermediaries</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: "#2FBF7115", border: "1px solid #2FBF7155" }}>
                  <p className="text-[11px] font-bold uppercase text-jejak-materials">Transparent</p>
                  <p className="mt-1 text-lg font-extrabold text-jejak-navy">{product.transparentAlternative.split.labour.pct.mid}%</p>
                  <p className="text-[11px] text-jejak-navy/55">labour share</p>
                  <p className="mt-1 text-xs font-bold text-jejak-navy/70">shorter route · 2 intermediaries</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex items-center gap-2 text-xs text-jejak-navy/50">
          <Info size={13} /> Tap any column for detail. Every figure is an estimate.
        </div>

        {/* Tap targets over columns (rendered as a row of buttons) */}
        <div className="mt-3 grid grid-cols-5 gap-2">
          {split.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setDetailCategory(cat.key)}
              className="rounded-xl frosted py-2 text-[10px] font-bold no-tap"
              style={{ color: cat.color }}
              aria-label={`Open ${cat.label} detail`}
            >
              {cat.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}
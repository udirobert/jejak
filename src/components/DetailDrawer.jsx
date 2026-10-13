import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { computeSplit, formatMoney, getRoute, labourPerUnit } from "@/lib/money";
import { CATEGORY_MAP } from "@/lib/tokens";
import ConfidenceBadge from "./ConfidenceBadge";

// "Follow the money" — per-category detail drawer.
export default function DetailDrawer() {
  const { product, market, currency, detailCategory, setDetailCategory, setShowHowTo, compareMode } = useApp();
  const open = !!detailCategory;
  const cat = open ? CATEGORY_MAP[detailCategory] : null;
  const split = computeSplit(product, market, compareMode ? "transparent" : "split");
  const entry = open ? split.find((s) => s.key === detailCategory) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-jejak-navy/40 backdrop-blur-sm" onClick={() => setDetailCategory(null)} />
          <motion.div
            className="relative w-full max-w-[420px] frosted-strong rounded-t-3xl p-6 pb-8"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-jejak-navy/20" />
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${cat.color}22` }}>
                <span className="block h-4 w-4 rounded-full" style={{ background: cat.color }} />
              </span>
              <h3 className="text-lg font-extrabold text-jejak-navy">{cat.label}</h3>
              <ConfidenceBadge level={entry.confidence} />
            </div>

            <div className="mt-4 rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-wide text-jejak-navy/50">Estimated share</p>
              <p className="text-2xl font-extrabold text-jejak-navy">
                {entry.pct.low}–{entry.pct.high}%
              </p>
              <p className="mt-1 text-sm font-bold" style={{ color: cat.color }}>
                ≈ {formatMoney(entry.amountLow, currency)} – {formatMoney(entry.amountHigh, currency)}
              </p>
              <p className="mt-0.5 text-xs text-jejak-navy/50">of {formatMoney(product.markets[market].price, currency)} paid</p>
            </div>

            <div className="mt-3 text-sm text-jejak-navy/75">
              <p>{cat.blurb}</p>
              {detailCategory === "labour" && product.labourContext && (
                <p className="mt-2">{product.labourContext}</p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-jejak-navy/5 px-3 py-2">
              <span className="text-xs text-jejak-navy/60">Basis</span>
              <span className="text-xs font-semibold text-jejak-navy">{entry.basis}</span>
            </div>

            <button
              type="button"
              onClick={() => { setDetailCategory(null); setShowHowTo(true); }}
              className="mt-4 w-full rounded-xl bg-jejak-navy py-3 text-sm font-bold text-white no-tap"
            >
              How we estimate this
            </button>
            <button
              type="button"
              onClick={() => setDetailCategory(null)}
              className="mt-2 w-full rounded-xl py-2 text-sm font-semibold text-jejak-navy/60 no-tap"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
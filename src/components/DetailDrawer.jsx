import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { computeSplit, formatMoney } from "@/lib/money";
import { CATEGORY_MAP } from "@/lib/tokens";

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
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-journal-ink/40" onClick={() => setDetailCategory(null)} />
          <motion.div
            className="relative w-full max-w-[560px] border border-journal-rule bg-journal-card p-6 pb-8 font-grotesk text-journal-ink shadow-[0_24px_60px_-20px_rgba(30,27,22,0.4)] lg:mx-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="flex items-center gap-3">
              <span className="inline-block h-3.5 w-3.5" style={{ background: cat.color }} aria-hidden="true" />
              <h3 className="font-serif-display text-2xl text-journal-ink" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}>{cat.label}</h3>
            </div>

            <div className="mt-5 border border-journal-rule bg-journal-paper p-4">
              <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">Estimated share</p>
              <p className="mt-1 font-serif-display text-3xl text-journal-ink">
                {entry.pct.low}–{entry.pct.high}%
              </p>
              <p className="mt-1 font-plexmono text-sm font-medium" style={{ color: cat.color }}>
                ≈ {formatMoney(entry.amountLow, currency)} – {formatMoney(entry.amountHigh, currency)}
              </p>
              <p className="mt-1 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
                of {formatMoney(product.markets[market].price, currency)} paid
              </p>
            </div>

            <div className="mt-4 text-sm leading-relaxed text-journal-ink-soft">
              <p>{cat.blurb}</p>
              {detailCategory === "labour" && product.labourContext && (
                <p className="mt-2">{product.labourContext}</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-dotted border-journal-rule py-2.5 font-plexmono text-[11px] uppercase tracking-[0.1em]">
              <span className="text-journal-ink-soft">Basis</span>
              <span className="font-medium text-journal-ink">{entry.basis}</span>
            </div>
            <div className="flex items-center justify-between border-t border-dotted border-journal-rule py-2.5 font-plexmono text-[11px] uppercase tracking-[0.1em]">
              <span className="text-journal-ink-soft">Confidence</span>
              <span className="font-medium text-journal-ink">{entry.confidence}</span>
            </div>

            <button
              type="button"
              onClick={() => { setDetailCategory(null); setShowHowTo(true); }}
              className="mt-4 w-full rounded-[2px] bg-journal-ink py-3 font-grotesk text-sm font-medium text-journal-paper no-tap shadow-[3px_3px_0_0_var(--j-stamp)] hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
            >
              How we work it out
            </button>
            <button
              type="button"
              onClick={() => setDetailCategory(null)}
              className="mt-2 w-full py-2 font-grotesk text-sm text-journal-ink-soft no-tap hover:text-journal-ink"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { BASIS_LABELS } from "@/lib/tokens";

// "How we work it out" — methodology drawer, accessible from every screen.
export default function HowWeEstimateDrawer() {
  const { showHowTo, setShowHowTo } = useApp();
  return (
    <AnimatePresence>
      {showHowTo && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-journal-ink/40" onClick={() => setShowHowTo(false)} />
          <motion.div
            className="relative w-full max-w-[560px] border border-journal-rule bg-journal-card p-6 pb-8 font-grotesk text-journal-ink shadow-[0_24px_60px_-20px_rgba(30,27,22,0.4)] max-h-[85vh] overflow-y-auto scrollbar-hide lg:mx-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp">Method</p>
            <h3 className="mt-1 font-serif-display text-3xl text-journal-ink" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}>
              How we work it out
            </h3>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-journal-ink-soft">
              <p>
                Jejak turns a photo into a <strong className="text-journal-ink">receipt for the physical supply chain</strong>. We estimate two things:
                where a product likely travelled, and how your payment splits across the people and steps behind it.
              </p>
              <p>
                Every figure you see is an <strong className="text-journal-ink">estimate</strong>, shown as a range — not a precise fact.
                We say how sure we are:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong className="text-journal-ink">Sure</strong> — backed by multiple public benchmarks.</li>
                <li><strong className="text-journal-ink">Fairly sure</strong> — a reasonable estimate from partial data.</li>
                <li><strong className="text-journal-ink">Rough guess</strong> — indicative only.</li>
              </ul>
              <p>Each figure carries a <strong className="text-journal-ink">basis label</strong> from this set only:</p>
              <div className="flex flex-wrap gap-2">
                {BASIS_LABELS.map((b) => (
                  <span key={b} className="border border-journal-rule bg-journal-paper px-2.5 py-1 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-ink">{b}</span>
                ))}
              </div>
              <p>
                <strong className="text-journal-ink">What we do not know:</strong> specific factories, suppliers or worker names.
                We name countries and stage types only — never a facility as fact.
              </p>
              <p>
                <strong className="text-journal-ink">Your photo isn't stored on your profile.</strong> It's uploaded
                privately, used once for recognition, then discarded.
              </p>
              <p>
                <strong className="text-journal-ink">Soon, this gets better.</strong> From 2027, EU rules will make
                brands publish product passport data. When a brand publishes, those verified facts replace our
                estimates — the journal is built to hold them.
              </p>
              <p className="italic text-journal-ink-soft">
                We're not telling you what to buy — we're making the payment visible.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHowTo(false)}
              className="mt-6 w-full rounded-[2px] bg-journal-ink py-3 font-grotesk text-sm font-medium text-journal-paper no-tap shadow-[3px_3px_0_0_var(--j-stamp)] hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_CHIPS } from "@/data";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import Specimen from "./journal/Specimen";

// Product picker — the graceful fallback for any camera or AI failure.
export default function ProductPicker({ open, onClose, message, onPick }) {
  const { setProduct, setScreen, setLowConfidence } = useApp();

  const pick = (id) => {
    if (onPick) {
      onPick(id);
      return;
    }
    setProduct(getProduct(id));
    setLowConfidence(true);
    onClose?.();
    setScreen("identifying");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-journal-ink/40" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[560px] border border-journal-rule bg-journal-card p-6 pb-8 shadow-[0_24px_60px_-20px_rgba(30,27,22,0.4)] lg:mx-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <h3
              className="font-serif-display text-2xl text-journal-ink"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
            >
              Pick a specimen
            </h3>
            {message && <p className="mt-1 font-grotesk text-sm text-journal-ink-soft">{message}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DEMO_CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c.id)}
                  className="flex flex-col items-center gap-2 border border-journal-rule bg-journal-paper p-4 no-tap transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--j-stamp)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                >
                  <Specimen id={c.id} className="h-16 w-16" title={`${c.label} illustration`} />
                  <span className="font-grotesk text-sm font-medium text-journal-ink">{c.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
              Category-level estimate · rough guess
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

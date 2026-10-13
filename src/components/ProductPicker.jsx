import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_CHIPS } from "@/data";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";

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
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-jejak-navy/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[420px] frosted-strong rounded-t-3xl p-6 pb-8"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-jejak-navy/20" />
            <h3 className="text-lg font-extrabold text-jejak-navy">Pick a product</h3>
            {message && <p className="mt-1 text-sm text-jejak-navy/70">{message}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {DEMO_CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c.id)}
                  className="flex items-center gap-3 rounded-2xl bg-white/80 border border-white p-4 text-left no-tap hover:bg-white transition-colors"
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="font-bold text-jejak-navy">{c.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-jejak-navy/50">
              We'll show a category-level estimate with a low-confidence badge.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
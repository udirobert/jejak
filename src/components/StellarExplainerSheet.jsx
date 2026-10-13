import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShieldCheck, Lock, EyeOff, Zap, X } from "lucide-react";
import { vibrate } from "@/lib/haptics";

// Short 3-line explainer sheet + 1 line on Why Stellar + honest note on simulated fallbacks.
export default function StellarExplainerSheet({ open, onClose }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-jejak-navy/50 backdrop-blur-sm"
            onClick={() => {
              vibrate(4);
              onClose?.();
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="How Stellar verification works"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="relative w-full max-w-[420px] rounded-t-3xl bg-white border-t border-slate-200 p-5 pb-8 text-jejak-navy shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />

            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-jejak-navy">
                <ShieldCheck size={15} className="text-jejak-materials" /> How
                Stellar proof works
              </span>
              <button
                type="button"
                onClick={() => {
                  vibrate(4);
                  onClose?.();
                }}
                aria-label="Close explainer"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 no-tap"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
                <Lock
                  size={15}
                  className="mt-0.5 shrink-0 text-jejak-freight"
                />
                <div>
                  <p className="font-extrabold text-jejak-navy">
                    What is recorded
                  </p>
                  <p className="mt-0.5 font-medium leading-relaxed text-jejak-navy/75">
                    A SHA-256 fingerprint (<code className="font-mono">MEMO_HASH</code>) of the trace record: product category, route stages, label evidence, and cost-split estimate.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
                <EyeOff
                  size={15}
                  className="mt-0.5 shrink-0 text-jejak-materials"
                />
                <div>
                  <p className="font-extrabold text-jejak-navy">
                    What is not recorded
                  </p>
                  <p className="mt-0.5 font-medium leading-relaxed text-jejak-navy/75">
                    Your photo, your name, and any personal data stay off-chain and are never written to Stellar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0 text-jejak-labour"
                />
                <div>
                  <p className="font-extrabold text-jejak-navy">
                    Why it matters
                  </p>
                  <p className="mt-0.5 font-medium leading-relaxed text-jejak-navy/75">
                    Anyone can recompute the fingerprint later and check it against the public ledger — the estimate cannot be quietly changed.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-jejak-navy px-3.5 py-2.5 text-[11px] font-semibold leading-relaxed text-white/90">
              <p className="flex items-center gap-1.5 font-extrabold text-amber-300">
                <Zap size={12} /> Why Stellar?
              </p>
              <p className="mt-0.5">
                Fast (~5s finality), low-fee (fractions of a cent), and public on Stellar Testnet. Any action that cannot reach live Testnet is explicitly labeled as simulated.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { formatMoney } from "@/lib/money";
import { updateSpendingLimitPolicy } from "@/lib/wallet";
import { formatShortWalletAddress } from "@/components/JejakPassportSheet";
import { vibrate, coinClink } from "@/lib/haptics";
import {
  Sliders,
  CheckCircle2,
  Loader2,
  ExternalLink,
  X,
  Fingerprint,
  RotateCcw,
} from "lucide-react";

const CATEGORIES = [
  "All categories",
  "Apparel",
  "Footwear",
  "Coffee & Food",
  "Accessories",
];

const PRESET_AMOUNTS = [15, 25, 50, 100];

// Bank "Set limit" sheet:
// Lets the user pick an amount + category, signs & writes the spending-limit policy
// to the user's smart account via passkey + fee relayer, animates Anchoring -> Anchored (✓),
// and records the signed action under "Your passport".
export default function BankSpendLimitSheet({ open, onClose }) {
  const { currency, walletSession, setWalletSession } = useApp();
  const reduce = useReducedMotion();

  const [amount, setAmount] = useState(
    walletSession?.spendingLimit?.dailyCapAmount || 25
  );
  const [category, setCategory] = useState(
    walletSession?.spendingLimit?.category || "All categories"
  );
  // phase: 'idle' | 'anchoring' | 'anchored' | 'failed'
  const [phase, setPhase] = useState("idle");
  const [lastTx, setLastTx] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (open) {
      setAmount(walletSession?.spendingLimit?.dailyCapAmount || 25);
      setCategory(walletSession?.spendingLimit?.category || "All categories");
      setPhase("idle");
      setErrorMsg(null);
    }
  }, [open, walletSession]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    vibrate(8);
    setPhase("anchoring");
    setErrorMsg(null);

    try {
      const updated = await updateSpendingLimitPolicy({
        dailyCapAmount: Number(amount) || 25,
        category,
        currency,
      });
      setWalletSession(updated);
      setLastTx(updated.lastSponsoredTx || updated.spendingLimit);
      setPhase("anchored");
      vibrate([0, 10, 25, 10]);
      coinClink();
    } catch (err) {
      setPhase("failed");
      setErrorMsg(
        err?.message || "Could not anchor spending limit on Stellar Testnet."
      );
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Set smart account spending limit"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="relative w-full max-w-[420px] rounded-t-3xl bg-white border-t border-slate-200 px-5 pt-4 pb-8 shadow-2xl text-slate-900"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />

            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600">
                <Sliders size={11} /> Smart-account policy · Stellar Testnet
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close spending limit sheet"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 no-tap"
              >
                <X size={15} />
              </button>
            </div>

            <h2 className="mt-2.5 text-lg font-extrabold tracking-tight text-slate-900">
              Set daily spending limit
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Writes an on-chain spending-limit policy to your Jejak passport (
              <span className="font-mono">
                {formatShortWalletAddress(walletSession?.address)}
              </span>
              ).
            </p>

            <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
              {/* Amount selector */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Daily cap amount ({currency})
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {PRESET_AMOUNTS.map((preset) => {
                    const active = Number(amount) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={phase === "anchoring"}
                        onClick={() => {
                          vibrate(4);
                          setAmount(preset);
                        }}
                        className={`rounded-xl py-2 text-xs font-extrabold transition-colors no-tap ${
                          active
                            ? "bg-jejak-navy text-amber-300 shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {formatMoney(preset, currency)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Spending category
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const active = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        disabled={phase === "anchoring"}
                        onClick={() => {
                          vibrate(4);
                          setCategory(cat);
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors no-tap ${
                          active
                            ? "bg-jejak-navy text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Anchoring -> Check Animation & Status */}
              {phase === "anchoring" && (
                <div className="flex items-center justify-between rounded-2xl bg-jejak-navy px-3.5 py-3 text-xs text-white">
                  <span className="inline-flex items-center gap-2 font-extrabold text-amber-300">
                    <Loader2 size={14} className="animate-spin" />
                    Anchoring policy on Stellar Testnet…
                  </span>
                  <span className="font-mono text-[10px] text-white/65">
                    Passkey signed
                  </span>
                </div>
              )}

              {phase === "anchored" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-800">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      Anchored · {formatMoney(amount, currency)}/day ({category})
                    </span>
                    {lastTx?.explorerUrl && (
                      <a
                        href={lastTx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-extrabold text-jejak-freight hover:underline"
                      >
                        View on Stellar <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-emerald-800/80">
                    Listed under “Your passport” in Impact → On-chain.
                  </p>
                </motion.div>
              )}

              {phase === "failed" && (
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-900">
                  <span className="font-semibold truncate">{errorMsg}</span>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-extrabold text-red-900 no-tap"
                  >
                    <RotateCcw size={11} /> Retry
                  </button>
                </div>
              )}

              {/* Primary CTA */}
              {phase === "anchored" ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[44px] rounded-2xl bg-jejak-navy py-3 text-xs font-extrabold text-white no-tap"
                >
                  Done
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={phase === "anchoring"}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-2xl bg-jejak-navy px-4 py-3 text-xs font-extrabold text-amber-300 shadow-sm hover:opacity-95 disabled:opacity-60 no-tap"
                >
                  <Fingerprint size={15} />
                  <span>
                    {phase === "anchoring"
                      ? "Anchoring…"
                      : `Sign & set ${formatMoney(amount, currency)}/day limit`}
                  </span>
                </button>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
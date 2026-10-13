import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, CheckCircle2, Loader2, Sparkles, ShieldCheck } from "lucide-react";

// Displays real Stellar Testnet settlement telemetry when a user bridges the maker gap
// or rounds up a purchase, with a 1-click verification link to Stellar.Expert.
export default function StellarSettlementBadge({ tx, loading, error, compact = false }) {
  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="stellar-loading"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="mt-2 flex items-center justify-between rounded-xl bg-jejak-navy px-3 py-2 text-white shadow-sm"
        >
          <span className="flex items-center gap-2 text-[11px] font-bold">
            <Loader2 size={13} className="animate-spin text-amber-300" />
            Broadcasting micro-payout on Stellar Testnet…
          </span>
          <span className="text-[10px] font-semibold text-white/60">~3–5s finality</span>
        </motion.div>
      )}

      {!loading && error && (
        <motion.div
          key="stellar-error"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="mt-2 rounded-xl bg-amber-500/15 border border-amber-500/35 px-3 py-2 text-[11px] font-semibold text-jejak-navy"
        >
          Local boost applied · Stellar Testnet relayer busy ({error})
        </motion.div>
      )}

      {!loading && tx && (
        <motion.div
          key={tx.hash}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mt-2 rounded-2xl bg-jejak-navy p-3 text-white shadow-md border border-amber-300/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-jejak-materials">
              <CheckCircle2 size={13} /> Settled on Stellar Testnet
            </span>
            <a
              href={tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 border border-amber-300/45 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 hover:bg-amber-300/30 no-tap"
            >
              Verify on Stellar.Expert <ExternalLink size={10} />
            </a>
          </div>

          <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-xl bg-white/10 p-2 text-[10px]">
            <div>
              <p className="text-white/55 font-semibold">Path conversion</p>
              <p className="font-extrabold text-white tabular-nums">
                ≈ ${tx.usdcEquivalent} USDC
              </p>
            </div>
            <div>
              <p className="text-white/55 font-semibold">Network fee</p>
              <p className="font-extrabold text-jejak-materials tabular-nums">
                {tx.feeXlm} XLM
              </p>
            </div>
            <div>
              <p className="text-white/55 font-semibold">Ledger</p>
              <p className="font-extrabold text-amber-300 tabular-nums">
                #{tx.ledger}
              </p>
            </div>
          </div>

          {!compact && (
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/70 font-mono">
              <span className="truncate max-w-[62%]">
                TX: {tx.hash.slice(0, 10)}…{tx.hash.slice(-8)}
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-amber-200">
                {tx.memo}
              </span>
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px] text-white/65">
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-amber-300" />
              Anchor: <strong className="text-white">{tx.coopLabel}</strong>
            </span>
            <span className="flex items-center gap-0.5 text-jejak-materials font-bold">
              <Sparkles size={10} /> 99.99% reaches makers
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
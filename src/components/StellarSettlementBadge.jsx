import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Lock,
  Clock,
} from "lucide-react";

// Verifiable Stellar Testnet cause donation badge:
// - Clearly labels destination as "Demo cause (testnet)" and "Demo testnet donation. No real-world disbursement."
// - Never claims money reaches workers or communities, and makes no claims about anchors, local currency, or off-ramps.
export default function StellarSettlementBadge({
  tx,
  loading,
  compact = false,
}) {
  const [showQr, setShowQr] = useState(false);

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
            Broadcasting to demo cause wallet on Stellar Testnet…
          </span>
          <span className="text-[10px] font-semibold text-white/60">~3–5s</span>
        </motion.div>
      )}

      {!loading && tx && (
        <motion.div
          key={tx.hash}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mt-2.5 rounded-2xl bg-jejak-navy p-3 text-white shadow-md border border-amber-300/45"
        >
          {tx.cachedFallback && (
            <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-300/15 border border-amber-300/35 px-2.5 py-1 text-[10px] font-semibold text-amber-200">
              <Clock size={11} className="shrink-0" />
              <span>
                {tx.fallbackNotice ||
                  "Testnet is slow — here is a recent verified testnet transaction."}
              </span>
            </div>
          )}

          {/* Top header: status + QR toggle + Stellar.Expert link */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-jejak-materials">
              {tx.mode === "escrow" ? <Lock size={12} /> : <CheckCircle2 size={13} />}
              {tx.mode === "escrow"
                ? "Claimable Balance Created · Demo Cause (Testnet)"
                : "Sent to Demo Cause Wallet (Testnet)"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowQr((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-white/12 border border-white/25 px-2 py-0.5 text-[10px] font-extrabold text-white hover:bg-white/20 no-tap"
              >
                <QrCode size={10} /> {showQr ? "Hide QR" : "QR"}
              </button>
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 border border-amber-300/45 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 hover:bg-amber-300/30 no-tap"
              >
                Ledger #{tx.ledger} <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Demo Testnet Donation Flow */}
          <div className="mt-2 rounded-xl bg-white/8 border border-white/12 px-2.5 py-2">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300/90">
              {tx.disclaimer || "Demo testnet donation · No real-world disbursement"}
            </p>
            <div className="mt-1 flex items-center justify-between gap-1 text-[10px] font-extrabold">
              <span className="rounded-lg bg-white/12 px-2 py-1 tabular-nums">
                {tx.fiatCurrency === "SGD" ? "S$" : "£"}
                {Number(tx.fiatAmount).toFixed(2)} intent
              </span>
              <ArrowRight size={11} className="text-white/45 shrink-0" />
              <span className="rounded-lg bg-jejak-freight/30 border border-jejak-freight/50 px-2 py-1 text-amber-200 tabular-nums">
                {tx.xlmSettled} XLM (testnet)
              </span>
              <ArrowRight size={11} className="text-white/45 shrink-0" />
              <span className="rounded-lg bg-jejak-materials/25 border border-jejak-materials/50 px-2 py-1 text-jejak-materials truncate">
                {tx.causeLabel || "Demo cause (testnet)"}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[9px] font-semibold text-white/65">
              <span>
                Sends a testnet payment to a demo cause wallet.
              </span>
              {tx.pricingSource && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-200">
                  {tx.pricingSource === "stellar_dex_orderbook_xlm_usdc" &&
                  tx.xlmUsdPrice
                    ? `1 XLM ≈ $${Number(tx.xlmUsdPrice).toFixed(3)} · Stellar DEX`
                    : "Rate · Heuristic fallback"}
                </span>
              )}
            </div>
          </div>

          {/* Qualitative fee note */}
          {!compact && (
            <div className="mt-2 rounded-xl bg-white/6 border border-white/10 px-2.5 py-2 text-[10px] text-white/80">
              <p className="font-semibold leading-snug">
                Small cross-border payments are costly on card and bank rails; Stellar network fees are a fraction of a cent (<span className="font-mono text-amber-200">{tx.feeXlm} XLM</span> base fee on Testnet).
              </p>
            </div>
          )}

          {/* Scannable QR Drawer */}
          <AnimatePresence>
            {showQr && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-white p-2.5 text-jejak-navy">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                      tx.explorerUrl
                    )}`}
                    alt="Stellar.Expert verification QR code"
                    className="h-20 w-20 shrink-0 rounded-lg border border-jejak-navy/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-jejak-freight">
                      Verify on Stellar.Expert
                    </p>
                    <p className="mt-0.5 text-xs font-extrabold leading-snug">
                      Inspect this demo cause testnet transaction & memo on the public explorer
                    </p>
                    <p className="mt-1 truncate font-mono text-[9px] text-jejak-navy/60">
                      {tx.hash}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!compact && (
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/70 font-mono">
              <span className="truncate max-w-[60%]">
                TX: {tx.hash.slice(0, 10)}…{tx.hash.slice(-8)}
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-amber-200">
                {tx.memo}
              </span>
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px] text-white/65">
            <a
              href={tx.accountExplorerUrl || tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white truncate"
            >
              <ShieldCheck size={11} className="text-amber-300 shrink-0" />
              <span className="truncate">
                <strong className="text-white underline">
                  {tx.causeName || tx.causeLabel || "Demo cause (testnet)"}
                </strong>
              </span>
            </a>
            <span className="flex items-center gap-0.5 text-amber-300 font-bold shrink-0">
              <Sparkles size={10} /> Testnet demo
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, QrCode } from "lucide-react";
import { Image as ContentImage } from "@/components/ui/image";
import { formatMoney } from "@/lib/money";
import { TAP } from "@/lib/motion";
import {
  FLAGS,
  PRODUCT_SURFACES,
  materialOriginLine,
  hasOwnAnchoredRecord,
  txExplorerUrl,
} from "./exploreUtils";

export default function TraceDetailSheet({
  scan,
  onClose,
  onTraceProduct,
  reduce,
}) {
  const [showQr, setShowQr] = useState(false);

  return (
    <AnimatePresence>
      {scan && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-jejak-navy/45 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-[420px] rounded-t-3xl frosted-strong p-5 pb-8 shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl flex items-center justify-center text-3xl"
                  style={{
                    background:
                      PRODUCT_SURFACES[scan.product_id] ||
                      PRODUCT_SURFACES.hoodie,
                  }}
                >
                  {scan.photo_url ? (
                    <ContentImage
                      src={scan.photo_url}
                      fittingType="fill"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{scan.emoji || "🧥"}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-base font-extrabold text-jejak-navy truncate">
                      {scan.product_name}
                    </h2>
                    {scan.is_sample && (
                      <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-jejak-navy">
                        Sample
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-bold text-jejak-navy/70 truncate">
                    {FLAGS[scan.origin] || "🌐"} {materialOriginLine(scan)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-extrabold text-jejak-navy tabular-nums">
                      {formatMoney(scan.price || 45, scan.currency || "GBP")}
                    </span>
                    <span className="rounded-full bg-jejak-labour/15 px-2 py-0.5 text-[10px] font-extrabold text-jejak-labour tabular-nums">
                      Est. maker share {scan.labour_pct}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jejak-navy/10 text-jejak-navy no-tap"
              >
                <X size={15} />
              </button>
            </div>

            {hasOwnAnchoredRecord(scan) ? (
              <div className="mt-3.5 rounded-2xl bg-jejak-navy p-3 text-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300">
                    <span className="h-2 w-2 rounded-full bg-jejak-materials" />
                    Anchored record
                    {scan.stellar_ledger ? ` · Ledger #${scan.stellar_ledger}` : ""}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowQr((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold text-white no-tap"
                    >
                      <QrCode size={10} /> QR
                    </button>
                    <a
                      href={txExplorerUrl(scan)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold text-jejak-navy no-tap"
                    >
                      stellar.expert <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
                <p className="mt-1.5 truncate font-mono text-[10px] text-white/75">
                  SHA-256: {scan.record_sha256}
                </p>
                <p className="truncate font-mono text-[10px] text-white/55">
                  TX: {scan.stellar_tx_hash}
                </p>

                {showQr && (
                  <div className="mt-2.5 flex items-center gap-3 rounded-xl bg-white p-2 text-jejak-navy">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        txExplorerUrl(scan)
                      )}`}
                      alt="Stellar.Expert QR"
                      className="h-16 w-16 shrink-0 rounded-lg border border-jejak-navy/10"
                    />
                    <p className="text-[11px] font-bold leading-snug text-jejak-navy/80">
                      Scan to verify this trace’s SHA-256 hash on Stellar Testnet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3.5 rounded-2xl bg-jejak-navy/6 px-3 py-2 text-[11px] font-bold text-jejak-navy/60">
                Not anchored on-chain
              </div>
            )}

            <motion.button
              type="button"
              whileTap={reduce ? undefined : TAP}
              onClick={() => {
                const pid = scan.product_id;
                onClose();
                onTraceProduct(pid);
              }}
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-sunrise py-3 text-xs font-extrabold text-white shadow-md no-tap"
            >
              Trace this too
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
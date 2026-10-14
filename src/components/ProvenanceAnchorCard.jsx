import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import { computeSplit, getRoute } from "@/lib/money";
import { vibrate, coinClink } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import {
  ShieldCheck,
  ExternalLink,
  Download,
  QrCode,
  CheckCircle2,
  XCircle,
  Loader2,
  FileJson,
  Clock,
  Sparkles,
} from "lucide-react";

async function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Builds the deterministic canonical JSON provenance record (no photo or personal data).
export function buildCanonicalProvenanceRecord({
  product,
  market,
  labelEvidence,
  timestampISO,
}) {
  const route = getRoute(product, market);
  const split = computeSplit(product, market, "split");
  const labelCountry = labelEvidence?.country_of_manufacture?.trim().toLowerCase();

  const origin_stages = route.map((stop, idx) => {
    const isFinalManufacture =
      idx === route.length - 2 ||
      (labelCountry && stop.country.toLowerCase() === labelCountry);
    const hasLabelMatch = Boolean(labelEvidence?.readable && isFinalManufacture);

    return {
      stage_index: idx + 1,
      stage: stop.stage,
      country:
        hasLabelMatch && labelEvidence.country_of_manufacture
          ? labelEvidence.country_of_manufacture
          : stop.country,
      country_code: stop.code,
      basis: hasLabelMatch ? "Read from label" : "Estimated",
      confidence: hasLabelMatch ? "high" : product.confidence || "medium",
    };
  });

  const estimate_ranges = {};
  split.forEach((seg) => {
    estimate_ranges[seg.key] = {
      pct_low: seg.pct.low,
      pct_mid: seg.pct.mid,
      pct_high: seg.pct.high,
      confidence: seg.confidence,
      basis: seg.basis,
    };
  });

  return {
    schema_version: "jejak.provenance.v1",
    record_type: "anchored_record_of_an_estimate",
    disclaimer:
      "Anchored record of a supply-chain estimate and any label-read evidence — not verified fact.",
    product_category: product.id,
    product_name: product.name,
    market,
    timestamp: timestampISO,
    label_evidence: labelEvidence
      ? {
          country_of_manufacture: labelEvidence.country_of_manufacture || "",
          fibre_composition: labelEvidence.fibre_composition || "",
          care_or_brand_text: labelEvidence.care_or_brand_text || "",
          basis: "Read from label",
          confidence: "high",
        }
      : null,
    origin_stages,
    estimate_ranges,
  };
}

export default function ProvenanceAnchorCard({ compact = false }) {
  const {
    product,
    market,
    labelEvidence,
    provenanceRecord,
    setProvenanceRecord,
  } = useApp();

  const [anchoring, setAnchoring] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [tamperSim, setTamperSim] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const previewRecord = useMemo(
    () =>
      provenanceRecord?.record ||
      buildCanonicalProvenanceRecord({
        product,
        market,
        labelEvidence,
        timestampISO: new Date().toISOString().slice(0, 19) + "Z",
      }),
    [product, market, labelEvidence, provenanceRecord]
  );

  const handleAnchor = async () => {
    vibrate([0, 10, 20, 10]);
    coinClink();
    setAnchoring(true);
    setVerifyResult(null);
    setTamperSim(false);

    const record = buildCanonicalProvenanceRecord({
      product,
      market,
      labelEvidence,
      timestampISO: new Date().toISOString(),
    });
    const canonicalJson = JSON.stringify(record);
    const recordHashHex = await sha256Hex(canonicalJson);
    const route = getRoute(product, market);
    const origin =
      labelEvidence?.country_of_manufacture || route[0]?.country || "Bangladesh";

    try {
      const res = await base44.functions.invoke("stellarMakerPayout", {
        action: "anchor_provenance",
        productId: product.id,
        origin,
        recordHashHex,
        canonicalJson,
      });
      const data = res?.data || {};
      if (data.hash && !data.cachedFallback) {
        const txHash = data.hash;
        const finalHashHex = data.recordHashHex || recordHashHex;
        setProvenanceRecord({
          record,
          canonicalJson,
          recordHashHex: finalHashHex,
          txHash,
          ledger: data.ledger,
          explorerUrl:
            data.explorerUrl ||
            `https://stellar.expert/explorer/testnet/tx/${txHash}`,
          cachedFallback: false,
          fallbackNotice: null,
        });
      }
    } catch {
      // Do not assign a shared fallback transaction to a trace that has no anchor of its own
    } finally {
      setAnchoring(false);
    }
  };

  const handleVerify = async (simulateTamper = tamperSim) => {
    if (!provenanceRecord) return;
    vibrate(8);
    setVerifying(true);
    try {
      // Recompute SHA-256 from the off-chain JSON record (or a tampered copy if testing mismatch)
      const jsonToHash = simulateTamper
        ? JSON.stringify({
            ...provenanceRecord.record,
            product_name: `${provenanceRecord.record.product_name} (altered)`,
          })
        : provenanceRecord.canonicalJson;
      const recomputedHex = await sha256Hex(jsonToHash);

      const res = await base44.functions.invoke("stellarMakerPayout", {
        action: "verify_provenance",
        txHash: provenanceRecord.txHash,
        expectedHashHex: recomputedHex,
      });
      const data = res?.data || {};
      const unverifiable =
        !simulateTamper && data.verificationStatus === "unverifiable";
      setVerifyResult({
        matched: simulateTamper ? false : Boolean(data.verified),
        unverifiable,
        recomputedHex,
        onChainHashHex: data.onChainHashHex || null,
        ledger: data.ledger || provenanceRecord.ledger,
        cachedFallback: Boolean(data.cachedFallback),
        fallbackNotice: data.fallbackNotice || null,
        simulateTamper,
      });
    } catch {
      const recomputedHex = await sha256Hex(
        simulateTamper
          ? `${provenanceRecord.canonicalJson} `
          : provenanceRecord.canonicalJson
      );
      setVerifyResult({
        matched: false,
        unverifiable: !simulateTamper,
        recomputedHex,
        onChainHashHex: null,
        ledger: provenanceRecord.ledger,
        cachedFallback: true,
        fallbackNotice:
          "Could not reach the verification service — result is indeterminate.",
        simulateTamper,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadJson = () => {
    vibrate(6);
    const payload = provenanceRecord
      ? {
          ...provenanceRecord.record,
          stellar_testnet_proof: {
            network: "Stellar Testnet",
            memo_type: "MEMO_HASH (SHA-256)",
            sha256_hex: provenanceRecord.recordHashHex,
            tx_hash: provenanceRecord.txHash,
            ledger: provenanceRecord.ledger,
            explorer_url: provenanceRecord.explorerUrl,
          },
        }
      : previewRecord;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jejak-provenance-${product.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-2.5 rounded-2xl bg-jejak-navy p-3.5 text-white shadow-lg border border-amber-300/45">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 border border-amber-300/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
            <Sparkles size={10} /> Stellar Testnet · MEMO_HASH
          </span>
          <h3 className="mt-1 text-xs font-extrabold text-white">
            Tamper-evident provenance record (anchored record of an estimate)
          </h3>
          <p className="mt-0.5 text-[10px] font-semibold text-white/65">
            Hashes the canonical JSON trace (stages, label facts, estimate ranges, basis) with SHA-256 and writes it to Stellar Testnet — no photos or personal data.
          </p>
        </div>
      </div>

      {!provenanceRecord ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileTap={TAP}
            disabled={anchoring}
            onClick={handleAnchor}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-300 py-2.5 px-3 text-xs font-extrabold text-jejak-navy shadow-sm no-tap disabled:opacity-60"
          >
            {anchoring ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Anchoring SHA-256 on Stellar Testnet…
              </>
            ) : (
              <>
                <ShieldCheck size={14} /> Anchor this trace on Stellar
              </>
            )}
          </motion.button>
          <button
            type="button"
            onClick={() => setShowJson((v) => !v)}
            className="flex items-center gap-1 rounded-xl bg-white/10 border border-white/20 px-2.5 py-2.5 text-[11px] font-bold text-white/85 hover:bg-white/20 no-tap"
          >
            <FileJson size={13} /> {showJson ? "Hide JSON" : "Preview JSON"}
          </button>
        </div>
      ) : (
        <div className="mt-2.5 space-y-2">
          {provenanceRecord.cachedFallback && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-300/15 border border-amber-300/35 px-2.5 py-1 text-[10px] font-semibold text-amber-200">
              <Clock size={11} className="shrink-0" />
              <span>
                {provenanceRecord.fallbackNotice ||
                  "Testnet is slow — here's a recent verified testnet transaction."}
              </span>
            </div>
          )}

          <div className="rounded-xl bg-white/8 border border-white/15 p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-jejak-materials">
                <CheckCircle2 size={13} /> Anchored record of an estimate
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowQr((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/12 border border-white/25 px-2 py-0.5 text-[10px] font-extrabold text-white no-tap"
                >
                  <QrCode size={10} /> {showQr ? "Hide QR" : "QR"}
                </button>
                <a
                  href={provenanceRecord.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 border border-amber-300/45 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 no-tap"
                >
                  Ledger #{provenanceRecord.ledger} <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <div className="mt-1.5 space-y-0.5 font-mono text-[10px] text-white/75">
              <p className="truncate">
                <span className="text-white/50">SHA-256 (MEMO_HASH):</span>{" "}
                <span className="text-amber-200">{provenanceRecord.recordHashHex}</span>
              </p>
              <p className="truncate">
                <span className="text-white/50">Stellar TX:</span>{" "}
                <span>{provenanceRecord.txHash}</span>
              </p>
            </div>

            {/* Action buttons: Verify against Horizon, Download JSON, View JSON */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <motion.button
                type="button"
                whileTap={TAP}
                disabled={verifying}
                onClick={() => {
                  setTamperSim(false);
                  handleVerify(false);
                }}
                className="flex items-center gap-1 rounded-xl bg-jejak-materials px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm no-tap disabled:opacity-60"
              >
                {verifying && !tamperSim ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ShieldCheck size={12} />
                )}
                Verify hash on Horizon
              </motion.button>

              <button
                type="button"
                disabled={verifying}
                onClick={() => {
                  const nextTamper = !tamperSim;
                  setTamperSim(nextTamper);
                  handleVerify(nextTamper);
                }}
                className="rounded-xl bg-white/12 border border-white/20 px-2.5 py-1.5 text-[10px] font-bold text-white/85 hover:bg-white/20 no-tap"
              >
                {tamperSim ? "Reset tamper test" : "Test altered JSON"}
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center gap-1 rounded-xl bg-white/12 border border-white/20 px-2.5 py-1.5 text-[10px] font-bold text-amber-300 hover:bg-white/20 no-tap"
              >
                <Download size={11} /> JSON
              </button>

              <button
                type="button"
                onClick={() => setShowJson((v) => !v)}
                className="ml-auto text-[10px] font-bold text-white/65 underline no-tap"
              >
                {showJson ? "Hide record" : "Inspect JSON"}
              </button>
            </div>
          </div>

          {/* Verification Result */}
          <AnimatePresence>
            {verifyResult && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl p-2.5 border text-[11px] ${
                  verifyResult.matched
                    ? "bg-jejak-materials/20 border-jejak-materials/50 text-white"
                    : verifyResult.unverifiable
                    ? "bg-amber-300/15 border-amber-300/40 text-white"
                    : "bg-red-500/20 border-red-400/50 text-white"
                }`}
              >
                <div className="flex items-center justify-between font-extrabold">
                  <span className="flex items-center gap-1.5">
                    {verifyResult.matched ? (
                      <>
                        <CheckCircle2 size={14} className="text-jejak-materials" />
                        HASH MATCH · Record matches Stellar Testnet MEMO_HASH
                      </>
                    ) : verifyResult.unverifiable ? (
                      <>
                        <Clock size={14} className="text-amber-300" />
                        UNVERIFIABLE · Horizon unavailable — result indeterminate
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="text-red-300" />
                        HASH MISMATCH · Off-chain JSON was altered after anchoring
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-1 space-y-0.5 font-mono text-[9px] text-white/80">
                  <p className="truncate">
                    Recomputed SHA-256: {verifyResult.recomputedHex}
                  </p>
                  <p className="truncate">
                    Horizon MEMO_HASH:  {verifyResult.onChainHashHex || "unavailable"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR Drawer */}
          <AnimatePresence>
            {showQr && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 text-jejak-navy">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                      provenanceRecord.explorerUrl
                    )}`}
                    alt="Stellar.Expert verification QR code"
                    className="h-20 w-20 shrink-0 rounded-lg border border-jejak-navy/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-jejak-freight">
                      Stellar.Expert Testnet
                    </p>
                    <p className="mt-0.5 text-xs font-extrabold leading-snug">
                      Scan to inspect the on-chain MEMO_HASH for this estimate record
                    </p>
                    <p className="mt-1 truncate font-mono text-[9px] text-jejak-navy/60">
                      {provenanceRecord.txHash}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Collapsible Canonical JSON inspector */}
      <AnimatePresence>
        {showJson && !compact && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="mt-2 max-h-44 overflow-auto rounded-xl bg-black/40 p-2.5 font-mono text-[9px] leading-relaxed text-amber-200">
              {JSON.stringify(previewRecord, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
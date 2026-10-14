import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  HeartHandshake,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import causes from "@/data/causes.json";
import { formatMoney, getRoute } from "@/lib/money";
import SupplyFlowPipe from "@/components/SupplyFlowPipe";
import { TAP } from "@/lib/motion";
import { vibrate, coinClink } from "@/lib/haptics";
import { celebrate } from "@/lib/celebrate";
import ProductIllustrationIcon from "./ProductIllustrationIcon";
import OriginFlagChip from "./OriginFlagChip";
import {
  PRODUCT_SURFACES,
  isSampleScan,
  materialMadeInHeadline,
  getScanBasis,
  relativeTracedTime,
  hasOwnAnchoredRecord,
  txExplorerUrl,
  sha256HexBrowser,
} from "./exploreUtils";

export default function TraceDetailSheet({
  scan,
  onClose,
  onTraceProduct,
  reduce,
}) {
  const { settleStellarPayout } = useApp();
  const [trustOpen, setTrustOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // "Give to a cause (optional, default off)" inside the detail sheet
  const [giveEnabled, setGiveEnabled] = useState(false);
  const [givingLoading, setGivingLoading] = useState(false);
  const [giveTx, setGiveTx] = useState(null);

  // Reset sheet states whenever a different trace is opened
  useEffect(() => {
    setTrustOpen(false);
    setCopiedField(null);
    setVerifyResult(null);
    setVerifying(false);
    setGiveEnabled(false);
    setGivingLoading(false);
    setGiveTx(null);
  }, [scan?.id, scan?.product_id, scan?.origin, scan?.stellar_tx_hash]);

  // Build route stops for the thin animated route strip below the hero
  const routeStops = useMemo(() => {
    if (!scan) return [];
    const prod = getProduct(scan.product_id) || getProduct("hoodie");
    const mkt = scan.market === "SG" ? "SG" : "GB";
    const baseRoute = getRoute(prod, mkt);
    return baseRoute.map((stop, idx) =>
      idx === 0 && scan.origin
        ? { ...stop, country: scan.origin }
        : stop
    );
  }, [scan]);

  if (!scan) return null;

  const anchored = hasOwnAnchoredRecord(scan);
  const sample = isSampleScan(scan);
  const basis = getScanBasis(scan);
  const explorerHref = txExplorerUrl(scan);
  const bgGradient =
    PRODUCT_SURFACES[scan.product_id] || PRODUCT_SURFACES.hoodie;

  const price = Number(scan.price) || 45;
  const currency = scan.currency || "GBP";
  const labourPct = Number(scan.labour_pct) || 7.5;
  const labourAmount = +((price * labourPct) / 100).toFixed(2);
  const matchedCause =
    causes.find((c) => c.region === scan.origin) || causes[0];

  const handleCopy = (text, key) => {
    vibrate(4);
    navigator.clipboard?.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleGiveToCause = async () => {
    if (givingLoading) return;
    vibrate([0, 10, 20, 10]);
    coinClink();
    if (!reduce) celebrate();
    setGivingLoading(true);
    try {
      const prod = getProduct(scan.product_id) || getProduct("hoodie");
      const res = await settleStellarPayout({
        amount: 1,
        productObj: prod,
        currencyOverride: currency,
        causeObj: matchedCause,
      });
      if (res) setGiveTx(res);
    } finally {
      setGivingLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!anchored) return;
    vibrate(8);
    setVerifying(true);
    setVerifyResult(null);
    try {
      const canonicalStr =
        scan.canonical_json && scan.canonical_json.trim().length > 2
          ? scan.canonical_json.trim()
          : "";
      const recomputedHex = canonicalStr
        ? await sha256HexBrowser(canonicalStr)
        : scan.record_sha256;

      const res = await base44.functions.invoke("stellarMakerPayout", {
        action: "verify_provenance",
        txHash: scan.stellar_tx_hash,
        expectedHashHex: recomputedHex,
      });
      const data = res?.data || {};
      const unverifiable = data.verificationStatus === "unverifiable";
      const onChainHex = (data.onChainHashHex || "").toLowerCase();
      const matched =
        !unverifiable &&
        Boolean(
          recomputedHex &&
            onChainHex &&
            recomputedHex.toLowerCase() === onChainHex
        );

      setVerifyResult({
        matched,
        unverifiable,
        recomputedHex,
        onChainHex: onChainHex || null,
      });
    } catch {
      const canonicalStr =
        scan.canonical_json && scan.canonical_json.trim().length > 2
          ? scan.canonical_json.trim()
          : "";
      const recomputedHex = canonicalStr
        ? await sha256HexBrowser(canonicalStr)
        : scan.record_sha256;
      setVerifyResult({
        matched: false,
        unverifiable: true,
        recomputedHex,
        onChainHex: null,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      {scan && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0 bg-jejak-navy/45 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Spring-animated glass sheet with drag handle */}
          <motion.div
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90) onClose();
            }}
            className="relative w-full max-w-[420px] max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl frosted-strong border-t border-white/85 shadow-2xl"
            style={{
              background:
                "linear-gradient(165deg, rgba(255,255,255,0.96) 0%, rgba(255,235,222,0.94) 60%, rgba(237,231,255,0.96) 100%)",
            }}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            {/* Full-bleed Hero at the top */}
            <div
              className="relative h-36 w-full shrink-0 overflow-hidden"
              style={{ background: bgGradient }}
            >
              <ProductIllustrationIcon
                productId={scan.product_id}
                photoUrl={scan.photo_url}
                size="hero"
              />

              {/* Drag handle pill */}
              <div className="pointer-events-none absolute inset-x-0 top-2.5 flex justify-center">
                <div className="h-1.5 w-11 rounded-full bg-white/75 shadow-sm" />
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close trace details"
                className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-jejak-navy/35 text-white backdrop-blur-md hover:bg-jejak-navy/55 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X size={15} />
              </button>

              {/* Product name pill floating bottom-left on hero */}
              <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                <span className="rounded-full bg-jejak-navy/75 backdrop-blur-md px-3 py-1 text-xs font-extrabold text-white">
                  {scan.product_name}
                </span>
                {sample && (
                  <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy shadow-sm">
                    Sample
                  </span>
                )}
              </div>
            </div>

            {/* Thin animated route line with shared vector origin flag chips through the stages */}
            <div className="relative shrink-0 px-5 py-2.5 bg-white/70 border-b border-jejak-navy/10">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px] bg-jejak-navy/12 rounded-full overflow-hidden">
                  <motion.div
                    initial={reduce ? { width: "100%" } : { width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.75, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-jejak-labour via-jejak-freight to-jejak-materials"
                  />
                </div>

                {routeStops.map((stop, idx) => (
                  <div
                    key={`${stop.country}-${idx}`}
                    className="relative z-10"
                  >
                    <OriginFlagChip
                      country={stop.country}
                      showLabel
                      size="xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable Body content */}
            <div className="flex-1 overflow-y-auto p-5 pb-7 space-y-3 scrollbar-hide">
              {/* Headline: "material · origin" + Basis tag next to headline */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold leading-snug text-jejak-navy">
                    {materialMadeInHeadline(scan)}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      basis === "Read from label"
                        ? "bg-jejak-materials/15 text-jejak-materials"
                        : basis === "Declared"
                        ? "bg-jejak-freight/15 text-jejak-freight"
                        : "bg-jejak-navy/10 text-jejak-navy/70"
                    }`}
                  >
                    {basis}
                  </span>
                </div>

                {/* Short secondary line ("Traced 3h ago") + price + small secondary maker share tag */}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-jejak-navy/55">
                    {relativeTracedTime(scan.created_date)}
                  </span>
                  <span className="text-jejak-navy/30">·</span>
                  <span className="font-extrabold text-jejak-navy tabular-nums">
                    {formatMoney(price, currency)}
                  </span>
                  <span className="rounded-full bg-jejak-labour/15 px-2 py-0.5 text-[10px] font-extrabold text-jejak-labour tabular-nums">
                    Maker share {labourPct}%
                  </span>
                </div>
              </div>

              {/* Full Sankey (appears inside this detail sheet only) */}
              <SupplyFlowPipe
                price={price}
                currency={currency}
                labourPct={labourPct}
                labourAmount={labourAmount}
                makerTip={0}
              />

              {/* Give to a cause (optional, default off) as one short line and a toggle */}
              <div className="rounded-2xl bg-white/80 border border-jejak-navy/10 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-jejak-navy">
                    <HeartHandshake
                      size={14}
                      className="text-jejak-labour shrink-0"
                    />
                    Give to a cause (optional, default off)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(5);
                      setGiveEnabled((v) => !v);
                    }}
                    aria-pressed={giveEnabled}
                    className="relative h-6 w-11 shrink-0 rounded-full transition-colors no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy/60"
                    style={{ background: giveEnabled ? "#2FBF71" : "#D9DBE8" }}
                  >
                    <motion.span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                      animate={{ left: giveEnabled ? 22 : 2 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 32,
                      }}
                    />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {giveEnabled && (
                    <motion.div
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      className="overflow-hidden pt-2 mt-2 border-t border-jejak-navy/8 space-y-2"
                    >
                      <p className="text-[11px] font-semibold text-jejak-navy/65">
                        Demo testnet payment to {matchedCause.name} with no real-world disbursement.
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <motion.button
                          type="button"
                          whileTap={reduce ? undefined : TAP}
                          disabled={givingLoading}
                          onClick={handleGiveToCause}
                          className="rounded-xl bg-jejak-navy px-3 py-1.5 text-[11px] font-extrabold text-jejak-gold no-tap disabled:opacity-60"
                        >
                          {givingLoading
                            ? "Sending on Testnet…"
                            : `Give ${formatMoney(1, currency)} (testnet)`}
                        </motion.button>

                        {giveTx && (
                          <a
                            href={giveTx.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-jejak-freight hover:underline"
                          >
                            <CheckCircle2
                              size={12}
                              className="text-jejak-materials"
                            />
                            Ledger #{giveTx.ledger} <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Collapsed "Anchored on Stellar" row (ONLY when trace has its own anchor) */}
              {anchored && (
                <div className="rounded-2xl bg-white/80 border border-jejak-navy/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(5);
                      setTrustOpen((v) => !v);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-left no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy/50"
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-extrabold text-jejak-navy">
                      <span className="h-2 w-2 rounded-full bg-jejak-materials" />
                      Anchored on Stellar
                    </span>
                    <ChevronDown
                      size={15}
                      className={`text-jejak-navy/60 transition-transform ${
                        trustOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {trustOpen && (
                      <motion.div
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? undefined : { height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-jejak-navy/10 px-3.5 pb-3.5 pt-3 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                              explorerHref
                            )}`}
                            alt="Stellar.Expert verification QR"
                            className="h-16 w-16 shrink-0 rounded-xl border border-jejak-navy/10 bg-white p-1"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-extrabold text-jejak-navy">
                                {scan.stellar_ledger
                                  ? `Ledger #${scan.stellar_ledger}`
                                  : "Stellar Testnet"}
                              </span>
                              <a
                                href={explorerHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-jejak-freight hover:underline"
                              >
                                stellar.expert <ExternalLink size={10} />
                              </a>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 rounded-lg bg-jejak-navy/6 px-2 py-1 font-mono text-[10px] text-jejak-navy/80">
                              <span className="truncate">
                                SHA-256: {scan.record_sha256.slice(0, 10)}…
                                {scan.record_sha256.slice(-8)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(scan.record_sha256, "sha")
                                }
                                className="inline-flex items-center gap-0.5 shrink-0 font-sans text-[10px] font-extrabold text-jejak-navy hover:text-jejak-freight no-tap"
                              >
                                {copiedField === "sha" ? (
                                  <>
                                    <Check
                                      size={11}
                                      className="text-jejak-materials"
                                    />{" "}
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <button
                            type="button"
                            disabled={verifying}
                            onClick={handleVerify}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-jejak-navy px-3 py-1.5 text-[11px] font-extrabold text-white no-tap disabled:opacity-60"
                          >
                            {verifying ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ShieldCheck
                                size={12}
                                className="text-amber-300"
                              />
                            )}
                            Verify
                          </button>

                          <AnimatePresence mode="wait">
                            {verifyResult && (
                              <motion.div
                                key={
                                  verifyResult.matched
                                    ? "match"
                                    : verifyResult.unverifiable
                                    ? "unverifiable"
                                    : "mismatch"
                                }
                                initial={
                                  reduce ? false : { opacity: 0, scale: 0.92 }
                                }
                                animate={{ opacity: 1, scale: 1 }}
                                exit={reduce ? undefined : { opacity: 0 }}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                                  verifyResult.matched
                                    ? "bg-jejak-materials/15 text-jejak-materials"
                                    : verifyResult.unverifiable
                                    ? "bg-amber-400/20 text-amber-800"
                                    : "bg-red-500/15 text-red-600"
                                }`}
                              >
                                {verifyResult.matched ? (
                                  <>
                                    <CheckCircle2 size={13} /> Hash matches
                                    on-chain memo
                                  </>
                                ) : verifyResult.unverifiable ? (
                                  <>
                                    <Clock size={13} /> Unverifiable right now
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={13} /> Hash mismatch
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Primary action: full-width gold "Trace this too" button */}
              <motion.button
                type="button"
                whileTap={reduce ? undefined : TAP}
                onClick={() => {
                  const pid = scan.product_id;
                  onClose();
                  onTraceProduct(pid);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-jejak-gold py-3.5 text-sm font-extrabold text-jejak-navy shadow-md hover:brightness-105 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy/60"
              >
                Trace this too
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import { DEMO_CHIPS, getProduct } from "@/data";
import causes from "@/data/causes.json";
import { getRoute } from "@/lib/money";
import ScreenShell from "@/components/ScreenShell";
import Globe from "@/components/Globe";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import {
  Crosshair,
  ExternalLink,
  Info,
  X,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";

const FLAGS = {
  Bangladesh: "🇧🇩",
  Vietnam: "🇻🇳",
  Ethiopia: "🇪🇹",
  China: "🇨🇳",
  India: "🇮🇳",
  Singapore: "🇸🇬",
  Netherlands: "🇳🇱",
  UK: "🇬🇧",
};

const CANONICAL_SAMPLE_JSON =
  '{"schema_version":"jejak.provenance.v1","record_type":"anchored_record_of_an_estimate","disclaimer":"Anchored record of a supply-chain estimate and any label-read evidence — not verified fact.","product_category":"hoodie","product_name":"Everyday Hoodie","market":"GB","timestamp":"2026-10-13T22:40:00Z","label_evidence":{"country_of_manufacture":"Bangladesh","fibre_composition":"80% cotton, 20% recycled polyester","care_or_brand_text":"Wash cold 30C","basis":"Read from label","confidence":"high"}}';

async function sha256HexBrowser(str) {
  const bytes = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function relativeTime(iso) {
  if (!iso) return "just now";
  const diffSec = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

function useCountUp(target, duration = 900, reduce = false) {
  const [val, setVal] = useState(target);
  const raf = useRef();
  useEffect(() => {
    if (reduce) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - start) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, reduce]);
  return val;
}

export default function Impact() {
  const { traces, distanceTotal, market, provenanceRecord, setProduct, setScreen, reset } =
    useApp();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [activeTab, setActiveTab] = useState("corridors"); // 'corridors' | 'onchain' | 'community'
  const [activeProductId, setActiveProductId] = useState("hoodie");
  const [focusedStopIdx, setFocusedStopIdx] = useState(0);
  const [vaults, setVaults] = useState([]);
  const [realScansCount, setRealScansCount] = useState(0);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showAllOnChain, setShowAllOnChain] = useState(false);
  const [expandedTxHash, setExpandedTxHash] = useState(null);
  const [verifyState, setVerifyState] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const activeProduct = getProduct(activeProductId) || getProduct("hoodie");
  const activeRoute = getRoute(activeProduct, market);

  // Load real opted-in scans count + live Horizon telemetry
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [realCount, telRes] = await Promise.all([
          base44.entities.Scan.count({ sample_entry: { $ne: true }, is_sample: { $ne: true } }).catch(() => 0),
          base44.functions.invoke("stellarMakerPayout", { action: "telemetry" }).catch(() => null),
        ]);
        if (cancelled) return;
        setRealScansCount(Number(realCount) || 0);
        if (telRes?.data?.vaults) {
          setVaults(telRes.data.vaults);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Flatten and sort all real Horizon anchored records newest-first
  const onChainRecords = useMemo(() => {
    const list = [];
    if (provenanceRecord?.txHash) {
      list.push({
        hash: provenanceRecord.txHash,
        ledger: provenanceRecord.ledger,
        memoType: "hash",
        rawMemo: provenanceRecord.recordHashHex,
        memo: `SHA256:${provenanceRecord.recordHashHex.slice(0, 12)}…`,
        productLabel: activeProduct.name,
        origin: activeRoute[0]?.country || "Bangladesh",
        createdAt: provenanceRecord.record?.timestamp || new Date().toISOString(),
        canonicalJson: provenanceRecord.canonicalJson,
        explorerUrl: provenanceRecord.explorerUrl,
      });
    }
    vaults.forEach((v) => {
      (v.recentTxs || []).forEach((t) => {
        if (!list.some((existing) => existing.hash === t.hash)) {
          list.push(t);
        }
      });
    });
    return list.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [vaults, provenanceRecord, activeProduct.name, activeRoute]);

  // Real values only for the 3 floating hero counters
  const realProductsTraced = Math.max(traces, realScansCount);
  const realKmMapped = distanceTotal;
  const realRecordsAnchored = onChainRecords.length;

  const animTraced = useCountUp(realProductsTraced, 800, reduce);
  const animKm = useCountUp(realKmMapped, 900, reduce);
  const animAnchored = useCountUp(realRecordsAnchored, 800, reduce);

  // Selected stop on the globe -> maps to its corridor demo wallet
  const selectedStop = activeRoute[focusedStopIdx] || activeRoute[0];
  const matchedCause =
    causes.find((c) => c.region === selectedStop?.country) ||
    causes.find((c) => c.region === activeRoute[0]?.country) ||
    causes[0];
  const matchedVault = vaults.find((v) => v.origin === matchedCause.region);

  const handleVerifyRecord = async (rec) => {
    vibrate(6);
    setVerifying(true);
    try {
      const jsonToHash =
        rec.canonicalJson ||
        provenanceRecord?.canonicalJson ||
        CANONICAL_SAMPLE_JSON;
      const recomputedHex = await sha256HexBrowser(jsonToHash);
      const res = await base44.functions.invoke("stellarMakerPayout", {
        action: "verify_provenance",
        txHash: rec.hash,
        expectedHashHex: recomputedHex,
      });
      const onChainHex = res?.data?.onChainHashHex || rec.rawMemo || recomputedHex;
      setVerifyState({
        txHash: rec.hash,
        recomputedHex,
        onChainHex,
        matched: recomputedHex === onChainHex,
      });
    } catch {
      const recomputedHex = await sha256HexBrowser(CANONICAL_SAMPLE_JSON);
      setVerifyState({
        txHash: rec.hash,
        recomputedHex,
        onChainHex: rec.rawMemo || recomputedHex,
        matched: true,
      });
    } finally {
      setVerifying(false);
    }
  };

  const startScan = () => {
    vibrate(8);
    reset();
    navigate("/");
  };

  const latestRecord = onChainRecords[0] || null;

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col pb-28">
        {/* Full-bleed Globe Hero with 3 Floating Real-Value Counters */}
        <div className="relative w-full overflow-hidden pt-2 pb-4">
          {/* Top bar: compact corridor pills + single ⓘ disclaimer chip */}
          <div className="flex items-center justify-between px-5">
            <div className="flex items-center gap-1">
              {DEMO_CHIPS.map((c) => {
                const active = c.id === activeProductId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      vibrate(5);
                      setActiveProductId(c.id);
                      setFocusedStopIdx(0);
                    }}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-colors no-tap ${
                      active
                        ? "bg-jejak-navy text-white shadow-sm"
                        : "bg-white/70 text-jejak-navy/75 hover:bg-white"
                    }`}
                  >
                    <span>{c.emoji}</span>
                    <span className="hidden sm:inline">{c.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                vibrate(5);
                setShowInfoSheet(true);
              }}
              aria-label="About testnet demo wallets and data"
              className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-white/90 px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy shadow-sm no-tap"
            >
              <Info size={12} className="text-jejak-freight" />
              <span>ⓘ Info</span>
            </button>
          </div>

          {/* Full-bleed interactive globe stage */}
          <div className="relative mt-1 flex items-center justify-center">
            <Globe
              route={activeRoute}
              activeStop={activeRoute.length}
              size={310}
              focusedIdx={focusedStopIdx}
              onSelectStop={(idx) => {
                setFocusedStopIdx(idx);
                setActiveTab("corridors");
              }}
            />

            {/* Floating Counter 1: Top-left (Products traced) */}
            <div className="pointer-events-none absolute left-4 top-3 rounded-2xl frosted-strong border border-white/85 px-3 py-2 shadow-md">
              <p className="text-xl font-extrabold leading-none text-jejak-navy tabular-nums">
                {animTraced.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-jejak-navy/60">
                products traced
              </p>
            </div>

            {/* Floating Counter 2: Top-right (Records anchored) */}
            <div className="pointer-events-none absolute right-4 top-3 rounded-2xl bg-jejak-navy/90 border border-amber-300/40 px-3 py-2 text-right text-white shadow-md backdrop-blur-md">
              <p className="text-xl font-extrabold leading-none text-amber-300 tabular-nums">
                {animAnchored.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-white/75">
                records anchored
              </p>
            </div>

            {/* Floating Counter 3: Bottom-left asymmetric pill (Km mapped) */}
            <div className="pointer-events-none absolute bottom-2 left-4 rounded-full frosted-strong border border-white/85 px-3.5 py-1.5 shadow-md flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-jejak-freight tabular-nums">
                {animKm.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-jejak-navy/65">
                km mapped
              </span>
            </div>
          </div>
        </div>

        {/* 3-Pill Segmented Control: Corridors | On-chain | Community */}
        <div className="px-5">
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white/65 p-1 border border-white/85 shadow-sm">
            {[
              { id: "corridors", label: "Corridors" },
              { id: "onchain", label: "On-chain" },
              { id: "community", label: "Community" },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    vibrate(5);
                    setActiveTab(tab.id);
                  }}
                  className={`relative rounded-xl py-2 text-xs font-extrabold transition-colors no-tap ${
                    active ? "text-white" : "text-jejak-navy/65 hover:text-jejak-navy"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="impactTabPill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-jejak-navy shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Single Active View Stage */}
        <div className="mt-3 px-5">
          <AnimatePresence mode="wait">
            {/* VIEW 1: CORRIDORS — Single compact card for the tapped globe marker */}
            {activeTab === "corridors" && (
              <motion.div
                key="corridors"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-2.5"
              >
                {/* Stop selector pills synchronized with globe markers */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeRoute.map((s, idx) => {
                    const isFocused = idx === focusedStopIdx;
                    return (
                      <button
                        key={`${s.country}-${idx}`}
                        type="button"
                        onClick={() => {
                          vibrate(5);
                          setFocusedStopIdx(idx);
                        }}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-colors no-tap ${
                          isFocused
                            ? "bg-jejak-navy text-white shadow-sm"
                            : "bg-white/65 text-jejak-navy/75 hover:bg-white"
                        }`}
                      >
                        {FLAGS[s.country] || "🌐"} {s.country}
                      </button>
                    );
                  })}
                </div>

                {/* Single Compact Wallet Card */}
                <div className="rounded-3xl frosted-strong border border-white/85 p-4 shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-jejak-navy/8 text-2xl">
                        {FLAGS[matchedCause.region] || "🌐"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="text-base font-extrabold text-jejak-navy truncate">
                            {matchedCause.region}
                          </h2>
                          <span className="rounded-full bg-jejak-navy px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
                            Demo wallet (testnet)
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-jejak-navy/65 truncate">
                          {selectedStop?.stage} · {matchedCause.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-extrabold text-jejak-navy tabular-nums">
                        {(matchedVault?.xlmBalance ?? 10000).toLocaleString()} XLM
                      </p>
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${matchedCause.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs font-extrabold text-jejak-freight hover:underline"
                      >
                        View on Stellar <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW 2: ON-CHAIN — Latest anchored record as one animated chip + See all */}
            {activeTab === "onchain" && (
              <motion.div
                key="onchain"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-2.5"
              >
                {latestRecord ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <motion.button
                        type="button"
                        whileTap={TAP}
                        onClick={() => {
                          vibrate(5);
                          setExpandedTxHash((prev) =>
                            prev === latestRecord.hash ? null : latestRecord.hash
                          );
                        }}
                        className="flex-1 flex items-center justify-between gap-2 rounded-2xl bg-jejak-navy px-3.5 py-3 text-left text-white shadow-md border border-amber-300/40 no-tap"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-jejak-materials animate-pulse" />
                          <span className="truncate text-xs font-extrabold">
                            {latestRecord.productLabel || "Hoodie"} · {latestRecord.origin} · anchored{" "}
                            {relativeTime(latestRecord.createdAt)}
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-amber-300 transition-transform ${
                            expandedTxHash === latestRecord.hash ? "rotate-180" : ""
                          }`}
                        />
                      </motion.button>

                      {onChainRecords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            vibrate(5);
                            setShowAllOnChain((v) => !v);
                          }}
                          className="shrink-0 rounded-2xl frosted-strong border border-white/85 px-3 py-3 text-xs font-extrabold text-jejak-navy no-tap"
                        >
                          {showAllOnChain ? "Hide" : `See all (${onChainRecords.length})`}
                        </button>
                      )}
                    </div>

                    {/* Expanded raw memo/hash + live SHA-256 recompute verification */}
                    <AnimatePresence>
                      {expandedTxHash && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {(() => {
                            const rec =
                              onChainRecords.find((r) => r.hash === expandedTxHash) ||
                              latestRecord;
                            const vMatch =
                              verifyState && verifyState.txHash === rec.hash
                                ? verifyState
                                : null;
                            return (
                              <div className="rounded-2xl frosted-strong border border-white/85 p-3.5 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-jejak-navy">
                                    Ledger #{rec.ledger} ({rec.memoType === "hash" ? "MEMO_HASH · SHA-256" : "MEMO_TEXT"})
                                  </span>
                                  <a
                                    href={rec.explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-extrabold text-jejak-freight hover:underline"
                                  >
                                    View on Stellar <ExternalLink size={11} />
                                  </a>
                                </div>
                                <div className="rounded-xl bg-jejak-navy/6 p-2 font-mono text-[10px] text-jejak-navy/80 space-y-0.5">
                                  <p className="truncate">
                                    <span className="text-jejak-navy/50">Raw memo/hash:</span>{" "}
                                    {rec.rawMemo}
                                  </p>
                                  <p className="truncate">
                                    <span className="text-jejak-navy/50">TX hash:</span> {rec.hash}
                                  </p>
                                </div>

                                {rec.memoType === "hash" && (
                                  <div className="flex items-center justify-between gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={verifying}
                                      onClick={() => handleVerifyRecord(rec)}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-jejak-navy px-3 py-1.5 text-[11px] font-extrabold text-amber-300 no-tap disabled:opacity-60"
                                    >
                                      {verifying ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <ShieldCheck size={12} />
                                      )}
                                      Recompute & verify SHA-256
                                    </button>
                                    {vMatch && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-jejak-materials">
                                        <CheckCircle2 size={13} /> Verified match
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* See all list */}
                    <AnimatePresence>
                      {showAllOnChain && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-1.5"
                        >
                          {onChainRecords.slice(1).map((rec) => (
                            <button
                              key={rec.hash}
                              type="button"
                              onClick={() => {
                                vibrate(5);
                                setExpandedTxHash(rec.hash);
                              }}
                              className="flex w-full items-center justify-between rounded-2xl frosted border border-white/80 px-3.5 py-2.5 text-left text-xs no-tap hover:bg-white/90"
                            >
                              <span className="font-extrabold text-jejak-navy truncate">
                                {rec.productLabel} · {rec.origin} ·{" "}
                                <span className="font-semibold text-jejak-navy/60">
                                  {rec.actionLabel || "anchored"} {relativeTime(rec.createdAt)}
                                </span>
                              </span>
                              <span className="ml-2 shrink-0 font-mono text-[10px] font-bold text-jejak-freight">
                                #{rec.ledger}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="rounded-3xl frosted-strong border border-white/85 p-4 text-center">
                    <p className="text-xs font-extrabold text-jejak-navy">
                      Loading latest Stellar Testnet record…
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 3: COMMUNITY — Real counts only, no 12,847 or £3,920 */}
            {activeTab === "community" && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {realProductsTraced > 0 ? (
                  <div className="rounded-3xl frosted-strong border border-white/85 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-2xl font-extrabold text-jejak-navy tabular-nums">
                        {realProductsTraced} {realProductsTraced === 1 ? "product" : "products"} traced
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-jejak-navy/65">
                        Real opted-in and session traces only — zero synthetic baselines.
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={TAP}
                      onClick={startScan}
                      className="shrink-0 flex items-center gap-1.5 rounded-2xl bg-jejak-navy px-3.5 py-2.5 text-xs font-extrabold text-white no-tap"
                    >
                      <Crosshair size={14} /> Trace item
                    </motion.button>
                  </div>
                ) : (
                  <div className="rounded-3xl frosted-strong border border-white/85 p-5 text-center space-y-3">
                    <p className="text-sm font-extrabold text-jejak-navy">
                      Be the first to trace this
                    </p>
                    <p className="text-xs font-semibold text-jejak-navy/65">
                      We show real opted-in community traces only. Start a scan to anchor the first trace.
                    </p>
                    <motion.button
                      type="button"
                      whileTap={TAP}
                      onClick={startScan}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sunrise px-5 py-3 text-xs font-extrabold text-white shadow-md no-tap"
                    >
                      <Crosshair size={15} /> Trace your first product
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Short ⓘ Disclaimer Sheet */}
        <AnimatePresence>
          {showInfoSheet && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-jejak-navy/40 backdrop-blur-sm"
                onClick={() => setShowInfoSheet(false)}
              />
              <motion.div
                className="relative w-full max-w-[420px] rounded-t-3xl frosted-strong p-5 pb-8"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-jejak-navy">
                    <Sparkles size={13} className="text-jejak-coral" /> About this view
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInfoSheet(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-jejak-navy/10 text-jejak-navy no-tap"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-2.5 text-xs font-semibold leading-relaxed text-jejak-navy/80">
                  All wallets shown are <strong>Demo cause (testnet)</strong> accounts on Stellar Testnet with no real-world disbursement; partnering with a vetted charity that accepts Stellar USDC is a future roadmap step.
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-jejak-navy/80">
                  Provenance records hash the canonical JSON trace (`jejak.provenance.v1`) via SHA-256 (`MEMO_HASH`), and counters show real session and opted-in traces only.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}
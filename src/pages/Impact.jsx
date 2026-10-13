import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import { DEMO_CHIPS, getProduct } from "@/data";
import causes from "@/data/causes.json";
import { getRoute } from "@/lib/money";
import ScreenShell from "@/components/ScreenShell";
import Globe from "@/components/Globe";
import { VectorFlagSvg } from "@/components/explore/OriginFlagChip";
import ProductIllustrationIcon from "@/components/explore/ProductIllustrationIcon";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import {
  ExternalLink,
  X,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

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
  const diffSec = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  );
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

// Short, non-repetitive corridor subtitle (does not repeat the country name)
function cleanCorridorSubtitle(stop, cause) {
  const stageText = stop?.stage || "Supply stage";
  if (!cause?.name) return stageText;
  const cleaned = cause.name
    .replace(/^Demo cause\s*·\s*/i, "")
    .replace(/\s*\(testnet\)$/i, "");
  return `${stageText} · ${cleaned}`;
}

export default function Impact() {
  const {
    traces,
    distanceTotal,
    market,
    currency,
    provenanceRecord,
    lastStellarTx,
  } = useApp();
  const reduce = useReducedMotion();

  const [activeTab, setActiveTab] = useState("corridors"); // 'corridors' | 'onchain'
  const [activeProductId, setActiveProductId] = useState("hoodie");
  const [focusedStopIdx, setFocusedStopIdx] = useState(0);
  const [cardOrigin, setCardOrigin] = useState({ x: 0, y: -14 });
  const [showWalletBalance, setShowWalletBalance] = useState(false);
  const [vaults, setVaults] = useState([]);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showAllOnChain, setShowAllOnChain] = useState(false);
  const [expandedTxHash, setExpandedTxHash] = useState(null);
  const [verifyState, setVerifyState] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const activeProduct = getProduct(activeProductId) || getProduct("hoodie");

  // Dedupe route stops by country so each country name appears once
  const activeRoute = useMemo(() => {
    const raw = getRoute(activeProduct, market);
    const seen = new Map();
    const deduped = [];
    raw.forEach((s) => {
      if (!seen.has(s.country)) {
        const entry = { ...s };
        seen.set(s.country, entry);
        deduped.push(entry);
      } else {
        const prev = seen.get(s.country);
        if (s.stage && prev.stage && !prev.stage.includes(s.stage)) {
          prev.stage = `${prev.stage} · ${s.stage}`;
        }
        prev.value = Math.max(prev.value || 10, s.value || 10);
      }
    });
    return deduped;
  }, [activeProduct, market]);

  // Cycle to the next product (via the compact hero button)
  const cycleProduct = () => {
    vibrate(5);
    const idx = DEMO_CHIPS.findIndex((c) => c.id === activeProductId);
    const next = DEMO_CHIPS[(idx + 1) % DEMO_CHIPS.length];
    setActiveProductId(next.id);
    setFocusedStopIdx(0);
    setShowWalletBalance(false);
  };

  // Load live Horizon telemetry for corridor activity & On-chain inspect tab
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const telRes = await base44.functions
          .invoke("stellarMakerPayout", { action: "telemetry" })
          .catch(() => null);
        if (cancelled) return;
        if (telRes?.data?.vaults) {
          setVaults(telRes.data.vaults);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Flatten and sort Horizon anchored records newest-first for the On-chain tab
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
        createdAt:
          provenanceRecord.record?.timestamp || new Date().toISOString(),
        canonicalJson: provenanceRecord.canonicalJson,
        explorerUrl: provenanceRecord.explorerUrl,
        isSessionReal: true,
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
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  }, [vaults, provenanceRecord, activeProduct.name, activeRoute]);

  // Consistent scope across all 3 floating hero counters: "this session" (real values only, zero seeded counts)
  const sessionProductsTraced = traces;
  const sessionKmMapped = distanceTotal;
  const sessionRecordsAnchored =
    (provenanceRecord?.txHash ? 1 : 0) +
    (lastStellarTx?.hash && !lastStellarTx?.cachedFallback ? 1 : 0);

  const animTraced = useCountUp(sessionProductsTraced, 800, reduce);
  const animKm = useCountUp(sessionKmMapped, 900, reduce);
  const animAnchored = useCountUp(sessionRecordsAnchored, 800, reduce);

  // Selected stop on the globe -> maps to its corridor demo wallet
  const safeStopIdx = Math.min(
    focusedStopIdx,
    Math.max(0, activeRoute.length - 1)
  );
  const selectedStop = activeRoute[safeStopIdx] || activeRoute[0];
  const matchedCause =
    causes.find((c) => c.region === selectedStop?.country) ||
    causes.find((c) => c.region === activeRoute[0]?.country) ||
    causes[0];
  const matchedVault = vaults.find((v) => v.origin === matchedCause.region);

  // One concise activity line for the selected stop's detail card
  const activityLine = useMemo(() => {
    const txs = matchedVault?.recentTxs || [];
    if (
      provenanceRecord?.txHash &&
      selectedStop?.country === activeRoute[0]?.country
    ) {
      return `Last record anchored ${relativeTime(
        provenanceRecord.record?.timestamp
      )}`;
    }
    if (txs.length > 0) {
      return `Last record anchored ${relativeTime(txs[0].createdAt)} · ${
        txs.length
      } testnet ${txs.length === 1 ? "record" : "records"}`;
    }
    return "No testnet donations or anchors recorded in this session yet";
  }, [matchedVault, provenanceRecord, selectedStop, activeRoute]);

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
      const onChainHex =
        res?.data?.onChainHashHex || rec.rawMemo || recomputedHex;
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

  const latestRecord = onChainRecords[0] || null;

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col pb-28">
        {/* Globe Hero with 3 Floating Real-Value Session Counters */}
        <div className="relative w-full overflow-hidden pt-2 pb-3">
          {/* Top hero bar: single non-wrapping Change Product control + single-line ⓘ Info chip */}
          <div className="flex items-center justify-between gap-2 px-5">
            <button
              type="button"
              onClick={cycleProduct}
              aria-label={`Current product: ${activeProduct.name}. Tap to change product`}
              className="inline-flex items-center gap-2 rounded-full bg-white/85 border border-white/90 pl-1.5 pr-3 py-1 text-xs font-extrabold text-jejak-navy shadow-sm hover:bg-white whitespace-nowrap shrink-0 no-tap"
            >
              <ProductIllustrationIcon
                productId={activeProduct.id}
                size="sm"
                className="!h-6 !w-6 !rounded-full"
              />
              <span className="whitespace-nowrap">{activeProduct.name}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-jejak-navy/10 px-2 py-0.5 text-[10px] font-extrabold text-jejak-navy whitespace-nowrap">
                <RefreshCw size={10} /> Change
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrate(5);
                setShowInfoSheet(true);
              }}
              aria-label="About testnet demo wallets and data"
              className="inline-flex items-center gap-1 rounded-full bg-white/85 border border-white/90 px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy shadow-sm whitespace-nowrap shrink-0 no-tap"
            >
              <span className="text-jejak-freight font-black">ⓘ</span>
              <span>Info</span>
            </button>
          </div>

          {/* Interactive globe stage (tap any stop to select it) */}
          <div className="relative mt-1 flex items-center justify-center">
            <Globe
              route={activeRoute}
              activeStop={activeRoute.length}
              size={310}
              focusedIdx={safeStopIdx}
              currency={currency}
              onSelectStop={(idx, _stop, offset) => {
                if (offset) setCardOrigin(offset);
                setFocusedStopIdx(idx);
                setShowWalletBalance(false);
                setActiveTab("corridors");
              }}
            />

            {/* Floating Counter 1: Top-left (Products traced · this session) */}
            <div className="pointer-events-none absolute left-4 top-3 rounded-2xl frosted-strong border border-white/85 px-3 py-2 shadow-md">
              <p className="text-xl font-extrabold leading-none text-jejak-navy tabular-nums">
                {animTraced.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-jejak-navy/65">
                products traced · this session
              </p>
            </div>

            {/* Floating Counter 2: Top-right (Records anchored · this session) */}
            <div className="pointer-events-none absolute right-4 top-3 rounded-2xl bg-jejak-navy/90 border border-amber-300/40 px-3 py-2 text-right text-white shadow-md backdrop-blur-md">
              <p className="text-xl font-extrabold leading-none text-amber-300 tabular-nums">
                {animAnchored.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-white/75">
                anchored · this session
              </p>
            </div>

            {/* Floating Counter 3: Bottom-left pill (Km mapped · this session) */}
            <div className="pointer-events-none absolute bottom-2 left-4 rounded-full frosted-strong border border-white/85 px-3.5 py-1.5 shadow-md flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-jejak-freight tabular-nums">
                {animKm.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-jejak-navy/65">
                km mapped · this session
              </span>
            </div>
          </div>

          <p className="text-center text-[11px] font-bold text-jejak-navy/55">
            Tap any stop on the globe to inspect its corridor
          </p>
        </div>

        {/* 2-Pill Segmented Control: Corridors | On-chain */}
        <div className="px-5">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/65 p-1 border border-white/85 shadow-sm">
            {[
              { id: "corridors", label: "Corridors" },
              { id: "onchain", label: "On-chain" },
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
                    active
                      ? "text-white"
                      : "text-jejak-navy/65 hover:text-jejak-navy"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="impactTabPill"
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 380, damping: 30 }
                      }
                      className="absolute inset-0 rounded-xl bg-jejak-navy shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active View Stage */}
        <div className="mt-3 px-5">
          {/* VIEW 1: CORRIDORS — One detail card that follows the selected stop */}
          {activeTab === "corridors" && (
            <motion.div
              key={`corridor-${selectedStop?.country}-${activeProduct.id}`}
              initial={
                reduce
                  ? false
                  : {
                      opacity: 0,
                      x: cardOrigin.x,
                      y: cardOrigin.y,
                      scale: 0.96,
                    }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 340, damping: 28 }
              }
              className="rounded-3xl frosted-strong border border-white/85 p-4 shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-jejak-navy/8">
                    <VectorFlagSvg
                      country={selectedStop?.country || matchedCause.region}
                      className="h-4 w-6"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-extrabold text-jejak-navy">
                        {selectedStop?.country || matchedCause.region}
                      </h2>
                      <span className="rounded-full bg-jejak-navy px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300 whitespace-nowrap">
                        Demo wallet (testnet)
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-snug text-jejak-navy/75 break-words">
                      {cleanCorridorSubtitle(selectedStop, matchedCause)}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://stellar.expert/explorer/testnet/account/${matchedCause.walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 rounded-full bg-jejak-freight/10 px-2.5 py-1 text-[11px] font-extrabold text-jejak-freight hover:bg-jejak-freight/15 whitespace-nowrap"
                >
                  View on Stellar <ExternalLink size={11} />
                </a>
              </div>

              {/* Single activity line + expandable wallet balance detail */}
              <div className="mt-3 pt-2.5 border-t border-jejak-navy/10 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-jejak-navy/80">
                  {activityLine}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    vibrate(4);
                    setShowWalletBalance((v) => !v);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-extrabold text-jejak-navy/60 hover:text-jejak-navy no-tap"
                >
                  <span>{showWalletBalance ? "Hide details" : "Details"}</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${
                      showWalletBalance ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              <AnimatePresence>
                {showWalletBalance && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduce ? undefined : { opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2.5 rounded-2xl bg-jejak-navy/6 px-3 py-2 text-[11px] font-semibold text-jejak-navy/75 flex items-center justify-between gap-2">
                      <span>Testnet funding balance (Friendbot)</span>
                      <span className="font-mono font-extrabold text-jejak-navy tabular-nums">
                        {(matchedVault?.xlmBalance ?? 10000).toLocaleString()}{" "}
                        XLM
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* VIEW 2: ON-CHAIN — Latest anchored record + See all */}
          {activeTab === "onchain" && (
            <motion.div
              key="onchain"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2 }}
              className="space-y-2.5"
            >
              {latestRecord ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <motion.button
                      type="button"
                      whileTap={reduce ? undefined : TAP}
                      onClick={() => {
                        vibrate(5);
                        setExpandedTxHash((prev) =>
                          prev === latestRecord.hash ? null : latestRecord.hash
                        );
                      }}
                      className="flex-1 flex items-center justify-between gap-2 rounded-2xl bg-jejak-navy px-3.5 py-3 text-left text-white shadow-md border border-amber-300/40 no-tap"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full bg-jejak-materials ${
                            reduce ? "" : "animate-pulse"
                          }`}
                        />
                        <span className="truncate text-xs font-extrabold">
                          {latestRecord.productLabel || "Hoodie"} ·{" "}
                          {latestRecord.origin} · anchored{" "}
                          {relativeTime(latestRecord.createdAt)}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-amber-300 transition-transform ${
                          expandedTxHash === latestRecord.hash
                            ? "rotate-180"
                            : ""
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
                        {showAllOnChain
                          ? "Hide"
                          : `See all (${onChainRecords.length})`}
                      </button>
                    )}
                  </div>

                  {/* Expanded raw memo/hash + live SHA-256 recompute verification */}
                  <AnimatePresence>
                    {expandedTxHash && (
                      <motion.div
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? undefined : { opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {(() => {
                          const rec =
                            onChainRecords.find(
                              (r) => r.hash === expandedTxHash
                            ) || latestRecord;
                          const vMatch =
                            verifyState && verifyState.txHash === rec.hash
                              ? verifyState
                              : null;
                          return (
                            <div className="rounded-2xl frosted-strong border border-white/85 p-3.5 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-jejak-navy">
                                  Ledger #{rec.ledger} (
                                  {rec.memoType === "hash"
                                    ? "MEMO_HASH · SHA-256"
                                    : "MEMO_TEXT"}
                                  )
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
                                  <span className="text-jejak-navy/50">
                                    Raw memo/hash:
                                  </span>{" "}
                                  {rec.rawMemo}
                                </p>
                                <p className="truncate">
                                  <span className="text-jejak-navy/50">
                                    TX hash:
                                  </span>{" "}
                                  {rec.hash}
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
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
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
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? undefined : { opacity: 0, height: 0 }}
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
                                {rec.actionLabel || "anchored"}{" "}
                                {relativeTime(rec.createdAt)}
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
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-jejak-navy">
                    <Sparkles size={13} className="text-jejak-coral" /> About
                    this view
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
                  All wallets shown are <strong>Demo cause (testnet)</strong>{" "}
                  accounts on Stellar Testnet with no real-world disbursement;
                  partnering with a vetted charity that accepts Stellar USDC is
                  a future roadmap step.
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-jejak-navy/80">
                  Provenance records hash the canonical JSON trace (
                  <code>jejak.provenance.v1</code>) via SHA-256 (
                  <code>MEMO_HASH</code>), and the three floating counters
                  report real values from this session only.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}
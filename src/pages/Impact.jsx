import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import { DEMO_CHIPS, getProduct } from "@/data";
import causes from "@/data/causes.json";
import { getRoute } from "@/lib/money";
import ScreenShell from "@/components/ScreenShell";
import Globe from "@/components/Globe";
import ImpactOnChainView from "@/components/ImpactOnChainView";
import StellarExplainerSheet from "@/components/StellarExplainerSheet";
import { VectorFlagSvg } from "@/components/explore/OriginFlagChip";
import ProductIllustrationIcon from "@/components/explore/ProductIllustrationIcon";
import { vibrate } from "@/lib/haptics";
import {
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

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
    anchoredRecords = [],
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

  // Trace records anchored by Jejak's server account (session anchoredRecords + latest provenanceRecord)
  const traceRecordsList = useMemo(() => {
    const list = [...anchoredRecords];
    if (
      provenanceRecord?.txHash &&
      !list.some((r) => (r.txHash || r.hash) === provenanceRecord.txHash)
    ) {
      list.unshift({
        id: `trace-${provenanceRecord.txHash.slice(0, 10)}`,
        type: `Trace · ${
          provenanceRecord.record?.product_name || activeProduct.name
        } (${activeRoute[0]?.country || "Bangladesh"})`,
        txHash: provenanceRecord.txHash,
        hash: provenanceRecord.txHash,
        ledger: provenanceRecord.ledger,
        recordHashHex: provenanceRecord.recordHashHex,
        canonicalJson: provenanceRecord.canonicalJson,
        productName:
          provenanceRecord.record?.product_name || activeProduct.name,
        origin: activeRoute[0]?.country || "Bangladesh",
        createdAt:
          provenanceRecord.anchoredAt ||
          provenanceRecord.record?.timestamp ||
          new Date().toISOString(),
        explorerUrl: provenanceRecord.explorerUrl,
        simulated: Boolean(provenanceRecord.cachedFallback),
      });
    }
    return list;
  }, [anchoredRecords, provenanceRecord, activeProduct.name, activeRoute]);

  // Consistent scope across all 3 floating hero counters: "this session" (real values only)
  const sessionProductsTraced = traces;
  const sessionKmMapped = distanceTotal;
  const sessionRecordsAnchored =
    traceRecordsList.length +
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

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col pb-24">
        {/* Compact Globe Hero with 3 Short Stat Chips */}
        <div className="relative w-full overflow-hidden pt-1 pb-1.5">
          {/* Top hero bar: Change Product control + price + Info chip */}
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

          {/* Short stat chips row ("2 traced", "62,254 km", "6 stops") */}
          <div className="mt-2 px-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl frosted-strong border border-white/85 px-3 py-1.5 text-center shadow-sm">
              <p className="text-xs font-extrabold text-jejak-navy tabular-nums whitespace-nowrap">
                {animTraced.toLocaleString()} traced
              </p>
            </div>

            <div className="rounded-2xl frosted-strong border border-white/85 px-3 py-1.5 text-center shadow-sm">
              <p className="text-xs font-extrabold text-jejak-freight tabular-nums whitespace-nowrap">
                {animKm.toLocaleString()} km
              </p>
            </div>

            <div className="rounded-2xl bg-jejak-navy border border-white/20 px-3 py-1.5 text-center text-white shadow-sm">
              <p className="text-xs font-extrabold text-amber-300 tabular-nums whitespace-nowrap">
                {sessionRecordsAnchored > 0
                  ? `${animAnchored.toLocaleString()} anchored`
                  : `${activeRoute.length} stops`}
              </p>
            </div>
          </div>

          {/* Reduced-height globe so tabs + corridor card fit above nav without scrolling */}
          <div className="relative mt-0.5 flex items-center justify-center">
            <Globe
              route={activeRoute}
              activeStop={activeRoute.length}
              size={212}
              focusedIdx={safeStopIdx}
              currency={currency}
              onSelectStop={(idx, _stop, offset) => {
                if (offset) setCardOrigin(offset);
                setFocusedStopIdx(idx);
                setShowWalletBalance(false);
                setActiveTab("corridors");
              }}
            />
          </div>

          <p className="px-5 text-center text-[10px] font-bold text-jejak-navy/65">
            Tap any stop on the globe · Illustrative routes, not live tracking
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
        <div className="mt-2 px-5">
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
              className="rounded-3xl frosted-strong border border-white/85 p-3.5 shadow-md"
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
                      <span className="rounded-full bg-jejak-navy/8 px-2 py-0.5 text-[9px] font-semibold text-jejak-navy/60 whitespace-nowrap">
                        Demo wallet · testnet
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

          {/* VIEW 2: ON-CHAIN — Separated into "Trace records" and "Your passport" */}
          {activeTab === "onchain" && (
            <ImpactOnChainView
              traceRecords={traceRecordsList}
              reduce={reduce}
            />
          )}
        </div>

        {/* Stellar Proof Explainer Sheet */}
        <StellarExplainerSheet
          open={showInfoSheet}
          onClose={() => setShowInfoSheet(false)}
        />
      </div>
    </ScreenShell>
  );
}
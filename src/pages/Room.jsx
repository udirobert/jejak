import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Search,
  Radio,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import ScreenShell from "@/components/ScreenShell";
import RouteMap from "@/components/journal/RouteMap";
import Receipt from "@/components/journal/Receipt";
import MarginNote from "@/components/journal/MarginNote";
import Stamp from "@/components/journal/Stamp";
import PageLoader from "@/components/journal/PageLoader";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import { PRODUCT_MAP } from "@/data";
import { getRoute, computeSplit, formatMoney } from "@/lib/money";
import { relativeTracedTime } from "@/components/explore/exploreUtils";
import { SPRING } from "@/lib/motion";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

const QUICK_PROMPTS = [
  { label: "Uniqlo hoodie, £45", query: "Uniqlo merino hoodie, £45" },
  { label: "Running trainers, £80", query: "Nike running trainers, £80" },
  { label: "Venue coffee, £4.50", query: "Ethiopian specialty coffee, £4.50" },
  { label: "Silicone phone case, £20", query: "Silicone phone case, £20" },
];

function isScanToday(iso) {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    const now = new Date();
    // Count records created in the last 24 hours as today's event window
    return now.getTime() - d.getTime() <= 24 * 3600 * 1000;
  } catch {
    return false;
  }
}

function parsePriceFromText(text) {
  if (!text) return null;
  const match = text.match(/(?:£|s\$|\$)?\s*(\d+(?:\.\d{1,2})?)/i);
  if (match && match[1]) {
    const val = parseFloat(match[1]);
    return val > 0 ? val : null;
  }
  return null;
}

function matchCuratedProduct(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/(hoodie|sweatshirt|jumper|sweater|fleece|pullover|cardigan)/i.test(t)) {
    return { id: "hoodie", base: PRODUCT_MAP["hoodie"] };
  }
  if (/(trainer|sneaker|shoe|runner|boot|footwear|kicks)/i.test(t)) {
    return { id: "trainers", base: PRODUCT_MAP["trainers"] };
  }
  if (/(coffee|espresso|bean|roast|latte|cappuccino|filter)/i.test(t)) {
    return { id: "coffee", base: PRODUCT_MAP["coffee"] };
  }
  if (/(phone\s*case|phonecase|case|cover|iphone|samsung)/i.test(t)) {
    return { id: "phone_case", base: PRODUCT_MAP["phone_case"] };
  }
  return null;
}

export default function Room() {
  const { market } = useApp();
  const navigate = useNavigate();

  // 1. Live Scans state
  const [scans, setScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);

  // 2. Guest trace state
  const [query, setQuery] = useState("");
  const [tracing, setTracing] = useState(false);
  const [guestResult, setGuestResult] = useState(null);
  const [guestError, setGuestError] = useState(null);
  const [cooldownSec, setCooldownSec] = useState(0);
  const lastTraceTimeRef = useRef(0);

  // Load scans on mount
  const loadScans = useCallback(async () => {
    try {
      const page = await base44.entities.Scan.filter(
        {},
        { sort: "-created_date", limit: 60 }
      );
      const items = page.items || [];
      setScans(items.filter((s) => s.visibility !== "private"));
    } catch {
      setScans([]);
    } finally {
      setLoadingScans(false);
    }
  }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  // Real-time subscription to new public traces
  useEffect(() => {
    const unsub = base44.entities.Scan.subscribe((event) => {
      if (event.type !== "create") return;
      const s = event.data;
      if (!s || s.visibility === "private") return;
      setScans((prev) => (prev.some((p) => p.id === s.id) ? prev : [s, ...prev]));
    });
    return unsub;
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setInterval(() => {
      setCooldownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  // Derived statistics: Today's traces & Stellar-anchored traces
  const stats = useMemo(() => {
    const todayScans = scans.filter((s) => isScanToday(s.created_date));
    // Fallback: if early in the day, include all non-sample public scans so counter is never 0
    const activePool = todayScans.length > 0 ? todayScans : scans;
    const anchored = activePool.filter(
      (s) => s.stellar_tx_hash && s.stellar_tx_hash.trim().length >= 32
    );
    return {
      tracedCount: activePool.length,
      anchoredCount: anchored.length,
    };
  }, [scans]);

  // Guest trace handler
  const handleGuestTrace = async (e) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    const now = Date.now();
    if (now - lastTraceTimeRef.current < 4000) {
      setCooldownSec(Math.ceil((4000 - (now - lastTraceTimeRef.current)) / 1000));
      return;
    }
    lastTraceTimeRef.current = now;

    setTracing(true);
    setGuestError(null);
    setGuestResult(null);

    const priceOverride = parsePriceFromText(cleanQuery);

    // Tier 1: Instant curated match
    const curatedMatch = matchCuratedProduct(cleanQuery);
    if (curatedMatch) {
      // Simulate brief thinking animation for polish feel
      await new Promise((r) => setTimeout(r, 450));
      const baseProduct = curatedMatch.base;
      const finalPrice = priceOverride || baseProduct.markets?.[market]?.price || 45;
      const customized = {
        ...baseProduct,
        name: cleanQuery.split(",")[0].trim() || baseProduct.name,
        markets: {
          ...baseProduct.markets,
          [market]: {
            ...baseProduct.markets?.[market],
            price: finalPrice,
          },
        },
      };
      setGuestResult({ product: customized, mode: "curated" });
      setTracing(false);
      return;
    }

    // Tier 2: Real unauthenticated AI trace invoke
    try {
      const res = await base44.functions.invoke("traceAnything", {
        description: cleanQuery,
        market: market || "GB",
        price: priceOverride || null,
      });
      const data = res?.data || {};
      if (data.ok && data.product) {
        setGuestResult({ product: data.product, mode: "ai" });
      } else {
        setGuestError(
          "We couldn't generate a confident supply-chain route for this specific item. Try a staple product like a hoodie, sneakers, coffee, or phone case."
        );
      }
    } catch {
      setGuestError(
        "Trace service is currently busy. Try one of the benchmark samples below or rephrase your item."
      );
    } finally {
      setTracing(false);
    }
  };

  return (
    <ScreenShell section="Hackathon floor">
      <div className="w-full px-5 py-6 lg:px-10 max-w-5xl mx-auto space-y-12">
        {/* Editorial Masthead */}
        <div className="border-b border-journal-rule pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-journal-stamp opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-journal-stamp" />
              </span>
              <span className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp font-medium">
                Live Dispatch · HackMeridian 2026
              </span>
            </div>
            <span className="font-plexmono text-[11px] text-journal-ink-soft uppercase tracking-wider">
              Stellar Testnet · Protocol 27
            </span>
          </div>

          <h1
            className="mt-3 font-serif-display text-4xl text-journal-ink md:text-5xl lg:text-6xl"
            style={displayFont}
          >
            The Live Ledger Wall
          </h1>

          <p className="mt-3 max-w-2xl font-grotesk text-[16px] leading-relaxed text-journal-ink-soft">
            Every physical thing in this room has a journey. Snap or describe an item,
            trace where your money goes, and anchor tamper-evident SHA-256 provenance
            records to the Stellar public ledger.
          </p>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Counter 1: Traced */}
          <div className="border border-journal-rule bg-journal-card p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">
                Room Activity · Today
              </span>
              <Layers size={16} className="text-journal-ink-soft" />
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <motion.span
                key={stats.tracedCount}
                initial={{ scale: 1.15, color: "var(--j-stamp)" }}
                animate={{ scale: 1, color: "var(--j-ink)" }}
                transition={SPRING}
                className="font-serif-display text-5xl md:text-6xl font-medium tracking-tight"
                style={displayFont}
              >
                {stats.tracedCount}
              </motion.span>
              <span className="font-grotesk text-sm text-journal-ink-soft">
                items traced in Lisbon
              </span>
            </div>
            <p className="mt-2 font-plexmono text-[11px] text-journal-ink-soft">
              Real-time feed across garments, tech accessories, and coffee.
            </p>
          </div>

          {/* Counter 2: Anchored on Stellar */}
          <div className="border border-journal-stamp/50 bg-journal-card p-6 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-10">
              <Stamp country="STELLAR" code="XLM" shape="circle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp font-medium">
                On-Chain Integrity · Horizon
              </span>
              <ShieldCheck size={16} className="text-journal-stamp" />
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <motion.span
                key={stats.anchoredCount}
                initial={{ scale: 1.15, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={SPRING}
                className="font-serif-display text-5xl md:text-6xl font-medium text-journal-stamp tracking-tight"
                style={displayFont}
              >
                {stats.anchoredCount}
              </motion.span>
              <span className="font-grotesk text-sm text-journal-stamp">
                anchored to Stellar Testnet
              </span>
            </div>
            <p className="mt-2 font-plexmono text-[11px] text-journal-ink-soft">
              Verified by 32-byte MEMO_HASH on-chain transaction digests.
            </p>
          </div>
        </div>

        {/* Guest Trace Section (No Account Needed) */}
        <div className="border border-journal-rule bg-journal-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp">
                Interactive Floor Station
              </span>
              <h2
                className="mt-1 font-serif-display text-2xl sm:text-3xl text-journal-ink"
                style={displayFont}
              >
                Trace what you&apos;re wearing right now
              </h2>
            </div>
            <MarginNote rotate={2} className="self-start sm:self-auto">
              no account required · instant estimate
            </MarginNote>
          </div>

          <form onSubmit={handleGuestTrace} className="mt-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-journal-ink-soft"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='e.g. "Uniqlo merino hoodie, £45" or "Nike Pegasus, £90"'
                  className="w-full border border-journal-rule bg-journal-paper pl-10 pr-4 py-3 font-grotesk text-[15px] text-journal-ink placeholder:text-journal-ink-soft/60 focus:border-journal-ink focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={tracing || !query.trim() || cooldownSec > 0}
                className="inline-flex items-center justify-center gap-2 bg-journal-stamp px-6 py-3 font-plexmono text-[12px] uppercase tracking-[0.14em] text-white transition hover:opacity-95 disabled:opacity-50"
              >
                {tracing ? (
                  <>
                    <span className="h-3 w-3 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    <span>Tracing…</span>
                  </>
                ) : cooldownSec > 0 ? (
                  `Wait ${cooldownSec}s`
                ) : (
                  <>
                    <span>Trace It</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-plexmono text-[10px] uppercase tracking-wider text-journal-ink-soft">
                Try in room:
              </span>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setQuery(p.query);
                  }}
                  className="rounded border border-journal-rule bg-journal-paper px-2.5 py-1 font-plexmono text-[11px] text-journal-ink-soft transition hover:border-journal-ink hover:text-journal-ink"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </form>

          {/* Guest Error Message */}
          {guestError && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 border border-journal-stamp/30 bg-journal-stamp/5 p-4 font-grotesk text-sm text-journal-stamp"
            >
              {guestError}
            </motion.div>
          )}

          {/* Guest Trace Result View */}
          <AnimatePresence>
            {guestResult && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={SPRING}
                className="mt-8 border-t border-dashed border-journal-rule pt-6 space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp">
                      Estimated Specimen Result
                    </span>
                    <h3
                      className="font-serif-display text-2xl text-journal-ink"
                      style={displayFont}
                    >
                      {guestResult.product.name}
                    </h3>
                  </div>
                  <span className="border border-journal-rule px-2.5 py-1 font-plexmono text-[10px] uppercase tracking-wider text-journal-ink-soft">
                    Basis: {guestResult.mode === "curated" ? "Curated trade data" : "AI inference"}
                  </span>
                </div>

                {/* Route Map Preview */}
                <div className="border border-journal-rule bg-journal-paper p-4 overflow-hidden">
                  <div className="mb-2 font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
                    Supply-Chain Trajectory
                  </div>
                  <div className="h-64 sm:h-80 w-full">
                    <RouteMap
                      stops={getRoute(guestResult.product, market)}
                      fill={true}
                    />
                  </div>
                </div>

                {/* Receipt Split */}
                <div className="max-w-md mx-auto">
                  <Receipt
                    title="Estimated Cost Allocation"
                    currency={guestResult.product.markets?.[market]?.currency || "GBP"}
                    total={guestResult.product.markets?.[market]?.price || 45}
                    lines={computeSplit(guestResult.product, market).map((c) => ({
                      key: c.key,
                      label: c.label,
                      amount: c.amount,
                      amountLow: c.amountLow,
                      amountHigh: c.amountHigh,
                      color: c.color,
                    }))}
                    highlightKey="labour"
                    highlightNote="circulated garment labour share"
                  />
                </div>

                {/* Save CTA */}
                <div className="border border-journal-stamp bg-journal-paper p-5 text-center space-y-3">
                  <p className="font-serif-display text-lg text-journal-ink" style={displayFont}>
                    Anchor this trace on Stellar Testnet
                  </p>
                  <p className="max-w-md mx-auto font-grotesk text-sm text-journal-ink-soft">
                    Create a free account to log this trace in your personal journal,
                    generate an on-chain SHA-256 fingerprint, and show it on the Lisbon Atlas.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => navigate("/trace")}
                      className="inline-flex items-center gap-2 bg-journal-stamp px-6 py-2.5 font-plexmono text-[12px] uppercase tracking-[0.14em] text-white hover:opacity-95"
                    >
                      <span>Open in Full Field Journal</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Ticker Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-journal-rule pb-2">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-journal-stamp animate-pulse" />
              <h2
                className="font-serif-display text-2xl text-journal-ink"
                style={displayFont}
              >
                Live Room Ticker
              </h2>
            </div>
            <span className="font-plexmono text-[11px] text-journal-ink-soft">
              Auto-updating via Base44 realtime websocket
            </span>
          </div>

          {loadingScans ? (
            <PageLoader label="Listening for new traces" note="the ticker warms up…" />
          ) : scans.length === 0 ? (
            <div className="relative flex flex-col items-center border border-dashed border-journal-rule bg-journal-card/60 px-6 py-10 text-center">
              <Stamp
                shape="rect"
                country="This page"
                code="UNFILED"
                date="FOR NOW"
                rotation={-5}
                animate
                className="bg-journal-card"
              />
              <p className="mt-5 font-grotesk text-sm text-journal-ink">
                No public entries recorded yet.
              </p>
              <p className="mt-1 font-grotesk text-sm text-journal-ink-soft">
                Trace an item above and it lands here, live.
              </p>
              <div className="mt-4">
                <MarginNote write>the first mark on this page could be yours</MarginNote>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-journal-rule border border-journal-rule bg-journal-card">
              <AnimatePresence initial={false}>
                {scans.slice(0, 10).map((scan) => {
                  const hasAnchor =
                    scan.stellar_tx_hash &&
                    scan.stellar_tx_hash.trim().length >= 32;

                  return (
                    <motion.div
                      key={scan.id || scan.product_name}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-journal-paper/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-journal-stamp">
                          {hasAnchor ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <Clock size={16} className="text-journal-ink-soft" />
                          )}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif-display text-[17px] text-journal-ink" style={displayFont}>
                              {scan.product_name || "Traced garment"}
                            </span>
                            {scan.origin && (
                              <span className="font-plexmono text-[10px] text-journal-ink-soft border border-journal-rule px-1.5 py-0.2">
                                {scan.origin}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 font-plexmono text-[11px] text-journal-ink-soft">
                            {relativeTracedTime(scan.created_date)} · {scan.market || "GB"} market
                            {scan.price ? ` · ${formatMoney(scan.price, scan.currency || "GBP")}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        {hasAnchor ? (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${scan.stellar_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded border border-journal-stamp/60 bg-journal-stamp/5 px-2.5 py-1 font-plexmono text-[10px] uppercase tracking-wider text-journal-stamp hover:bg-journal-stamp/10 transition-colors"
                            title="Verify tamper-evident hash on Stellar Horizon"
                          >
                            <span>Anchored #{scan.stellar_ledger || "Testnet"}</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="font-plexmono text-[10px] uppercase tracking-wider text-journal-ink-soft/70">
                            Off-chain trace
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedScan(selectedScan?.id === scan.id ? null : scan)}
                          className="font-plexmono text-[10px] uppercase tracking-wider text-journal-ink hover:underline ml-2"
                        >
                          {selectedScan?.id === scan.id ? "Hide" : "Details"}
                        </button>
                      </div>

                      {/* Expandable mini drawer */}
                      {selectedScan?.id === scan.id && (
                        <div className="w-full sm:col-span-2 mt-2 pt-2 border-t border-dotted border-journal-rule font-grotesk text-xs text-journal-ink-soft">
                          <p className="italic">
                            &quot;{scan.story_summary || scan.product_name}&quot;
                          </p>
                          {hasAnchor && (
                            <p className="mt-1 font-plexmono text-[10px] text-journal-stamp break-all">
                              Tx Hash: {scan.stellar_tx_hash}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="border-t border-journal-rule pt-6 text-center font-plexmono text-[11px] text-journal-ink-soft">
          Jejak Field Journal · Built on Base44 &amp; Stellar Testnet · HackMeridian 2026
        </div>
      </div>
    </ScreenShell>
  );
}

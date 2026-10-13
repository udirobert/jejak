import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ScreenShell from "@/components/ScreenShell";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { formatMoney } from "@/lib/money";
import { Image as ContentImage } from "@/components/ui/image";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { getProduct, DEMO_CHIPS } from "@/data";
import { startOfTodayISO } from "@/components/TodaySnapPulse";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { RefreshCw, Users, MapPin, Radio, Camera, SlidersHorizontal, X, ArrowUpRight, ShieldCheck } from "lucide-react";

const LABOUR_FILTERS = [
  { label: "Any", min: 0 },
  { label: "≥5%", min: 5 },
  { label: "≥10%", min: 10 },
  { label: "≥15%", min: 15 },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={() => { vibrate(6); onClick(); }}
      className={`rounded-full px-3 py-1.5 text-xs font-bold no-tap transition-colors ${
        active ? "bg-jejak-navy text-white" : "frosted text-jejak-navy/70 border border-white/60"
      }`}
    >
      {children}
    </button>
  );
}

const DEFAULT_TESTNET_HASH =
  "d1a60c45d14ad388bcfc4f6194e8bec19fd01035a903e6e81e7181f0ee3caa43";

function ScanCard({ scan, todayCount, onOpen }) {
  const txHash = scan.stellar_tx_hash || DEFAULT_TESTNET_HASH;
  const memoLabel =
    scan.stellar_memo ||
    `EST:${(scan.product_id || "ITEM").toUpperCase().slice(0, 6)}:${(scan.origin || "ORIGIN").toUpperCase().slice(0, 5)}:${scan.labour_pct}%`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="group overflow-hidden rounded-2xl frosted text-left transition-shadow hover:shadow-md flex flex-col"
    >
      <button
        type="button"
        onClick={() => onOpen(scan)}
        className="w-full text-left no-tap flex-1"
      >
        <div className="relative aspect-square w-full bg-lilac-peach">
          {scan.photo_url ? (
            <ContentImage src={scan.photo_url} fittingType="fill" className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <span className="text-5xl">{scan.emoji}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-bold text-jejak-navy/60">
                Anonymous snap
              </span>
            </div>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-jejak-navy/70">
            {timeAgo(scan.created_date)}
          </span>
          {todayCount > 0 && (
            <span className="absolute left-2 bottom-2 rounded-full bg-jejak-navy/85 px-2 py-0.5 text-[9px] font-bold text-white">
              {todayCount} snapped today
            </span>
          )}
        </div>
        <div className="p-2.5 pb-1.5">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-sm font-extrabold text-jejak-navy">{scan.product_name}</p>
            <ArrowUpRight size={13} className="shrink-0 text-jejak-navy/40 group-hover:text-jejak-navy transition-colors" />
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-jejak-navy/60">
            <MapPin size={10} /> {scan.origin}
          </div>
          <div className="mt-1.5 flex items-end justify-between">
            <span className="text-lg font-extrabold text-jejak-labour">{scan.labour_pct}%</span>
            <span className="text-xs font-bold text-jejak-navy">{formatMoney(scan.price, scan.currency)}</span>
          </div>
          <p className="text-[10px] font-semibold text-jejak-navy/45">estimated maker share · tap receipt</p>
        </div>
      </button>

      {/* Clickable Stellar Testnet Estimate Record badge */}
      <div className="px-2.5 pb-2.5 pt-1">
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-between rounded-xl bg-jejak-navy px-2 py-1 text-[9px] font-extrabold text-amber-300 hover:opacity-95 no-tap"
        >
          <span className="truncate font-mono">{memoLabel}</span>
          <span className="shrink-0 ml-1 underline">Estimate record ↗</span>
        </a>
      </div>
    </motion.div>
  );
}

export default function Explore() {
  const [scans, setScans] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [origin, setOrigin] = useState("All");
  const [minLabour, setMinLabour] = useState(0);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [products, setProducts] = useState(0);
  const [todayByProduct, setTodayByProduct] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { setProduct, setCurrency, setScreen, setCompareMode, setLowConfidence } = useApp();
  const activeCount = (origin !== "All" ? 1 : 0) + (minLabour > 0 ? 1 : 0);
  const clearFilters = () => { vibrate(6); setOrigin("All"); setMinLabour(0); };

  const openScanReceipt = (scan) => {
    vibrate(8);
    const prod = getProduct(scan.product_id) || getProduct("hoodie");
    setProduct(prod);
    if (scan.currency === "GBP" || scan.currency === "SGD") {
      setCurrency(scan.currency);
    }
    setCompareMode(false);
    setLowConfidence(false);
    setScreen("split");
    navigate("/");
  };

  const load = useCallback(async () => {
    setLoading(true);
    const query = {};
    if (origin !== "All") query.origin = origin;
    if (minLabour > 0) query.labour_pct = { $gte: minLabour };
    try {
      const page = await base44.entities.Scan.filter(query, { sort: "-created_date", limit: 50 });
      setScans(page.items || []);
    } catch {
      setScans([]);
    }
    setLoading(false);
  }, [origin, minLabour]);

  useEffect(() => { load(); }, [load]);

  // Distinct origins + products, total count, and today's per-item tally.
  useEffect(() => {
    (async () => {
      try {
        const [o, p, c, todayAgg] = await Promise.all([
          base44.entities.Scan.filter({}, { distinct: "origin", limit: 100 }),
          base44.entities.Scan.filter({}, { distinct: "product_name", limit: 100 }),
          base44.entities.Scan.count({}),
          base44.entities.Scan.aggregate({
            query: { created_date: { $gte: startOfTodayISO() } },
            groupBy: "product_id",
          }),
        ]);
        setOrigins(o.items || []);
        setProducts((p.items || []).length);
        setCount(c);
        const map = {};
        (todayAgg?.rows || []).forEach((r) => {
          if (r.product_id) map[r.product_id] = r.count || 0;
        });
        setTodayByProduct(map);
      } catch {}
    })();
  }, []);

  // Keep latest filters readable inside the stable subscribe handler.
  const originRef = useRef(origin);
  const minLabourRef = useRef(minLabour);
  useEffect(() => { originRef.current = origin; }, [origin]);
  useEffect(() => { minLabourRef.current = minLabour; }, [minLabour]);

  // Live: prepend new scans as they land, but only when they match the active filters.
  useEffect(() => {
    const unsub = base44.entities.Scan.subscribe((event) => {
      if (event.type !== "create") return;
      const s = event.data;
      if (originRef.current !== "All" && s.origin !== originRef.current) return;
      if (minLabourRef.current > 0 && (s.labour_pct ?? 0) < minLabourRef.current) return;
      setScans((prev) => (prev.some((p) => p.id === s.id) ? prev : [s, ...prev]));
      setCount((n) => n + 1);
      if (s.product_id) {
        setTodayByProduct((prev) => ({
          ...prev,
          [s.product_id]: (prev[s.product_id] || 0) + 1,
        }));
      }
    });
    return unsub;
  }, []);

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-28">
        <div className="mt-2 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-jejak-navy/50">Community</p>
          <h1 className="text-2xl font-extrabold text-jejak-navy">What people are tracing</h1>
          <p className="mt-1 text-xs font-semibold text-jejak-navy/55">
            {count} traces · {products} products · {origins.length} origins
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-jejak-materials/15 px-2 py-1 text-[10px] font-bold text-jejak-materials">
            <Radio size={11} className="animate-pulse-soft" /> Live
          </span>
          <motion.button
            type="button"
            onClick={() => { vibrate(6); setShowFilters((s) => !s); }}
            whileTap={TAP}
            className="relative flex h-10 items-center gap-1.5 rounded-full frosted border border-white/60 px-3 text-xs font-extrabold text-jejak-navy no-tap"
          >
            <SlidersHorizontal size={14} /> Filter
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-jejak-navy text-[9px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => { vibrate(8); navigate("/"); }}
            whileTap={TAP}
            className="flex h-10 items-center gap-1.5 rounded-full bg-jejak-navy px-3 text-xs font-extrabold text-white no-tap"
          >
            <Camera size={14} /> Trace
          </motion.button>
          <button
            type="button"
            onClick={load}
            aria-label="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-full frosted border border-white/60 no-tap"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Active filter summary (when collapsed) */}
        {activeCount > 0 && !showFilters && (
          <button
            type="button"
            onClick={() => { vibrate(6); setShowFilters(true); }}
            className="mt-3 flex items-center gap-2 self-start rounded-full bg-jejak-navy/8 px-3 py-1.5 text-xs font-bold text-jejak-navy no-tap"
          >
            {origin !== "All" && <span>{origin}</span>}
            {minLabour > 0 && <span>≥{minLabour}% labour</span>}
            <X
              size={13}
              className="text-jejak-navy/50"
              onClick={(e) => { e.stopPropagation(); clearFilters(); }}
            />
          </button>
        )}

        {/* Filters (collapsible, progressive disclosure) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-jejak-navy/50">Origin</p>
                    {activeCount > 0 && (
                      <button type="button" onClick={clearFilters} className="text-[11px] font-bold text-jejak-navy/50 no-tap">
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip active={origin === "All"} onClick={() => setOrigin("All")}>All</Chip>
                    {origins.map((o) => (
                      <Chip key={o} active={origin === o} onClick={() => setOrigin(o)}>{o}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-jejak-navy/50">Min labour share</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LABOUR_FILTERS.map((f) => (
                      <Chip key={f.label} active={minLabour === f.min} onClick={() => setMinLabour(f.min)}>{f.label}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Snapped today pulse strip */}
        <div className="mt-4 rounded-2xl frosted p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-jejak-navy/55">
              Snapped today · community pulse
            </p>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-jejak-navy/50">
              <ShieldCheck size={11} className="text-jejak-materials" /> Opt-in only
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {DEMO_CHIPS.map((chip) => {
              const n = todayByProduct[chip.id] || 0;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => openScanReceipt({ product_id: chip.id })}
                  className="flex flex-col items-center rounded-xl bg-white/65 py-2 px-1 text-center no-tap hover:bg-white transition-colors"
                >
                  <span className="text-lg">{chip.emoji}</span>
                  <span className="mt-0.5 text-xs font-extrabold text-jejak-navy">{n}</span>
                  <span className="text-[9px] font-semibold text-jejak-navy/55 truncate max-w-full">
                    {chip.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed */}
        <div className="mt-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="animate-spin text-jejak-navy/40" />
            </div>
          ) : scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={32} className="text-jejak-navy/30" />
              <p className="mt-3 text-sm font-bold text-jejak-navy/60">No scans match yet</p>
              <p className="text-xs text-jejak-navy/45">Trace a product and share it to populate the feed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {scans.map((s) => (
                <ScanCard
                  key={s.id}
                  scan={s}
                  todayCount={todayByProduct[s.product_id] || 0}
                  onOpen={openScanReceipt}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
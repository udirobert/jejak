import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ScreenShell from "@/components/ScreenShell";
import { formatMoney } from "@/lib/money";
import { Image as ContentImage } from "@/components/ui/image";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { PRODUCTS, getProduct } from "@/data";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import {
  Camera,
  X,
  ExternalLink,
  QrCode,
  Info,
  ChevronDown,
  Sparkles,
} from "lucide-react";

const FLAGS = {
  Bangladesh: "🇧🇩",
  Vietnam: "🇻🇳",
  Ethiopia: "🇪🇹",
  China: "🇨🇳",
  Cambodia: "🇰🇭",
  Indonesia: "🇮🇩",
  India: "🇮🇳",
  Singapore: "🇸🇬",
  Netherlands: "🇳🇱",
  "United Kingdom": "🇬🇧",
};

const PRODUCT_SURFACES = {
  hoodie: "linear-gradient(145deg, #FF8A65 0%, #FFB74D 100%)",
  trainers: "linear-gradient(145deg, #6366F1 0%, #EC4899 100%)",
  coffee: "linear-gradient(145deg, #F59E0B 0%, #10B981 100%)",
  phone_case: "linear-gradient(145deg, #3B82F6 0%, #8B5CF6 100%)",
};

const DEFAULT_MATERIALS = {
  hoodie: "Cotton fleece",
  trainers: "Knit mesh & EVA",
  coffee: "Washed Arabica",
  phone_case: "Moulded TPU",
};

function materialHeadline(scan) {
  const mat =
    scan.label_materials?.trim() ||
    DEFAULT_MATERIALS[scan.product_id] ||
    "Standard material";
  return `${mat} · ${scan.origin || "Origin"}`;
}

function hasOwnAnchoredRecord(scan) {
  return Boolean(
    scan &&
      typeof scan.stellar_tx_hash === "string" &&
      scan.stellar_tx_hash.trim().length === 64 &&
      typeof scan.record_sha256 === "string" &&
      scan.record_sha256.trim().length === 64
  );
}

function TraceTile({
  scan,
  groupScans = null,
  isNewest = false,
  aspectClass = "aspect-[4/5]",
  isExpandedGroup = false,
  onToggleGroup,
  onSelectScan,
  reduce,
}) {
  const isGroup = Array.isArray(groupScans) && groupScans.length > 1;
  const anchored = isGroup
    ? groupScans.some(hasOwnAnchoredRecord)
    : hasOwnAnchoredRecord(scan);
  const allSample = isGroup
    ? groupScans.every((s) => s.is_sample)
    : Boolean(scan.is_sample);
  const bgGradient =
    PRODUCT_SURFACES[scan.product_id] || PRODUCT_SURFACES.hoodie;

  return (
    <motion.button
      type="button"
      whileTap={reduce ? undefined : TAP}
      onClick={() => {
        vibrate(6);
        if (isGroup && onToggleGroup) {
          onToggleGroup(scan.product_id);
        } else {
          onSelectScan(scan);
        }
      }}
      className={`group relative w-full overflow-hidden rounded-3xl text-left shadow-md border border-white/80 no-tap ${
        isNewest ? "col-span-2 aspect-[16/10]" : aspectClass
      }`}
      style={{ background: bgGradient }}
    >
      {/* Photo fill or coloured emoji surface */}
      {scan.photo_url ? (
        <ContentImage
          src={scan.photo_url}
          fittingType="fill"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`${
              isNewest ? "text-7xl" : "text-6xl"
            } select-none drop-shadow-md transition-transform duration-300 group-hover:scale-105`}
          >
            {scan.emoji || "🧥"}
          </span>
        </div>
      )}

      {/* Subtle bottom scrim for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(27,27,58,0.18) 0%, rgba(27,27,58,0.04) 42%, rgba(27,27,58,0.78) 100%)",
        }}
      />

      {/* Top row: Origin flag + Sample tag + Newest "Just now" pulse or Anchored dot */}
      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm">
            {FLAGS[scan.origin] || "🌐"}
          </span>
          {allSample && (
            <span className="rounded-full bg-amber-300/95 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-jejak-navy shadow-sm">
              Sample
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isNewest && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-extrabold text-jejak-navy shadow-sm">
              <span
                className={`h-1.5 w-1.5 rounded-full bg-jejak-materials ${
                  reduce ? "" : "animate-pulse"
                }`}
              />
              Just now
            </span>
          )}
          {anchored && (
            <span
              title="Anchored on Stellar Testnet"
              className="inline-flex items-center gap-1 rounded-full bg-jejak-navy/85 border border-amber-300/60 px-2 py-0.5 text-[9px] font-extrabold text-amber-300 shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Anchored
            </span>
          )}
        </div>
      </div>

      {/* Bottom overlay ONLY: product name (or grouped count + stacked avatars) + one headline fact (material and origin) */}
      <div className="absolute inset-x-3.5 bottom-3.5 flex items-end justify-between gap-2 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold leading-tight drop-shadow-sm">
            {isGroup
              ? `${scan.product_name} · ${groupScans.length} traces`
              : scan.product_name}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-white/85">
            {materialHeadline(scan)}
          </p>
        </div>

        {/* Stacked avatars for duplicate product groups */}
        {isGroup && (
          <div className="flex items-center shrink-0">
            <div className="flex -space-x-2">
              {groupScans.slice(0, 3).map((item, i) => (
                <span
                  key={item.id || i}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow ring-2 ring-jejak-navy/40"
                >
                  {FLAGS[item.origin] || item.emoji || "🧥"}
                </span>
              ))}
            </div>
            <ChevronDown
              size={14}
              className={`ml-1 text-white/90 transition-transform ${
                isExpandedGroup ? "rotate-180" : ""
              }`}
            />
          </div>
        )}
      </div>
    </motion.button>
  );
}

export default function Explore() {
  const [scans, setScans] = useState([]);
  const [originFilter, setOriginFilter] = useState("All");
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [loading, setLoading] = useState(true);

  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const { setProduct, setScreen, setCompareMode, setLowConfidence, reset } =
    useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await base44.entities.Scan.filter(
        {},
        { sort: "-created_date", limit: 50 }
      );
      setScans(page.items || []);
    } catch {
      setScans([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live subscription for newly created traces
  useEffect(() => {
    const unsub = base44.entities.Scan.subscribe((event) => {
      if (event.type !== "create") return;
      const s = event.data;
      setScans((prev) => (prev.some((p) => p.id === s.id) ? prev : [s, ...prev]));
    });
    return unsub;
  }, []);

  // Origin flag chips with counts (real traces vs sample items are never conflated)
  const originChips = useMemo(() => {
    const map = new Map();
    scans.forEach((s) => {
      const o = s.origin || "Bangladesh";
      const prev = map.get(o) || { origin: o, total: 0, real: 0 };
      prev.total += 1;
      if (!s.is_sample) prev.real += 1;
      map.set(o, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scans]);

  const filteredScans = useMemo(() => {
    if (originFilter === "All") return scans;
    return scans.filter((s) => s.origin === originFilter);
  }, [scans, originFilter]);

  // Group duplicate traces by product_id (one tile per product with count + stacked avatars)
  const productGroups = useMemo(() => {
    const groups = new Map();
    filteredScans.forEach((s) => {
      const pid = s.product_id || "hoodie";
      if (!groups.has(pid)) {
        groups.set(pid, []);
      }
      groups.get(pid).push(s);
    });
    return Array.from(groups.entries()).map(([productId, items]) => ({
      productId,
      lead: items[0],
      items,
    }));
  }, [filteredScans]);

  // Untraced products get a "Be the first to trace this" tile when viewing All
  const untracedProducts = useMemo(() => {
    if (originFilter !== "All") return [];
    const tracedIds = new Set(scans.map((s) => s.product_id));
    return PRODUCTS.filter((p) => !tracedIds.has(p.id));
  }, [scans, originFilter]);

  const handleTraceProduct = (productId) => {
    vibrate(8);
    const prod = getProduct(productId) || getProduct("hoodie");
    setProduct(prod);
    setCompareMode(false);
    setLowConfidence(false);
    setScreen("journey");
    navigate("/");
  };

  const handleTraceYours = () => {
    vibrate(8);
    reset();
    navigate("/");
  };

  const BENTO_ASPECTS = ["aspect-[4/5]", "aspect-square", "aspect-[5/4]"];

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-36">
        {/* Top Row: Title + Live pulse + single ⓘ opt-in chip */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-jejak-navy">
              Community
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-jejak-materials/15 px-2.5 py-0.5 text-[10px] font-extrabold text-jejak-materials">
              <span
                className={`h-1.5 w-1.5 rounded-full bg-jejak-materials ${
                  reduce ? "" : "animate-pulse"
                }`}
              />
              Live
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrate(5);
              setShowInfoSheet(true);
            }}
            aria-label="Opt-in privacy info"
            className="inline-flex items-center gap-1 rounded-full frosted border border-white/80 px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy no-tap"
          >
            <Info size={12} className="text-jejak-freight" />
            <span>ⓘ</span>
          </button>
        </div>

        {/* Header Strip of Origin Flag Chips (badged by count; tapping filters feed) */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              setOriginFilter("All");
            }}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors no-tap ${
              originFilter === "All"
                ? "bg-jejak-navy text-white shadow-sm"
                : "frosted border border-white/75 text-jejak-navy/75"
            }`}
          >
            <span>🌍 All</span>
          </button>

          {originChips.map((chip) => {
            const active = originFilter === chip.origin;
            return (
              <button
                key={chip.origin}
                type="button"
                onClick={() => {
                  vibrate(5);
                  setOriginFilter((prev) =>
                    prev === chip.origin ? "All" : chip.origin
                  );
                }}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors no-tap ${
                  active
                    ? "bg-jejak-navy text-white shadow-sm"
                    : "frosted border border-white/75 text-jejak-navy/80 hover:bg-white/90"
                }`}
              >
                <span className="text-sm">{FLAGS[chip.origin] || "🌐"}</span>
                <span>{chip.origin}</span>
                {chip.real > 0 ? (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold tabular-nums ${
                      active
                        ? "bg-white/20 text-amber-300"
                        : "bg-jejak-navy/10 text-jejak-navy/70"
                    }`}
                  >
                    {chip.real}
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${
                      active
                        ? "bg-white/20 text-amber-300"
                        : "bg-amber-300/60 text-jejak-navy/75"
                    }`}
                  >
                    sample
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Two-column Masonry / Bento Grid */}
        <div className="mt-3 flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 h-44 rounded-3xl bg-white/50 animate-pulse" />
              <div className="h-48 rounded-3xl bg-white/50 animate-pulse" />
              <div className="h-48 rounded-3xl bg-white/50 animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 items-start">
              {productGroups.map((group, idx) => {
                const isExpanded = expandedProductId === group.productId;
                const isNewest = idx === 0;
                const aspectClass = BENTO_ASPECTS[idx % BENTO_ASPECTS.length];

                return (
                  <React.Fragment key={group.productId}>
                    <div className={isNewest ? "col-span-2" : "col-span-1"}>
                      <TraceTile
                        scan={group.lead}
                        groupScans={group.items}
                        isNewest={isNewest}
                        aspectClass={aspectClass}
                        isExpandedGroup={isExpanded}
                        onToggleGroup={(pid) =>
                          setExpandedProductId((prev) =>
                            prev === pid ? null : pid
                          )
                        }
                        onSelectScan={(s) => {
                          setShowQr(false);
                          setSelectedScan(s);
                        }}
                        reduce={reduce}
                      />
                    </div>

                    {/* Expanded individual traces when a duplicate group is tapped */}
                    {isExpanded && group.items.length > 1 && (
                      <div className="col-span-2 grid grid-cols-2 gap-2.5 rounded-3xl bg-white/55 p-2.5 border border-white/80">
                        {group.items.map((item, subIdx) => (
                          <TraceTile
                            key={item.id || subIdx}
                            scan={item}
                            groupScans={null}
                            isNewest={false}
                            aspectClass="aspect-square"
                            onSelectScan={(s) => {
                              setShowQr(false);
                              setSelectedScan(s);
                            }}
                            reduce={reduce}
                          />
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* "Be the first to trace this" tile for products with no traces */}
              {untracedProducts.map((prod) => (
                <motion.button
                  key={prod.id}
                  type="button"
                  whileTap={reduce ? undefined : TAP}
                  onClick={() => handleTraceProduct(prod.id)}
                  className="col-span-1 aspect-square rounded-3xl frosted-strong border-2 border-dashed border-jejak-navy/20 p-4 flex flex-col items-start justify-between text-left no-tap hover:border-jejak-navy/40 transition-colors"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-jejak-navy/8 text-2xl">
                    {prod.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-jejak-navy">
                      {prod.name}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-jejak-coral">
                      Be the first to trace this →
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Primary CTA: "Trace yours" */}
        <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 px-5 pointer-events-none">
          <motion.button
            type="button"
            whileTap={reduce ? undefined : TAP}
            onClick={handleTraceYours}
            className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-jejak-navy py-3.5 text-sm font-extrabold text-white shadow-xl border border-white/20 no-tap"
          >
            <Camera size={16} className="text-amber-300" />
            <span>Trace yours</span>
          </motion.button>
        </div>

        {/* Tile Detail Bottom Sheet */}
        <AnimatePresence>
          {selectedScan && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-jejak-navy/45 backdrop-blur-sm"
                onClick={() => setSelectedScan(null)}
              />
              <motion.div
                className="relative w-full max-w-[420px] rounded-t-3xl frosted-strong p-5 pb-8 shadow-2xl"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
              >
                {/* Compact header with photo/emoji + origin & material + original price */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                      style={{
                        background:
                          PRODUCT_SURFACES[selectedScan.product_id] ||
                          PRODUCT_SURFACES.hoodie,
                      }}
                    >
                      {selectedScan.photo_url ? (
                        <ContentImage
                          src={selectedScan.photo_url}
                          fittingType="fill"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{selectedScan.emoji || "🧥"}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-base font-extrabold text-jejak-navy truncate">
                          {selectedScan.product_name}
                        </h2>
                        {selectedScan.is_sample && (
                          <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-jejak-navy">
                            Sample
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-bold text-jejak-navy/70 truncate">
                        {FLAGS[selectedScan.origin] || "🌐"}{" "}
                        {materialHeadline(selectedScan)}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-extrabold text-jejak-navy tabular-nums">
                          {formatMoney(
                            selectedScan.price || 45,
                            selectedScan.currency || "GBP"
                          )}
                        </span>
                        <span className="rounded-full bg-jejak-labour/15 px-2 py-0.5 text-[10px] font-extrabold text-jejak-labour tabular-nums">
                          Est. maker share {selectedScan.labour_pct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedScan(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jejak-navy/10 text-jejak-navy no-tap"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Anchored record block (only shown if this trace has its own on-chain record) */}
                {hasOwnAnchoredRecord(selectedScan) ? (
                  <div className="mt-3.5 rounded-2xl bg-jejak-navy p-3 text-white">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300">
                        <span className="h-2 w-2 rounded-full bg-jejak-materials" />
                        Anchored record
                        {selectedScan.stellar_ledger
                          ? ` · Ledger #${selectedScan.stellar_ledger}`
                          : ""}
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
                          href={`https://stellar.expert/explorer/testnet/tx/${selectedScan.stellar_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold text-jejak-navy no-tap"
                        >
                          stellar.expert <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                    <p className="mt-1.5 truncate font-mono text-[10px] text-white/75">
                      SHA-256: {selectedScan.record_sha256}
                    </p>
                    <p className="truncate font-mono text-[10px] text-white/55">
                      TX: {selectedScan.stellar_tx_hash}
                    </p>

                    {showQr && (
                      <div className="mt-2.5 flex items-center gap-3 rounded-xl bg-white p-2 text-jejak-navy">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                            `https://stellar.expert/explorer/testnet/tx/${selectedScan.stellar_tx_hash}`
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
                    const pid = selectedScan.product_id;
                    setSelectedScan(null);
                    handleTraceProduct(pid);
                  }}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-sunrise py-3 text-xs font-extrabold text-white shadow-md no-tap"
                >
                  Trace this too
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single-sentence ⓘ Opt-in Explanation Sheet */}
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
                    <Sparkles size={13} className="text-jejak-coral" /> Community privacy
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
                  Every trace is private by default and only appears here when a user explicitly opts in; seeded demo cards are marked “Sample” and never counted as real activity.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}
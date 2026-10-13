import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Sparkles, X } from "lucide-react";
import { vibrate } from "@/lib/haptics";
import ProductIllustrationIcon from "./ProductIllustrationIcon";
import {
  FLAGS,
  isSampleScan,
  getMaterialName,
  relativeTracedTime,
  hasOwnAnchoredRecord,
} from "./exploreUtils";

const SNAP_HEIGHTS = {
  peek: 156,
  half: 370,
  full: 560,
};

const SNAP_ORDER = ["peek", "half", "full"];

function CompactProductRow({
  group,
  isHighlighted,
  onSelectScan,
}) {
  const { items } = group;
  const [activeIdx, setActiveIdx] = useState(0);
  const safeIdx = Math.min(activeIdx, items.length - 1);
  const scan = items[safeIdx] || items[0];
  const anchored = hasOwnAnchoredRecord(scan);
  const origins = Array.from(new Set(items.map((i) => i.origin).filter(Boolean)));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        vibrate(5);
        onSelectScan(scan);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectScan(scan);
        }
      }}
      className={`group flex items-center justify-between gap-3 py-2.5 px-2.5 rounded-2xl transition-colors cursor-pointer no-tap ${
        isHighlighted
          ? "bg-jejak-gold/20"
          : "hover:bg-white/65"
      }`}
    >
      {/* Left: Small illustrated product icon or user photo + "Product · Origin" */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <ProductIllustrationIcon
          productId={scan.product_id}
          photoUrl={scan.photo_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs sm:text-[13px] font-extrabold text-jejak-navy truncate">
              {scan.product_name} · {scan.origin}
            </p>
            {anchored && (
              <span
                title="Anchored on Stellar Testnet"
                className="h-2 w-2 shrink-0 rounded-full bg-jejak-materials shadow-[0_0_6px_rgba(47,191,113,0.75)]"
              />
            )}
          </div>
          <p className="text-[11px] font-semibold text-jejak-navy/60 truncate">
            {getMaterialName(scan)} · {relativeTracedTime(scan.created_date)}
          </p>
        </div>
      </div>

      {/* Right: Origin switcher pills if multiple origins exist for this product */}
      <div className="flex items-center gap-1 shrink-0">
        {origins.length > 1 ? (
          origins.map((orig) => {
            const active = scan.origin === orig;
            return (
              <button
                key={orig}
                type="button"
                title={`View ${orig} trace`}
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = items.findIndex((it) => it.origin === orig);
                  if (idx >= 0) {
                    vibrate(4);
                    setActiveIdx(idx);
                  }
                }}
                className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none transition-all no-tap ${
                  active
                    ? "bg-jejak-navy text-white shadow-sm"
                    : "bg-jejak-navy/8 opacity-65 hover:opacity-100"
                }`}
              >
                {FLAGS[orig] || "🌐"}
              </button>
            );
          })
        ) : (
          <span className="text-sm leading-none">
            {FLAGS[scan.origin] || "🌐"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ExploreBottomSheet({
  snap,
  setSnap,
  productGroups,
  untracedProducts,
  originFilter,
  onClearOrigin,
  newlyArrivedId,
  onSelectScan,
  onTraceProduct,
  loading,
  reduce,
}) {
  const latestScan = productGroups[0]?.lead || null;
  const hasAnySample = productGroups.some((g) =>
    g.items.some((it) => isSampleScan(it))
  );

  const cycleSnap = () => {
    vibrate(5);
    const idx = SNAP_ORDER.indexOf(snap);
    const next = SNAP_ORDER[(idx + 1) % SNAP_ORDER.length];
    setSnap(next);
  };

  const handleDragEnd = (_, info) => {
    const dy = info.offset.y;
    const vy = info.velocity.y;
    const idx = SNAP_ORDER.indexOf(snap);

    if (dy < -45 || vy < -260) {
      const nextIdx = Math.min(SNAP_ORDER.length - 1, idx + 1);
      setSnap(SNAP_ORDER[nextIdx]);
    } else if (dy > 45 || vy > 260) {
      const nextIdx = Math.max(0, idx - 1);
      setSnap(SNAP_ORDER[nextIdx]);
    }
  };

  return (
    <motion.div
      drag={reduce ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={handleDragEnd}
      animate={{ height: SNAP_HEIGHTS[snap] || SNAP_HEIGHTS.half }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 340, damping: 34 }
      }
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 rounded-t-3xl frosted-strong border-t border-white/85 shadow-[0_-12px_40px_rgba(11,19,43,0.38)] flex flex-col overflow-hidden pb-20"
      style={{
        background:
          "linear-gradient(170deg, rgba(255,255,255,0.95) 0%, rgba(255,238,226,0.94) 55%, rgba(237,231,255,0.95) 100%)",
      }}
    >
      {/* Sheet Drag Handle + Snap Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={cycleSnap}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cycleSnap();
          }
        }}
        className="shrink-0 pt-2.5 pb-1.5 px-4 cursor-grab active:cursor-grabbing select-none no-tap"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-jejak-navy/20" />

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-jejak-navy/65">
              {snap === "peek"
                ? "Latest trace"
                : originFilter === "All"
                ? `Traced products (${productGroups.length})`
                : `Origin: ${originFilter}`}
            </span>

            {originFilter !== "All" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(4);
                  onClearOrigin();
                }}
                className="inline-flex items-center gap-0.5 rounded-full bg-jejak-navy px-2 py-0.5 text-[10px] font-extrabold text-amber-300 no-tap"
              >
                <X size={10} /> Reset
              </button>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-jejak-navy/50">
            {snap === "full" ? (
              <>
                Collapse <ChevronDown size={12} />
              </>
            ) : (
              <>
                {snap === "peek" ? "Expand list" : "Full list"}{" "}
                <ChevronUp size={12} />
              </>
            )}
          </span>
        </div>
      </div>

      {/* Sheet Content */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-4 scrollbar-hide">
        {loading ? (
          <div className="space-y-2 py-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-2.5 py-2 animate-pulse"
              >
                <div className="h-9 w-9 rounded-xl bg-jejak-navy/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-36 rounded bg-jejak-navy/10" />
                  <div className="h-2.5 w-24 rounded bg-jejak-navy/10" />
                </div>
              </div>
            ))}
          </div>
        ) : snap === "peek" ? (
          /* PEEK MODE: Latest trace as a single compact line */
          latestScan ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                vibrate(5);
                onSelectScan(latestScan);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectScan(latestScan);
                }
              }}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white/75 border border-white/90 px-3 py-2 shadow-sm cursor-pointer no-tap"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <ProductIllustrationIcon
                  productId={latestScan.product_id}
                  photoUrl={latestScan.photo_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-extrabold text-jejak-navy truncate">
                      {latestScan.product_name} · {latestScan.origin}
                    </span>
                    {hasOwnAnchoredRecord(latestScan) && (
                      <span
                        title="Anchored on Stellar Testnet"
                        className="h-2 w-2 shrink-0 rounded-full bg-jejak-materials"
                      />
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-jejak-navy/60 truncate">
                    {getMaterialName(latestScan)} ·{" "}
                    {relativeTracedTime(latestScan.created_date)}
                  </p>
                </div>
              </div>
              <span className="text-sm shrink-0">
                {FLAGS[latestScan.origin] || "🌐"}
              </span>
            </div>
          ) : (
            <p className="px-2 py-2 text-xs font-semibold text-jejak-navy/60">
              No traces for this origin yet.
            </p>
          )
        ) : (
          /* HALF & FULL MODES: Single "Sample data" banner + deduplicated compact product list */
          <div className="space-y-1">
            {hasAnySample && (
              <div className="mb-1.5 flex items-center justify-between gap-2 rounded-xl bg-jejak-navy/6 border border-jejak-navy/10 px-3 py-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-jejak-navy/75">
                  <Sparkles size={12} className="text-jejak-labour shrink-0" />
                  Sample data · Seeded demo traces (excluded from live counts)
                </span>
              </div>
            )}

            <div className="divide-y divide-jejak-navy/8">
              {productGroups.map((group) => (
                <CompactProductRow
                  key={group.productId}
                  group={group}
                  isHighlighted={group.items.some(
                    (it) => it.id === newlyArrivedId
                  )}
                  onSelectScan={onSelectScan}
                />
              ))}

              {/* Untraced products shown cleanly at bottom with illustrated icon */}
              {untracedProducts.map((prod) => (
                <div
                  key={prod.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onTraceProduct(prod.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onTraceProduct(prod.id);
                    }
                  }}
                  className="flex items-center justify-between gap-3 py-2.5 px-2.5 rounded-2xl hover:bg-white/65 transition-colors cursor-pointer no-tap"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProductIllustrationIcon
                      productId={prod.id}
                      size="sm"
                      className="opacity-75"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-[13px] font-extrabold text-jejak-navy/65 truncate">
                        {prod.name} · Not traced yet
                      </p>
                      <p className="text-[11px] font-bold text-jejak-coral">
                        Tap to trace first →
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Sparkles, X } from "lucide-react";
import { vibrate } from "@/lib/haptics";
import ProductIllustrationIcon from "./ProductIllustrationIcon";
import OriginFlagChip from "./OriginFlagChip";
import {
  isSampleScan,
  getMaterialName,
  relativeTracedTime,
  hasOwnAnchoredRecord,
} from "./exploreUtils";

export const SNAP_HEIGHTS = {
  peek: 58,
  half: 340,
  full: 520,
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
  const origins = Array.from(
    new Set(items.map((i) => i.origin).filter(Boolean))
  );

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
      className={`group flex items-center justify-between gap-3 py-2.5 px-2.5 rounded-2xl transition-colors cursor-pointer no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy/50 ${
        isHighlighted ? "bg-jejak-gold/25" : "hover:bg-white/65"
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

      {/* Right: Shared OriginFlagChip switcher pills */}
      <div className="flex items-center gap-1 shrink-0">
        {origins.length > 1 ? (
          origins.map((orig) => {
            const active = scan.origin === orig;
            return (
              <OriginFlagChip
                key={orig}
                country={orig}
                size="xs"
                active={active}
                title={`View ${orig} trace`}
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = items.findIndex((it) => it.origin === orig);
                  if (idx >= 0) {
                    vibrate(4);
                    setActiveIdx(idx);
                  }
                }}
              />
            );
          })
        ) : (
          <OriginFlagChip country={scan.origin} size="xs" />
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
  const hasAnySample = productGroups.some((g) =>
    g.items.some((it) => isSampleScan(it))
  );

  const handleHeaderTap = () => {
    vibrate(5);
    if (snap === "peek") {
      setSnap("half");
    } else if (snap === "half") {
      setSnap("full");
    } else {
      setSnap("peek");
    }
  };

  const handleDragEnd = (_, info) => {
    const dy = info.offset.y;
    const vy = info.velocity.y;
    const idx = SNAP_ORDER.indexOf(snap);

    if (dy < -40 || vy < -240) {
      // Dragged upward: peek -> half -> full
      const nextIdx = Math.min(SNAP_ORDER.length - 1, idx + 1);
      setSnap(SNAP_ORDER[nextIdx]);
    } else if (dy > 40 || vy > 240) {
      // Dragged downward: full -> half -> peek (or fast swipe straight to peek)
      if (vy > 600 || dy > 140) {
        setSnap("peek");
      } else {
        const nextIdx = Math.max(0, idx - 1);
        setSnap(SNAP_ORDER[nextIdx]);
      }
    }
  };

  const tracedCount = productGroups.length;
  const peekLabel =
    originFilter === "All"
      ? `${tracedCount} traced ${tracedCount === 1 ? "product" : "products"}`
      : `${tracedCount} traced from ${originFilter}`;

  return (
    <motion.div
      drag={reduce ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.14}
      onDragEnd={handleDragEnd}
      animate={{ height: SNAP_HEIGHTS[snap] || SNAP_HEIGHTS.peek }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 360, damping: 34 }
      }
      style={{
        bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
        background:
          "linear-gradient(170deg, rgba(255,255,255,0.96) 0%, rgba(255,238,226,0.95) 55%, rgba(237,231,255,0.96) 100%)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute left-0 right-0 z-30 w-full rounded-t-3xl frosted-strong border-t border-white/85 shadow-[0_-10px_32px_rgba(18,45,79,0.34)] flex flex-col overflow-hidden"
    >
      {/* Sheet Drag Handle + One-Line Peek / Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleHeaderTap}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleHeaderTap();
          }
        }}
        className="shrink-0 pt-2.5 pb-2.5 px-5 cursor-grab active:cursor-grabbing select-none no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jejak-navy/50"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-jejak-navy/25" />

        <motion.div
          animate={
            newlyArrivedId && !reduce
              ? { scale: [1, 1.03, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.45 }}
          className="mt-2 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            {newlyArrivedId && (
              <span
                className={`h-2 w-2 shrink-0 rounded-full bg-jejak-materials ${
                  reduce ? "" : "animate-ping"
                }`}
              />
            )}
            <span className="text-xs font-extrabold tracking-tight text-jejak-navy truncate">
              {peekLabel}
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
                <X size={10} /> All
              </button>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-jejak-navy/55 shrink-0">
            {snap === "full" ? (
              <>
                Collapse <ChevronDown size={13} />
              </>
            ) : snap === "half" ? (
              <>
                Full list <ChevronUp size={13} />
              </>
            ) : (
              <>
                Open <ChevronUp size={13} />
              </>
            )}
          </span>
        </motion.div>
      </div>

      {/* Expanded Sheet Content (visible in half & full snap states) */}
      {snap !== "peek" && (
        <div className="flex-1 overflow-y-auto px-3.5 pb-6 scrollbar-hide">
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
          ) : (
            <div className="space-y-1">
              {hasAnySample && (
                <div className="mb-1.5 flex items-center justify-between gap-2 rounded-xl bg-jejak-navy/6 border border-jejak-navy/10 px-3 py-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-jejak-navy/75">
                    <Sparkles
                      size={12}
                      className="text-jejak-labour shrink-0"
                    />
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
      )}
    </motion.div>
  );
}
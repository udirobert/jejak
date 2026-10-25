import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Sparkles, X } from "lucide-react";
import { vibrate } from "@/lib/haptics";
import Specimen from "@/components/journal/Specimen";

import { isSampleScan, relativeTracedTime } from "./exploreUtils";

export const SNAP_HEIGHTS = {
  peek: 58,
  half: 340,
  full: 520,
};

const SNAP_ORDER = ["peek", "half", "full"];

function CompactProductRow({ group, isHighlighted, onSelectScan }) {
  const { items } = group;
  const [activeIdx, setActiveIdx] = useState(0);
  const safeIdx = Math.min(activeIdx, items.length - 1);
  const scan = items[safeIdx] || items[0];

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
      className={`group flex items-center justify-between gap-3 border-b border-dotted border-journal-rule px-2.5 py-3 cursor-pointer no-tap transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp ${
        isHighlighted ? "bg-journal-paper-deep/60" : "hover:bg-journal-paper-deep/40"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Specimen id={scan.product_id} className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-grotesk text-[13px] font-semibold text-journal-ink truncate">
            {scan.product_name} · {scan.origin}
          </p>
          <p className="font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-ink-soft truncate">
            {scan.story_title ? scan.story_title : relativeTracedTime(scan.created_date)}
          </p>
        </div>
      </div>
      <span className="shrink-0 border border-journal-rule px-1.5 py-0.5 font-plexmono text-[9px] uppercase tracking-[0.1em] text-journal-ink-soft">
        {scan.origin?.slice(0, 12)}
      </span>
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
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const fn = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const hasAnySample = productGroups.some((g) =>
    g.items.some((it) => isSampleScan(it))
  );

  const handleHeaderTap = () => {
    vibrate(5);
    if (snap === "peek") {
      setSnap("half");
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
      drag={reduce || isDesktop ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.14}
      onDragEnd={handleDragEnd}
      animate={isDesktop ? {} : { height: SNAP_HEIGHTS[snap] || SNAP_HEIGHTS.peek }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 360, damping: 34 }
      }
      style={isDesktop
        ? { top: "3.5rem", right: 0, left: "auto", bottom: 0, width: 400, height: "auto", background: "var(--j-card)", borderTop: "none", borderLeft: "1px solid var(--j-rule)" }
        : {
            bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
            background: "var(--j-card)",
          }}
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute left-0 right-0 z-30 w-full border-t border-journal-rule bg-journal-card shadow-[0_-6px_24px_rgba(30,27,22,0.14)] flex flex-col overflow-hidden"
    >
      {/* Sheet Drag Handle + One-Line Peek / Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={isDesktop ? undefined : handleHeaderTap}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleHeaderTap();
          }
        }}
        className="shrink-0 pt-2.5 pb-2.5 px-5 cursor-grab active:cursor-grabbing select-none no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jejak-navy/50"
      >
        <div className="mx-auto h-1 w-10 bg-journal-rule" />

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
            <span className="font-serif-display text-base text-journal-ink truncate" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}>
              The Atlas · <span className="font-plexmono text-[10px] uppercase tracking-[0.1em] not-italic">{peekLabel}</span>
            </span>

            {originFilter !== "All" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(4);
                  onClearOrigin();
                }}
                className="inline-flex items-center gap-0.5 border border-journal-ink bg-journal-ink px-2 py-0.5 font-plexmono text-[9px] uppercase text-journal-card no-tap"
              >
                <X size={10} /> All
              </button>
            )}
          </div>

          <span className="inline-flex items-center gap-1 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-ink-soft shrink-0">
            {snap === "peek" ? (
              <>
                Open <ChevronUp size={13} />
              </>
            ) : (
              <>
                Collapse <ChevronDown size={13} />
              </>
            )}
          </span>
        </motion.div>
      </div>

      {/* Expanded Sheet Content (visible in half & full snap states) */}
      {(isDesktop || snap !== "peek") && (
        <div className="flex-1 overflow-y-auto px-3.5 pb-6 scrollbar-hide">
          {loading ? (
            <div className="space-y-2 py-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-2.5 py-2 animate-pulse"
                >
                  <div className="h-9 w-9 bg-journal-rule/50" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-36 bg-journal-rule/40" />
                    <div className="h-2.5 w-24 bg-journal-rule/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {hasAnySample && (
                <div className="mb-1.5 flex items-center justify-between gap-2 border border-journal-rule bg-journal-paper px-3 py-1.5">
                  <span className="inline-flex items-center gap-1.5 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-ink-soft">
                    <Sparkles
                      size={12}
                      className="text-jejak-labour shrink-0"
                    />
                    Sample data · excluded from live counts
                  </span>
                </div>
              )}

              <div className="">
                {!loading && productGroups.length === 0 && (
                  <p className="px-3 py-6 text-center font-hand text-xl text-journal-ink-soft">
                    No public entries from here yet — yours could be the first.
                  </p>
                )}
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
                    className="flex items-center justify-between gap-3 border-b border-dotted border-journal-rule px-2.5 py-3 hover:bg-journal-paper-deep/40 transition-colors cursor-pointer no-tap"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Specimen id={prod.id} className="h-10 w-10 opacity-75" />
                      <div className="min-w-0">
                        <p className="font-grotesk text-[13px] font-semibold text-journal-ink-soft truncate">
                          {prod.name} · Not traced yet
                        </p>
                        <p className="font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-stamp">
                          Tap to trace first
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
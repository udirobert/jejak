import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import {
  FLAGS,
  isSampleScan,
  materialOriginLine,
  hasOwnAnchoredRecord,
  txExplorerUrl,
} from "./exploreUtils";
import { vibrate } from "@/lib/haptics";

export default function TypographicTraceRow({
  group,
  isNewlyArrived = false,
  onSelectScan,
  reduce,
}) {
  const { items } = group;
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, items.length - 1);
  const activeScan = items[safeIndex] || items[0];

  const touchStartX = useRef(null);
  const didSwipe = useRef(false);

  const stepTrace = (delta) => {
    if (items.length <= 1) return;
    vibrate(4);
    setActiveIndex((prev) => (prev + delta + items.length) % items.length);
  };

  const handlePointerDown = (e) => {
    touchStartX.current = e.clientX ?? e.touches?.[0]?.clientX ?? null;
    didSwipe.current = false;
  };

  const handlePointerUp = (e) => {
    if (touchStartX.current == null || items.length <= 1) return;
    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? null;
    if (endX == null) return;
    const dx = endX - touchStartX.current;
    if (Math.abs(dx) > 28) {
      didSwipe.current = true;
      stepTrace(dx < 0 ? 1 : -1);
    }
    touchStartX.current = null;
  };

  const anchored = hasOwnAnchoredRecord(activeScan);
  const explorerHref = txExplorerUrl(activeScan);

  // Unique origin list in order of appearance for inline flags
  const origins = Array.from(new Set(items.map((i) => i.origin).filter(Boolean)));

  return (
    <motion.div
      layout={!reduce}
      initial={
        reduce
          ? false
          : isNewlyArrived
          ? { opacity: 0, y: -14 }
          : { opacity: 0, y: 6 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onClick={() => {
        if (didSwipe.current) {
          didSwipe.current = false;
          return;
        }
        vibrate(5);
        onSelectScan(activeScan);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          stepTrace(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          stepTrace(-1);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectScan(activeScan);
        }
      }}
      className={`group relative py-4 border-b border-jejak-navy/12 cursor-pointer select-none no-tap transition-colors ${
        isNewlyArrived && !reduce ? "bg-amber-300/15" : ""
      }`}
    >
      {/* Top typographic line: Large product name + inline origin flags + right-aligned Sample / Anchored link */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2.5 min-w-0 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-jejak-navy group-hover:text-jejak-freight transition-colors">
            {activeScan.product_name}
          </h2>

          {/* Inline flags of traced origins */}
          <div className="inline-flex items-center gap-1">
            {origins.map((orig) => {
              const isCurrentOrigin = activeScan.origin === orig;
              return (
                <button
                  key={orig}
                  type="button"
                  title={orig}
                  onClick={(e) => {
                    if (items.length > 1) {
                      e.stopPropagation();
                      const idx = items.findIndex((it) => it.origin === orig);
                      if (idx >= 0) {
                        vibrate(4);
                        setActiveIndex(idx);
                      }
                    }
                  }}
                  className={`text-base leading-none transition-opacity ${
                    items.length > 1 && !isCurrentOrigin
                      ? "opacity-45 hover:opacity-90"
                      : "opacity-100"
                  }`}
                >
                  {FLAGS[orig] || "🌐"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status tags: Sample & Anchored (links to its own transaction) */}
        <div className="flex items-center gap-2 shrink-0">
          {isSampleScan(activeScan) && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/50">
              Sample
            </span>
          )}
          {anchored && (
            <a
              href={explorerHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-jejak-freight hover:underline"
              title="Open this trace's transaction on Stellar.Expert"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-jejak-materials" />
              Anchored <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* Second line: one line of material/origin text + dots for multi-trace swipe */}
      <div className="mt-1 flex items-center justify-between gap-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeScan.id || `${activeScan.origin}-${safeIndex}`}
            initial={reduce ? false : { opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -6 }}
            transition={{ duration: 0.16 }}
            className="text-xs font-semibold text-jejak-navy/65 truncate"
          >
            {materialOriginLine(activeScan)}
          </motion.p>
        </AnimatePresence>

        {items.length > 1 && (
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, idx) => {
              const active = idx === safeIndex;
              return (
                <button
                  key={item.id || idx}
                  type="button"
                  aria-label={`Show ${item.origin} trace`}
                  onClick={() => {
                    vibrate(4);
                    setActiveIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    active
                      ? "w-4 bg-jejak-navy"
                      : "w-1.5 bg-jejak-navy/25 hover:bg-jejak-navy/50"
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
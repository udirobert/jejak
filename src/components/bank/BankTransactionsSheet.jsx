import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ArrowDownLeft } from "lucide-react";
import { getProduct } from "@/data";
import { formatMoney, getRoute } from "@/lib/money";
import ProductIllustrationIcon from "@/components/explore/ProductIllustrationIcon";
import OriginFlagChip from "@/components/explore/OriginFlagChip";
import { vibrate } from "@/lib/haptics";

export const BANK_SNAP_HEIGHTS = {
  peek: 64,
  half: 315,
  full: 510,
};

const SNAP_ORDER = ["peek", "half", "full"];

export default function BankTransactionsSheet({
  snap,
  setSnap,
  feed,
  withJejak,
  currency,
  market,
  fxMult,
  onSelectTx,
  reduce = false,
}) {
  const tracedCount = feed.filter((t) => Boolean(t.productId)).length;

  const handleHeaderTap = () => {
    vibrate(5);
    if (snap === "peek") {
      setSnap("half");
    } else if (snap === "half") {
      setSnap("full");
    } else {
      setSnap("half");
    }
  };

  const handleDragEnd = (_, info) => {
    const dy = info.offset.y;
    const vy = info.velocity.y;
    const idx = SNAP_ORDER.indexOf(snap);

    if (dy < -36 || vy < -220) {
      const nextIdx = Math.min(SNAP_ORDER.length - 1, idx + 1);
      setSnap(SNAP_ORDER[nextIdx]);
    } else if (dy > 36 || vy > 220) {
      if (vy > 600 || dy > 150) {
        setSnap("peek");
      } else {
        const nextIdx = Math.max(0, idx - 1);
        setSnap(SNAP_ORDER[nextIdx]);
      }
    }
  };

  const headerLabel = withJejak
    ? `${tracedCount} traced purchases`
    : `${feed.length} recent transactions`;

  return (
    <motion.div
      drag={reduce ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={handleDragEnd}
      animate={{ height: BANK_SNAP_HEIGHTS[snap] || BANK_SNAP_HEIGHTS.half }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 360, damping: 34 }
      }
      style={{
        bottom: "calc(4.4rem + env(safe-area-inset-bottom, 0px))",
      }}
      className="pointer-events-auto absolute left-0 right-0 z-30 w-full rounded-t-3xl bg-white border-t border-slate-200/90 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] flex flex-col overflow-hidden"
    >
      {/* Sheet Drag Handle + One-Line Header (same pattern as Explore) */}
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
        className="shrink-0 pt-2.5 pb-2.5 px-5 cursor-grab active:cursor-grabbing select-none no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold tracking-tight text-slate-900">
            {headerLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-500">
            {snap === "full" ? (
              <>
                Collapse <ChevronDown size={13} />
              </>
            ) : (
              <>
                {snap === "peek" ? "Open" : "Expand"} <ChevronUp size={13} />
              </>
            )}
          </span>
        </div>
      </div>

      {/* Scrollable Transactions List */}
      {snap !== "peek" && (
        <div className="relative flex-1 overflow-y-auto px-3 pb-10 scrollbar-hide divide-y divide-slate-100">
          {feed.map((tx, rowIdx) => {
            const prod = tx.productId ? getProduct(tx.productId) : null;
            const rawPrice = +(Math.abs(tx.amount) * fxMult).toFixed(2);
            const route = prod ? getRoute(prod, market) : [];
            const routeFlags = prod
              ? Array.from(
                  new Set([
                    tx.origin || route[0]?.country,
                    ...route.slice(1, -1).map((r) => r.country),
                  ])
                )
                  .filter(Boolean)
                  .slice(0, 2)
              : [];

            const isInteractive = Boolean(prod && withJejak);

            return (
              <div
                key={tx.id}
                role={isInteractive ? "button" : undefined}
                tabIndex={isInteractive ? 0 : undefined}
                onClick={() => {
                  if (isInteractive) onSelectTx(tx);
                }}
                onKeyDown={(e) => {
                  if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelectTx(tx);
                  }
                }}
                className={`px-2.5 py-3 rounded-2xl transition-colors no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 ${
                  isInteractive
                    ? "cursor-pointer hover:bg-slate-50 active:bg-slate-100/80"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {prod ? (
                      <ProductIllustrationIcon productId={prod.id} size="sm" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600">
                        <ArrowDownLeft size={17} strokeWidth={2.4} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {tx.merchant}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 truncate">
                        {tx.date} · {tx.cat}
                      </p>
                    </div>
                  </div>

                  {/* Right: Animated Jejak Trace chip + Amount */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <AnimatePresence>
                      {prod && withJejak && (
                        <motion.div
                          key={`chip-${tx.id}`}
                          initial={
                            reduce
                              ? false
                              : { opacity: 0, scale: 0.85, x: 6 }
                          }
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={
                            reduce
                              ? undefined
                              : { opacity: 0, scale: 0.85, x: 6 }
                          }
                          transition={{
                            duration: reduce ? 0 : 0.22,
                            delay: reduce ? 0 : rowIdx * 0.04,
                          }}
                        >
                          <OriginFlagChip
                            countries={routeFlags}
                            variant="jejak-hero"
                            size="md"
                            labelOverride="Trace"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTx(tx);
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <span
                      className={`text-sm font-extrabold tabular-nums ${
                        tx.amount > 0 ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : "-"}
                      {formatMoney(rawPrice, currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtle bottom fade so the floating tab bar never crowds content */}
      {snap !== "peek" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
      )}
    </motion.div>
  );
}
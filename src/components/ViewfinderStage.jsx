import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ShutterButton from "./ShutterButton";
import { CATEGORIES } from "@/lib/tokens";
import { DEMO_CHIPS, getProduct } from "@/data";
import { formatMoney, getRoute } from "@/lib/money";
import ProductIllustrationIcon from "@/components/explore/ProductIllustrationIcon";
import { vibrate } from "@/lib/haptics";
import {
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  Info,
  Sparkles,
} from "lucide-react";

const PREVIEW_SPLIT = [
  { key: "materials", label: "Materials", pct: 18, color: CATEGORIES[0].color },
  { key: "labour", label: "Makers", pct: 7.5, color: CATEGORIES[1].color },
  { key: "freight", label: "Freight", pct: 9.5, color: CATEGORIES[2].color },
  { key: "brand", label: "Brand", pct: 30, color: CATEGORIES[3].color },
  { key: "retail", label: "Retail", pct: 35, color: CATEGORIES[4].color },
];

// Direct-on-gradient J coin hero with warm gold glow, slim dark-glass legend strip
// below the coin, and shared-price sample product buttons above the fold.
export default function ViewfinderStage({
  market,
  currency,
  onPickCamera,
  onPickLibrary,
  onPickSample,
  onOpenFallback,
}) {
  const [showTechDetail, setShowTechDetail] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="mt-2 flex flex-col"
    >
      {/* Hero J Coin directly on the navy-indigo gradient with a warm gold glow behind it */}
      <div className="relative py-3 flex flex-col items-center justify-center text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-40 w-40 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,194,75,0.42) 0%, rgba(232,146,26,0.16) 52%, rgba(27,27,58,0) 75%)",
          }}
        />
        <ShutterButton onPick={onPickCamera} />
        <p className="relative z-10 mt-2.5 flex items-center gap-1.5 text-xs font-extrabold text-white">
          <Camera size={14} className="text-amber-300" /> Tap the J coin to scan
          any item
        </p>

        <button
          type="button"
          onClick={onPickLibrary}
          className="relative z-10 mt-0.5 min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white/75 hover:text-white underline underline-offset-4 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-lg"
        >
          <ImageIcon size={13} /> Or upload from photo library
        </button>
      </div>

      {/* Slim Origin / Care label / Cost split preview strip below the coin */}
      <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md px-3.5 py-2.5 text-white">
        <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold">
          <span className="text-white/90">Origin · Care label · Cost split</span>
          <button
            type="button"
            onClick={() => {
              vibrate(4);
              setShowTechDetail((v) => !v);
            }}
            aria-expanded={showTechDetail}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 border border-emerald-400/35 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 hover:bg-emerald-400/25 no-tap"
          >
            <ShieldCheck size={11} />
            <span>Verified on Stellar</span>
            <Info size={10} className="text-white/70" />
          </button>
        </div>

        <div
          className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-white/15"
          role="img"
          aria-label="5-part shelf price breakdown: Materials, Makers, Freight, Brand, Retail"
        >
          {PREVIEW_SPLIT.map((seg) => (
            <div
              key={seg.key}
              style={{ width: `${seg.pct}%`, background: seg.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[9px] font-bold text-white/75">
          {PREVIEW_SPLIT.map((seg) => (
            <span key={seg.key} className="inline-flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: seg.color }}
              />
              {seg.label}
            </span>
          ))}
        </div>

        <AnimatePresence>
          {showTechDetail && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 pt-1.5 border-t border-white/15 text-[10px] font-semibold text-white/80 overflow-hidden"
            >
              Each trace hashes its canonical JSON (SHA-256) on Stellar Testnet
              with no wallet required.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Above-the-fold Sample Items using shared product names & prices */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            <Sparkles size={11} /> Try a sample trace
          </span>
          <button
            type="button"
            onClick={onOpenFallback}
            className="text-[10px] font-bold text-white/70 hover:text-white underline no-tap"
          >
            All categories
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DEMO_CHIPS.map((c, idx) => {
            const prod = getProduct(c.id);
            const mkt = prod?.markets?.[market] ? market : "GB";
            const price = prod?.markets?.[mkt]?.price ?? 0;
            const formatted = formatMoney(price, currency);
            const route = getRoute(prod, mkt);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onPickSample(c.id)}
                className={`min-h-[44px] flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 text-left transition-all no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                  idx === 0
                    ? "bg-amber-300 text-jejak-navy border-amber-200 shadow-md"
                    : "bg-white/12 text-white border-white/20 hover:bg-white/20 backdrop-blur-md"
                }`}
              >
                <ProductIllustrationIcon
                  productId={c.id}
                  size="sm"
                  className="!h-7 !w-7 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-extrabold leading-tight">
                    {prod?.name || c.label}
                  </p>
                  <p
                    className={`truncate text-[10px] font-bold ${
                      idx === 0 ? "text-jejak-navy/80" : "text-amber-300"
                    }`}
                  >
                    {formatted} · {route[0]?.country || "Origin"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
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

// Frosted camera viewfinder card with single hero J coin button, demoted library link,
// plain-English "Verified on Stellar" badge (technical detail 1 tap deeper), labeled
// cost-split bar, and above-the-fold sample product chips that follow active currency.
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="relative mt-3 rounded-3xl frosted-strong border border-white/85 p-4 shadow-xl overflow-hidden"
    >
      {/* Top provenance & labeled cost-split preview strip */}
      <div className="rounded-2xl bg-white/90 border border-white px-3 py-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-jejak-navy">
          <span>Origin · Care label · Cost split</span>
          <button
            type="button"
            onClick={() => {
              vibrate(4);
              setShowTechDetail((v) => !v);
            }}
            aria-expanded={showTechDetail}
            className="inline-flex items-center gap-1 rounded-full bg-jejak-materials/15 px-2 py-0.5 text-[10px] font-extrabold text-jejak-navy hover:bg-jejak-materials/25 no-tap"
          >
            <ShieldCheck size={11} className="text-jejak-materials" />
            <span>Verified on Stellar</span>
            <Info size={10} className="text-jejak-navy/60" />
          </button>
        </div>

        {/* Labeled 5-category rainbow bar */}
        <div
          className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-jejak-navy/10"
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

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[9px] font-bold text-jejak-navy/70">
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

        {/* One-tap-deeper technical detail */}
        <AnimatePresence>
          {showTechDetail && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 pt-1.5 border-t border-jejak-navy/10 text-[10px] font-semibold text-jejak-navy/75 overflow-hidden"
            >
              Each trace hashes its canonical JSON (`SHA-256`) into a Stellar
              Testnet `MEMO_HASH` from a server account — instant, with no
              wallet prompt required.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Single Primary Hero CTA: The Gold J Coin Button */}
      <div className="my-4 flex flex-col items-center justify-center text-center">
        <ShutterButton onPick={onPickCamera} />
        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-extrabold text-jejak-navy">
          <Camera size={14} className="text-jejak-coral" /> Tap the J coin to
          scan any item
        </p>

        {/* Demoted secondary text-link action */}
        <button
          type="button"
          onClick={onPickLibrary}
          className="mt-1 min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-jejak-navy/70 hover:text-jejak-navy underline underline-offset-4 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy rounded-lg"
        >
          <ImageIcon size={13} /> Or upload from photo library
        </button>
      </div>

      {/* Above-the-fold Sample Chips (dynamically following active currency £ / S$) */}
      <div className="pt-2.5 border-t border-jejak-navy/10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/70">
            <Sparkles size={11} className="text-jejak-goldDeep" /> No item
            handy? Try a sample
          </span>
          <button
            type="button"
            onClick={onOpenFallback}
            className="text-[10px] font-bold text-jejak-navy/60 hover:text-jejak-navy underline no-tap"
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
                className={`min-h-[44px] flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 text-left transition-all no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy ${
                  idx === 0
                    ? "bg-jejak-navy text-white border-jejak-navy shadow-sm"
                    : "bg-white/90 text-jejak-navy border-white hover:bg-white"
                }`}
              >
                <ProductIllustrationIcon
                  productId={c.id}
                  size="sm"
                  className="!h-7 !w-7 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-extrabold leading-tight">
                    {idx === 0
                      ? `Try ${formatted} ${c.label}`
                      : `${formatted} ${c.label}`}
                  </p>
                  <p
                    className={`truncate text-[9px] font-semibold ${
                      idx === 0 ? "text-amber-300" : "text-jejak-navy/60"
                    }`}
                  >
                    {route[0]?.country || "Origin"} →{" "}
                    {mkt === "SG" ? "SG" : "UK"}
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
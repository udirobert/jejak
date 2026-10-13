import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { computeSplit, formatMoney, labourPerUnit, getRoute } from "@/lib/money";
import { buildMetrics, routeDistance } from "@/lib/metrics";
import ScreenShell from "@/components/ScreenShell";
import CoinDrop from "@/components/CoinDrop";
import StackedBar from "@/components/StackedBar";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import ShareReceipt from "@/components/ShareReceipt";
import MetricsCarousel from "@/components/MetricsCarousel";
import MakerBridgeCard from "@/components/MakerBridgeCard";
import CoachmarkPill from "@/components/CoachmarkPill";
import { buildCanonicalProvenanceRecord } from "@/components/ProvenanceAnchorCard";
import { celebrate } from "@/lib/celebrate";
import { vibrate, coinClink } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { ArrowLeft, Camera, Sliders, Coins, GitBranch, Sparkles, HelpCircle } from "lucide-react";

const LENS_TABS = [
  { id: "coins", label: "Coin Drop", icon: Coins },
  { id: "flow", label: "Flow & Cause", icon: GitBranch },
  { id: "context", label: "Equivalents", icon: Sparkles },
];

export default function MoneySplit() {
  const {
    product,
    market,
    currency,
    setScreen,
    compareMode,
    setCompareMode,
    setDetailCategory,
    addTrace,
    photoFile,
    shareMode,
    customPrice,
    setCustomPrice,
    guessedLabourPct,
    labelEvidence,
    provenanceRecord,
    reset,
  } = useApp();
  const [editingPrice, setEditingPrice] = useState(false);
  const [activeLens, setActiveLens] = useState("coins");
  const [showNotePopover, setShowNotePopover] = useState(false);
  const [anchoredEstimate, setAnchoredEstimate] = useState(null);
  const [anchoring, setAnchoring] = useState(false);

  const reduce = useReducedMotion();
  const basePrice = product.markets[market].price;
  const price = customPrice != null && customPrice > 0 ? customPrice : basePrice;
  const minPrice = Math.max(1, Math.round(basePrice * 0.3));
  const maxPrice = Math.round(basePrice * 3);
  const split = computeSplit(product, market, compareMode ? "transparent" : "split", price);
  const labour = split.find((s) => s.key === "labour");
  const metrics = buildMetrics(product, market, currency, price);
  const perUnit = labourPerUnit(
    compareMode ? product.transparentAlternative.split : product.split,
    currency
  );
  const route = getRoute(product, market);
  const originCountry = route[0]?.country || "Origin";
  const transparentLabourAmt = computeSplit(product, market, "transparent", price).find(
    (s) => s.key === "labour"
  ).amount;

  // Celebrate the first trace of this product & stamp origin into passport.
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    addTrace(labour.amount, routeDistance(product, market), originCountry);
    vibrate([0, 12, 30, 12]);
    coinClink();
    if (!reduce) {
      const t = setTimeout(celebrate, 350);
      return () => clearTimeout(t);
    }
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const publishEstimateRecord = async (modeToUse = shareMode === "private" ? "count" : shareMode) => {
    if (savedScan.current || anchoring) return;
    savedScan.current = true;
    setAnchoring(true);
    try {
      let photo_url = "";
      if (modeToUse === "feed" && photoFile) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: photoFile });
        photo_url = file_url;
      }
      // Each real trace is anchored with its own SHA-256 hash of its own canonical provenance record.
      // Never fall back to a shared hash if this trace was not individually anchored.
      let stellar_tx_hash =
        provenanceRecord && !provenanceRecord.cachedFallback
          ? provenanceRecord.txHash || ""
          : "";
      let record_sha256 =
        provenanceRecord && !provenanceRecord.cachedFallback
          ? provenanceRecord.recordHashHex || ""
          : "";
      let stellar_ledger =
        provenanceRecord && !provenanceRecord.cachedFallback
          ? Number(provenanceRecord.ledger) || 0
          : 0;
      let canonical_json =
        provenanceRecord && !provenanceRecord.cachedFallback
          ? provenanceRecord.canonicalJson || ""
          : "";
      const effectiveOrigin = labelEvidence?.country_of_manufacture || originCountry;
      const basis =
        labelEvidence?.country_of_manufacture || labelEvidence?.fibre_composition
          ? "Read from label"
          : "Estimated";

      if (!stellar_tx_hash || !record_sha256) {
        try {
          const record = buildCanonicalProvenanceRecord({
            product,
            market,
            labelEvidence,
            timestampISO: new Date().toISOString(),
          });
          canonical_json = JSON.stringify(record);
          const anchorRes = await base44.functions.invoke("stellarMakerPayout", {
            action: "anchor_provenance",
            productId: product.id,
            origin: effectiveOrigin,
            canonicalJson: canonical_json,
          });
          if (anchorRes?.data?.ok && !anchorRes.data.cachedFallback && anchorRes.data.hash) {
            stellar_tx_hash = anchorRes.data.hash;
            record_sha256 = anchorRes.data.recordHashHex || "";
            stellar_ledger = Number(anchorRes.data.ledger) || 0;
          }
        } catch {}
      }

      const stellar_memo = record_sha256
        ? `SHA256:${record_sha256.slice(0, 12)}`
        : "";
      await base44.entities.Scan.create({
        product_id: product.id,
        product_name: product.name,
        emoji: product.emoji,
        origin: effectiveOrigin,
        labour_pct: labour.pct.mid,
        price,
        currency,
        market,
        photo_url,
        confidence: labour.confidence,
        basis,
        canonical_json,
        stellar_tx_hash,
        stellar_ledger,
        stellar_memo,
        record_sha256,
        label_country: labelEvidence?.country_of_manufacture || "",
        label_materials: labelEvidence?.fibre_composition || "",
        sample_entry: false,
      });
      if (stellar_tx_hash) {
        setAnchoredEstimate({
          hash: stellar_tx_hash,
          memo: stellar_memo,
          explorerUrl: `https://stellar.expert/explorer/testnet/tx/${stellar_tx_hash}`,
        });
      }
    } catch {} finally {
      setAnchoring(false);
    }
  };

  // Persist this trace to the community feed/tally when opted in ('count' or 'feed').
  const savedScan = useRef(false);
  useEffect(() => {
    if (savedScan.current || shareMode === "private") return;
    publishEstimateRecord(shareMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareMode]);

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setScreen("journey")}
            className="flex items-center gap-1 text-sm font-bold text-jejak-navy/70 no-tap"
          >
            <ArrowLeft size={16} /> 3D Route
          </button>
          <span className="rounded-full bg-jejak-navy/8 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/65">
            {originCountry} → {market === "SG" ? "SG" : "UK"}
          </span>
        </div>

        {/* Price + Compact Maker Share Hero */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-jejak-navy/55">
                {product.emoji} {product.name} · {product.markets[market].retailer}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-jejak-navy tabular-nums">
                  {formatMoney(price, currency)}
                </p>
                <span className="rounded-full bg-jejak-labour/15 px-2 py-0.5 text-xs font-extrabold text-jejak-labour tabular-nums">
                  {formatMoney(labour.amount, currency)} ({labour.pct.mid}%) to makers
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                vibrate(6);
                setEditingPrice((v) => !v);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-full frosted border border-white/80 px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy no-tap"
            >
              <Sliders size={11} /> {editingPrice ? "Done" : "Price"}
            </button>
          </div>

          {/* Guess-the-Share reveal badge when user made a pre-reveal guess */}
          {guessedLabourPct != null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-1.5 flex items-center justify-between rounded-xl bg-jejak-navy px-3 py-1.5 text-[11px] font-bold text-white"
            >
              <span>
                Your guess: <strong className="text-amber-300">{guessedLabourPct}%</strong> · Actual estimate:{" "}
                <strong className="text-jejak-materials">{labour.pct.mid}%</strong>
              </span>
              <span className="text-[10px] text-white/65">
                {Math.abs(guessedLabourPct - labour.pct.mid) <= 3
                  ? "🎯 Spot on!"
                  : guessedLabourPct > labour.pct.mid
                  ? `${(guessedLabourPct - labour.pct.mid).toFixed(1)}% less than guessed`
                  : "Closer than most!"}
              </span>
            </motion.div>
          )}

          {/* Price slider drawer */}
          <AnimatePresence>
            {editingPrice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-2xl frosted p-3">
                  <div className="flex items-center justify-between text-xs font-bold text-jejak-navy">
                    <span>Slide what you paid</span>
                    {customPrice != null && (
                      <button
                        type="button"
                        onClick={() => setCustomPrice(null)}
                        className="text-[11px] font-bold text-jejak-navy/55 underline no-tap"
                      >
                        Reset ({formatMoney(basePrice, currency)})
                      </button>
                    )}
                  </div>
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={basePrice < 10 ? 0.25 : 1}
                    value={price}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
                    className="mt-1.5 w-full accent-jejak-navy cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <CoachmarkPill
          id="split_receipt"
          stepBadge="Layer 2 · Cost Split"
          text="Tap any colour block below to inspect its basis — or open 'Flow & Cause' to send an optional demo testnet donation."
        />

        {/* Interactive Scrubbable 5-Category Bar (always visible anchor) */}
        <div className="mt-3">
          <StackedBar
            split={split}
            currency={currency}
            onInspectCategory={(key) => setDetailCategory(key)}
          />
        </div>

        {/* 3-Tab Progressive Disclosure Lens Switcher */}
        <div className="mt-3.5 grid grid-cols-3 gap-1 rounded-2xl bg-white/60 p-1 border border-white/80">
          {LENS_TABS.map(({ id, label, icon: Icon }) => {
            const active = activeLens === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  vibrate(6);
                  setActiveLens(id);
                }}
                className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition-colors no-tap ${
                  active ? "text-white" : "text-jejak-navy/65 hover:text-jejak-navy"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="receiptLensPill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-jejak-navy shadow-sm"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <Icon size={13} /> {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Lens Stage (cross-fades instead of stacking everything vertically) */}
        <div className="mt-3">
          {activeLens === "coins" && (
              <motion.div
                key={`coins-${compareMode}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-2.5"
              >
                <CoinDrop split={split} />

                {/* Compact Direct/Transparent Brand flip toggle */}
                <div className="flex items-center justify-between rounded-2xl frosted px-3.5 py-2.5 border border-white/80">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-jejak-navy">
                      {compareMode
                        ? `Direct model: ${product.transparentAlternative.split.labour.pct.mid}% reaches makers`
                        : "Compare with a transparent direct brand"}
                    </p>
                    <p className="text-[10px] font-semibold text-jejak-navy/55 tabular-nums">
                      {perUnit.midLabel} per {currency === "SGD" ? "S$1" : "£1"} · range {labour.pct.low}–{labour.pct.high}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowNotePopover((v) => !v)}
                      aria-label="Methodology note"
                      className="text-jejak-navy/45 hover:text-jejak-navy no-tap"
                    >
                      <HelpCircle size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        vibrate(8);
                        setCompareMode(!compareMode);
                      }}
                      aria-pressed={compareMode}
                      className="relative h-6 w-11 rounded-full transition-colors no-tap"
                      style={{ background: compareMode ? "#2FBF71" : "#D9DBE8" }}
                    >
                      <motion.span
                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                        animate={{ left: compareMode ? 22 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showNotePopover && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-[11px] text-jejak-navy/70">
                        <span>
                          100 coins = 100% of shelf price. Fair pay is a top driver of willingness to pay (McKinsey).
                        </span>
                        <ConfidenceBadge level={labour.confidence} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeLens === "flow" && (
              <motion.div
                key="flow"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <MakerBridgeCard
                  price={price}
                  currency={currency}
                  labourPct={labour.pct.mid}
                  labourAmount={labour.amount}
                  transparentLabourAmount={transparentLabourAmt}
                />
              </motion.div>
            )}

          {activeLens === "context" && (
            <motion.div
              key="context"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MetricsCarousel metrics={metrics} />
            </motion.div>
          )}
        </div>

        {/* Social + Stellar On-Chain Estimate Record bar */}
        <div className="mt-3 rounded-2xl frosted p-3 border border-white/80">
          {anchoredEstimate ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <p className="font-extrabold text-jejak-navy">
                  Estimate record anchored on Stellar Testnet
                </p>
                <p className="font-mono text-[10px] text-jejak-navy/60 truncate">
                  Memo: {anchoredEstimate.memo} · Live in Explore feed
                </p>
              </div>
              <a
                href={anchoredEstimate.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-jejak-navy px-2.5 py-1 text-[10px] font-extrabold text-amber-300 no-tap"
              >
                Stellar.Expert ↗
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-jejak-navy">
                  Put this estimate record in the Explore room
                </p>
                <p className="text-[10px] font-semibold text-jejak-navy/60">
                  Posts an anonymous card to Explore with a Stellar Testnet memo hash
                </p>
              </div>
              <button
                type="button"
                disabled={anchoring}
                onClick={() => {
                  vibrate(8);
                  publishEstimateRecord("count");
                }}
                className="shrink-0 rounded-xl bg-jejak-navy px-3 py-1.5 text-[11px] font-extrabold text-amber-300 no-tap disabled:opacity-60"
              >
                {anchoring ? "Anchoring…" : "Anchor & Post"}
              </button>
            </div>
          )}
        </div>

        <ShareReceipt />

        <motion.button
          type="button"
          onClick={() => {
            vibrate(10);
            reset();
          }}
          whileTap={TAP}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-sunrise py-3.5 text-sm font-extrabold text-white no-tap shadow-lg"
        >
          <Camera size={18} /> Trace another product
        </motion.button>
      </div>
    </ScreenShell>
  );
}
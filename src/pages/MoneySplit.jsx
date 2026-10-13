import React, { useEffect, useRef } from "react";
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
import TodaySnapPulse from "@/components/TodaySnapPulse";
import { celebrate } from "@/lib/celebrate";
import { vibrate, coinClink } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { ArrowLeft, Info, Camera } from "lucide-react";

export default function MoneySplit() {
  const { product, market, currency, setScreen, compareMode, setCompareMode, setDetailCategory, addTrace, photoFile, shareMode, setShareMode, reset } = useApp();
  const reduce = useReducedMotion();
  const price = product.markets[market].price;
  const split = computeSplit(product, market, compareMode ? "transparent" : "split");
  const labour = split.find((s) => s.key === "labour");
  const metrics = buildMetrics(product, market, currency);
  const perUnit = labourPerUnit(
    compareMode ? product.transparentAlternative.split : product.split,
    currency
  );
  const routeLen = (product.route?.length || 0) + 1;

  // Personal impact line — emotional, not just a chart.
  const stdLabourAmt = computeSplit(product, market, "split").find((s) => s.key === "labour").amount;
  const impactLine = `Of ${formatMoney(price, currency)}, about ${formatMoney(labour.amount, currency)} reached the people who made this.`;
  const stdImpact = `A transparent brand would send about ${formatMoney(stdLabourAmt, currency)} their way.`;

  // Celebrate the first trace of this product.
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    addTrace(labour.amount, routeDistance(product, market));
    vibrate([0, 12, 30, 12]);
    coinClink();
    if (!reduce) {
      const t = setTimeout(celebrate, 350);
      return () => clearTimeout(t);
    }
  }, [reduce]);

  // Persist this trace to the community feed/tally when opted in ('count' or 'feed').
  // In 'count' mode, no photo is uploaded — only an anonymous product count is recorded.
  // In 'feed' mode, the photo is uploaded publicly when available.
  const savedScan = useRef(false);
  useEffect(() => {
    if (savedScan.current || shareMode === "private") return;
    savedScan.current = true;
    let cancelled = false;
    (async () => {
      try {
        let photo_url = "";
        if (shareMode === "feed" && photoFile) {
          const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: photoFile });
          photo_url = file_url;
        }
        if (cancelled) return;
        const route = getRoute(product, market);
        await base44.entities.Scan.create({
          product_id: product.id,
          product_name: product.name,
          emoji: product.emoji,
          origin: route[0]?.country || "Unknown",
          labour_pct: labour.pct.mid,
          price: product.markets[market].price,
          currency,
          market,
          photo_url,
          confidence: labour.confidence,
        });
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareMode]);

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setScreen("journey")}
            className="flex items-center gap-1 text-sm font-bold text-jejak-navy/70 no-tap"
          >
            <ArrowLeft size={16} /> Route
          </button>
          <p className="text-xs font-bold uppercase tracking-wide text-jejak-navy/50">Money split</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <p className="text-sm font-semibold text-jejak-navy/60">{product.name} · {product.markets[market].retailer}</p>
          <p className="text-4xl font-extrabold text-jejak-navy">{formatMoney(price, currency)}</p>
          <p className="text-xs text-jejak-navy/50">Estimated · shown as a range · 100 coins = 100% of the price</p>
        </motion.div>

        <div className="mt-3">
          <TodaySnapPulse
            product={product}
            shareMode={shareMode}
            setShareMode={setShareMode}
          />
        </div>

        {/* Compare toggle */}
        <motion.button
          type="button"
          onClick={() => setCompareMode(!compareMode)}
          whileTap={TAP}
          className="mt-4 flex items-center justify-between rounded-2xl frosted p-4 no-tap"
          aria-pressed={compareMode}
        >
          <div className="text-left">
            <p className="text-sm font-extrabold text-jejak-navy">What if you bought direct from a transparent brand?</p>
            <p className="text-xs text-jejak-navy/55">Illustrative scenario — not a specific real brand</p>
          </div>
          <span
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{ background: compareMode ? "#2FBF71" : "#D9DBE8" }}
          >
            <motion.span
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
              animate={{ left: compareMode ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          </span>
        </motion.button>

        <AnimatePresence mode="wait">
          <motion.div
            key={compareMode ? "transparent" : "standard"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <CoinDrop split={split} />
          </motion.div>
        </AnimatePresence>

        <div className="mt-5">
          <StackedBar split={split} currency={currency} />
        </div>

        {/* Headline garment-worker share */}
        <div className="mt-4 rounded-2xl frosted p-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-jejak-navy/50">Estimated garment-worker share</p>
            <ConfidenceBadge level={labour.confidence} />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-jejak-navy">
            {perUnit.lowLabel} – {perUnit.highLabel}
            <span className="text-base font-bold text-jejak-navy/60"> per {currency === "SGD" ? "S$1" : "£1"}</span>
          </p>
          <p className="text-xs text-jejak-navy/55">
            Mid estimate: <strong>{perUnit.midLabel}</strong> · range {labour.pct.low}–{labour.pct.high}%
          </p>
        </div>

        {/* Personal impact line */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg,#FF8A6522,#FF3D8122)", border: "1px solid #FF8A6555" }}
        >
          <p className="text-sm font-extrabold leading-snug text-jejak-navy">{impactLine}</p>
          <p className="mt-1 text-xs font-semibold text-jejak-navy/65">{stdImpact}</p>
          <p className="mt-2 text-[11px] font-semibold text-jejak-navy/55">
            Fair pay is one of the strongest reasons consumers say they'll pay more. <span className="text-jejak-navy/40">Source: McKinsey</span>
          </p>
        </motion.div>

        {/* Impact metrics carousel */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-jejak-navy/50">More to this receipt</p>
          <MetricsCarousel metrics={metrics} />
        </div>

        {/* Compare summary */}
        <AnimatePresence>
          {compareMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl frosted p-3">
                  <p className="text-[11px] font-bold uppercase text-jejak-navy/50">Standard</p>
                  <p className="mt-1 text-lg font-extrabold text-jejak-navy">7.5%</p>
                  <p className="text-[11px] text-jejak-navy/55">labour share</p>
                  <p className="mt-1 text-xs font-bold text-jejak-navy/70">{routeLen} stops · 4 intermediaries</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: "#2FBF7115", border: "1px solid #2FBF7155" }}>
                  <p className="text-[11px] font-bold uppercase text-jejak-materials">Transparent</p>
                  <p className="mt-1 text-lg font-extrabold text-jejak-navy">{product.transparentAlternative.split.labour.pct.mid}%</p>
                  <p className="text-[11px] text-jejak-navy/55">labour share</p>
                  <p className="mt-1 text-xs font-bold text-jejak-navy/70">shorter route · 2 intermediaries</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex items-center gap-2 text-xs text-jejak-navy/50">
          <Info size={13} /> Tap any column for detail. Every figure is an estimate.
        </div>

        {/* Tap targets over columns (rendered as a row of buttons) */}
        <div className="mt-3 grid grid-cols-5 gap-2">
          {split.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setDetailCategory(cat.key)}
              className="rounded-xl frosted py-2 text-[10px] font-bold no-tap"
              style={{ color: cat.color }}
              aria-label={`Open ${cat.label} detail`}
            >
              {cat.label.split(" ")[0]}
            </button>
          ))}
        </div>

        <ShareReceipt />

        <motion.button
          type="button"
          onClick={() => { vibrate(10); reset(); }}
          whileTap={TAP}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-sunrise py-3.5 text-sm font-extrabold text-white no-tap shadow-lg"
        >
          <Camera size={18} /> Trace another product
        </motion.button>
      </div>
    </ScreenShell>
  );
}
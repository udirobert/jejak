import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { computeSplit, formatMoney, labourPerUnit, getRoute } from "@/lib/money";
import { buildMetrics, routeDistance } from "@/lib/metrics";
import ScreenShell from "@/components/ScreenShell";
import CoinDrop from "@/components/CoinDrop";
import ShareReceipt from "@/components/ShareReceipt";
import Receipt from "@/components/journal/Receipt";
import MarginNote from "@/components/journal/MarginNote";
import JournalButton from "@/components/journal/JournalButton";
import ProofDrawer from "@/components/journal/ProofDrawer";
import StoryCard from "@/components/journal/StoryCard";
import AskBrandSheet from "@/components/journal/AskBrandSheet";
import { useSaveTrace } from "@/lib/saveTrace";
import { useAuth } from "@/lib/AuthContext";
import { celebrate } from "@/lib/celebrate";
import { vibrate, coinClink } from "@/lib/haptics";
import { ChevronLeft } from "lucide-react";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };
const RECEIPT_LABELS = {
  materials: "Materials",
  labour: "The people who made it",
  freight: "Freight & duties",
  brand: "Brand",
  retail: "Shop",
};
const CAT_INK = {
  materials: "var(--j-materials)",
  labour: "var(--j-labour)",
  freight: "var(--j-freight)",
  brand: "var(--j-brand)",
  retail: "var(--j-retail)",
};

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
    setShareMode,
    customPrice,
    setCustomPrice,
    guessedLabourPct,
    setGuessedLabourPct,
    labelEvidence,
    provenanceRecord,
    reset,
  } = useApp();
  const [guess, setGuess] = useState(15);
  const [proofOpen, setProofOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const { isAuthenticated, savedScanId, ensureSaved, setVisibility } = useSaveTrace();
  const { navigateToLogin } = useAuth();

  const reduce = useReducedMotion();
  const basePrice = product?.markets?.[market]?.price ?? 0;
  const price = customPrice != null && customPrice > 0 ? customPrice : basePrice;
  const minPrice = Math.max(1, Math.round(basePrice * 0.3));
  const maxPrice = Math.round(basePrice * 3);
  const split = product ? computeSplit(product, market, compareMode ? "transparent" : "split", price) : [];
  const labour = split.find((s) => s.key === "labour") || { pct: { low: 0, mid: 0, high: 0 }, amount: 0, confidence: "low", basis: "" };
  const metrics = product ? buildMetrics(product, market, currency, price) : [];
  const perUnit = product
    ? labourPerUnit(compareMode ? product.transparentAlternative.split : product.split, currency)
    : { midLabel: "" };
  const route = product ? getRoute(product, market) : [];
  const originCountry = route[0]?.country || "Origin";
  const revealed = guessedLabourPct != null;
  const guessedAmount = (price * (guessedLabourPct ?? guess)) / 100;

  // Celebrate the first trace of this product & stamp origin into the journal.
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current || !product) return;
    celebrated.current = true;
    addTrace(labour.amount, routeDistance(product, market), originCountry);
    vibrate([0, 12, 30, 12]);
    coinClink();
    if (!reduce) {
      const t = setTimeout(celebrate, 350);
      return () => clearTimeout(t);
    }
  }, [reduce]);

  // Save this trace once on reveal; anchor data lands as an update on the
  // same record when the user anchors via the ProofDrawer.
  useEffect(() => {
    if (revealed) ensureSaved();
  }, [revealed, ensureSaved]);

  useEffect(() => {
    if (!savedScanId || !provenanceRecord?.txHash) return;
    base44.entities.Scan.update(savedScanId, {
      stellar_tx_hash: provenanceRecord.txHash,
      stellar_ledger: Number(provenanceRecord.ledger) || 0,
      record_sha256: provenanceRecord.recordHashHex || "",
      canonical_json: provenanceRecord.canonicalJson || "",
      stellar_memo: provenanceRecord.recordHashHex ? `SHA256:${provenanceRecord.recordHashHex.slice(0, 12)}` : "",
    }).catch(() => {});
  }, [savedScanId, provenanceRecord]);

  const routeCodes = route.map((st) => st.code || st.country?.slice(0, 2).toUpperCase()).filter(Boolean).join(" → ");

  if (!product) {
    setScreen("home");
    return null;
  }

  const receiptLines = split.map((s) => ({
    key: s.key,
    label: RECEIPT_LABELS[s.key],
    amount: s.amount,
    sub: `${formatMoney(s.amountLow, currency)}–${formatMoney(s.amountHigh, currency)}`,
    color: CAT_INK[s.key],
  }));

  const guessNote = revealed
    ? `you guessed ${formatMoney(guessedAmount, currency)}`
    : "have a guess first";

  return (
    <ScreenShell section="Trace · where the money went">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-6 lg:px-10 lg:pt-10">
        <button
          type="button"
          onClick={() => setScreen("journey")}
          className="flex min-h-[44px] items-center gap-1 font-grotesk text-sm font-medium text-journal-ink-soft no-tap hover:text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
        >
          <ChevronLeft size={16} /> The journey
        </button>
        <button
          type="button"
          onClick={() => setProofOpen(true)}
          className="inline-flex min-h-[44px] rotate-[-3deg] flex-col items-center justify-center border-[1.5px] border-journal-stamp px-3 py-1.5 font-plexmono text-journal-stamp shadow-[inset_0_0_0_1.5px_var(--j-card),inset_0_0_0_3px_var(--j-stamp)] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
          aria-label="Open proof record"
        >
          <span className="text-[9px] uppercase tracking-[0.08em]">Open</span>
          <span className="text-[12px] font-medium uppercase tracking-[0.08em]">Proof</span>
        </button>
      </div>

      <div className="mt-4 grid gap-10 px-5 pb-12 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:px-10">
        {/* Receipt */}
        <div>
          <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
            The honest maths
          </p>
          <h1 className="mt-2 font-serif-display text-4xl leading-[1.05] text-journal-ink md:text-5xl" style={displayFont}>
            Where your {formatMoney(price, currency, { minDigits: 0, maxDigits: 0 })} went
          </h1>
          <p className="mt-3 max-w-md font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
            {product.name} · {product.markets[market].retailer} · every figure is a range with a confidence level.
          </p>

          {revealed ? (
            <div className="relative mt-6">
              <Receipt
                title={compareMode ? "Jejak field receipt · a fairer version" : "Jejak field receipt"}
                lines={receiptLines}
                total={price}
                currency={currency}
                highlightKey="labour"
                highlightNote={`${formatMoney(labour.amount, currency)} to the people who sewed it · ${guessNote}`}
                onLineClick={(key) => setDetailCategory(key)}
                className="w-full max-w-md shadow-[0_16px_36px_-16px_rgba(30,27,22,0.3)]"
              />
              <p className="mt-3 font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
                tap a line for its basis
              </p>
              <div className="mt-5 max-w-md">
                <StoryCard
                  scanId={savedScanId}
                  productName={product.name}
                  routeCodes={routeCodes}
                  labourLine={`≈ ${formatMoney(labour.amount, currency)} to the people who made it`}
                  currency={currency}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 max-w-md border border-journal-rule bg-journal-card p-5 shadow-[0_10px_30px_-16px_rgba(30,27,22,0.3)]">
              <p className="font-serif-display text-2xl text-journal-ink" style={displayFont}>
                Guess first
              </p>
              <p className="mt-1 font-grotesk text-sm text-journal-ink-soft">
                How much of your {formatMoney(price, currency, { minDigits: 0, maxDigits: 0 })} reached the people who made it?
              </p>
              <input
                type="range"
                min={1}
                max={40}
                step={1}
                value={guess}
                onChange={(e) => { vibrate(4); setGuess(Number(e.target.value)); }}
                aria-label="Guess the maker share percent"
                className="mt-4 w-full cursor-pointer accent-journal-stamp"
              />
              <div className="mt-1 flex justify-between font-plexmono text-[10px] text-journal-ink-soft">
                <span>1%</span>
                <span className="font-medium text-journal-stamp">{guess}% · ≈{formatMoney((price * guess) / 100, currency)}</span>
                <span>40%</span>
              </div>
              <div className="mt-4">
                <JournalButton onClick={() => { vibrate(10); setGuessedLabourPct(guess); }}>
                  Reveal the split
                </JournalButton>
              </div>
            </div>
          )}
        </div>

        {/* Actions / notes */}
        <div className="space-y-8">
          {/* Compare segmented control */}
          <div>
            <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">Compare</p>
            <div className="mt-2 inline-flex border border-journal-rule bg-journal-card p-0.5" role="group" aria-label="Compare split scenario">
              {[
                { id: false, label: "As sold" },
                { id: true, label: "A fairer version" },
              ].map((t) => (
                <button
                  key={String(t.id)}
                  type="button"
                  onClick={() => { vibrate(6); setCompareMode(t.id); }}
                  aria-pressed={compareMode === t.id}
                  className={`min-h-[44px] px-4 py-2 font-grotesk text-sm no-tap focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp ${
                    compareMode === t.id
                      ? "bg-journal-ink font-medium text-journal-paper"
                      : "text-journal-ink-soft hover:text-journal-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
              {perUnit.midLabel} per {currency === "SGD" ? "S$1" : "£1"} to makers · range {labour.pct.low}–{labour.pct.high}%
            </p>
            {compareMode && (
              <p className="mt-1 font-grotesk text-[12px] text-journal-ink-soft">
                {product.transparentAlternative.note}
              </p>
            )}
          </div>

          {/* Adjust what you paid */}
          <div>
            <button
              type="button"
              onClick={() => setEditingPrice((v) => !v)}
              className="font-grotesk text-sm font-medium text-journal-ink underline decoration-journal-stamp underline-offset-4 no-tap focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
            >
              {editingPrice ? "Done" : `Paid something else? Adjust ${formatMoney(basePrice, currency, { minDigits: 0, maxDigits: 0 })}`}
            </button>
            {editingPrice && (
              <div className="mt-3 max-w-md border border-journal-rule bg-journal-card p-4">
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step={basePrice < 10 ? 0.25 : 1}
                  value={price}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
                  aria-label="Adjust the price you paid"
                  className="w-full cursor-pointer accent-journal-stamp"
                />
                <div className="mt-1 flex justify-between font-plexmono text-[10px] text-journal-ink-soft">
                  <span>{formatMoney(minPrice, currency, { minDigits: 0, maxDigits: 0 })}</span>
                  <span className="font-medium text-journal-ink">{formatMoney(price, currency)}</span>
                  <span>{formatMoney(maxPrice, currency, { minDigits: 0, maxDigits: 0 })}</span>
                </div>
                {customPrice != null && (
                  <button
                    type="button"
                    onClick={() => setCustomPrice(null)}
                    className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft underline no-tap"
                  >
                    Reset to {formatMoney(basePrice, currency)}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Margin notes — metric cards */}
          <div>
            <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">Margin notes</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {metrics.map((m) => (
                <div key={m.key} className="border border-journal-rule bg-journal-card p-3.5">
                  <p className="font-plexmono text-[9px] uppercase tracking-[0.14em] text-journal-ink-soft">{m.label}</p>
                  <p className="mt-1.5 font-serif-display text-2xl leading-none text-journal-ink" style={displayFont}>{m.value}</p>
                  <p className="mt-1.5 font-grotesk text-[12px] leading-snug text-journal-ink-soft">{m.everyday}</p>
                  <p className="mt-2 border-t border-dotted border-journal-rule pt-1.5 font-plexmono text-[9px] uppercase tracking-[0.08em] text-journal-ink-soft">
                    {m.source} · {m.basis}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CoinDrop — secondary interaction */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">
                Drop the 100 coins
              </p>
              <MarginNote tone="ink">each coin = 1% of the price</MarginNote>
            </div>
            <div className="mt-3 border border-journal-rule bg-journal-card p-4">
              <CoinDrop split={split} />
            </div>
          </div>

          {/* Share to Atlas + share image */}
          <div className="border-t border-journal-rule pt-5">
            {!isAuthenticated ? (
              <div className="border border-journal-rule bg-journal-card p-4">
                <p className="font-serif-display text-xl text-journal-ink" style={displayFont}>Keep this entry</p>
                <p className="mt-1 font-grotesk text-sm text-journal-ink-soft">Sign in to keep this entry — we'll write its story for you.</p>
                <div className="mt-3"><JournalButton onClick={navigateToLogin}>Sign in</JournalButton></div>
              </div>
            ) : (
            <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="font-grotesk text-sm font-medium text-journal-ink">Add this to the public Atlas</span>
                <span className="block font-grotesk text-[12px] text-journal-ink-soft">Anonymised — just this estimate, no photo needed.</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={shareMode !== "private"}
                onClick={() => { vibrate(6); setShareMode(shareMode === "private" ? "count" : "private"); setVisibility(shareMode === "private"); }}
                className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors no-tap focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp ${
                  shareMode !== "private" ? "border-journal-ink bg-journal-ink" : "border-journal-rule bg-journal-card"
                }`}
              >
                <motion.span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-journal-paper shadow"
                  animate={{ left: shareMode !== "private" ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              </button>
            </label>
            )}
            <div className="mt-4">
              <ShareReceipt />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-journal-rule pt-5">
            <JournalButton onClick={() => { vibrate(10); reset(); }}>Trace another thing</JournalButton>
            <JournalButton variant="secondary" onClick={() => setProofOpen(true)}>Open the proof</JournalButton>
            <JournalButton variant="secondary" onClick={() => setAskOpen(true)}>Ask the brand</JournalButton>
          </div>
        </div>
      </div>

      <ProofDrawer open={proofOpen} onOpenChange={setProofOpen} />
      <AskBrandSheet open={askOpen} onClose={() => setAskOpen(false)} product={product} />
    </ScreenShell>
  );
}

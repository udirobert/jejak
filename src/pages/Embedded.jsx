import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import { computeSplit, formatMoney, getRoute } from "@/lib/money";
import ScreenShell from "@/components/ScreenShell";
import ProductIllustrationIcon from "@/components/explore/ProductIllustrationIcon";
import TraceDetailSheet from "@/components/explore/TraceDetailSheet";
import { FLAGS } from "@/components/explore/exploreUtils";
import { ArrowDownLeft, Info, X } from "lucide-react";
import { vibrate } from "@/lib/haptics";

const FEED = [
  {
    id: "bank-coffee",
    merchant: "Roastery & Co",
    amount: -3.8,
    date: "08:42",
    cat: "Coffee",
    productId: "coffee",
    origin: "Ethiopia",
    basis: "Declared",
    label_materials: "100% Washed Yirgacheffe Arabica",
    created_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    stellar_tx_hash:
      "50fe66627725987e54dbaf1e6ccedd2c2564c8b36f4a19ce2afb3a1659b98391",
    stellar_ledger: 5181004,
    record_sha256:
      "1633940c8a37c623b1fbd54562aaf93e635212ac137d1e2188e03b877717baee",
    canonical_json: JSON.stringify({
      schema_version: "jejak.provenance.v1",
      record_type: "anchored_record_of_an_estimate",
      trace_id: "6ace8519301042fef8dd94e9",
      product_category: "coffee",
      product_name: "Coffee Bag",
      origin: "Ethiopia",
      materials: "100% Washed Yirgacheffe Arabica",
      basis: "Declared",
      market: "GB",
      price: 9.5,
      currency: "GBP",
      estimated_labour_pct: 12,
      timestamp: "2026-10-13T19:23:05Z",
    }),
  },
  {
    id: "bank-hoodie",
    merchant: "Everyday Hoodie",
    amount: -45.0,
    date: "13:15",
    cat: "Apparel",
    productId: "hoodie",
    origin: "Bangladesh",
    basis: "Read from label",
    label_materials: "80% cotton, 20% recycled poly",
    created_date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    stellar_tx_hash:
      "1f79236227dc9771d42d9033b7979629f471d7fbc085911d835252dd81fa8bee",
    stellar_ledger: 5180990,
    record_sha256:
      "1f323b7eb9e6cd2a1764597b5cbfe499de8b15813f5611fe39c72475e71f43c4",
    canonical_json: JSON.stringify({
      schema_version: "jejak.provenance.v1",
      record_type: "anchored_record_of_an_estimate",
      trace_id: "6ace8519301042fef8dd94e7",
      product_category: "hoodie",
      product_name: "Everyday Hoodie",
      origin: "Bangladesh",
      materials: "80% cotton, 20% recycled poly",
      basis: "Read from label",
      market: "GB",
      price: 45,
      currency: "GBP",
      estimated_labour_pct: 7.5,
      timestamp: "2026-10-13T19:23:05Z",
    }),
  },
  {
    id: "bank-trainers",
    merchant: "RunLab Footwear",
    amount: -95.0,
    date: "Yesterday",
    cat: "Footwear",
    productId: "trainers",
    origin: "Vietnam",
    basis: "Estimated",
    label_materials: "Knit mesh & EVA sole",
    created_date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    stellar_tx_hash:
      "5d415ded4cc4d60ac387a3f6cb95f60abb6aeea635767c51f559da4e1f91c1a4",
    stellar_ledger: 5181003,
    record_sha256:
      "838428005562491739d866044f833e24f68c832cd506eacd2ab42a3b483d6fd7",
    canonical_json: JSON.stringify({
      schema_version: "jejak.provenance.v1",
      record_type: "anchored_record_of_an_estimate",
      trace_id: "6ace8519301042fef8dd94e8",
      product_category: "trainers",
      product_name: "Running Trainers",
      origin: "Vietnam",
      materials: "Knit mesh & EVA sole",
      basis: "Estimated",
      market: "GB",
      price: 95,
      currency: "GBP",
      estimated_labour_pct: 5,
      timestamp: "2026-10-13T19:23:05Z",
    }),
  },
  {
    id: "bank-case",
    merchant: "CaseCraft Studio",
    amount: -25.0,
    date: "2d ago",
    cat: "Accessories",
    productId: "phone_case",
    origin: "China",
    basis: "Estimated",
    label_materials: "Moulded TPU",
    created_date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    stellar_tx_hash: "",
    stellar_ledger: 0,
    record_sha256: "",
    canonical_json: "",
  },
  {
    id: "bank-salary",
    merchant: "Salary Deposit",
    amount: 2400.0,
    date: "3d ago",
    cat: "Income",
  },
];

const WEEK_COUNTRIES = [
  "Ethiopia",
  "Bangladesh",
  "Vietnam",
  "China",
  "India",
  "Netherlands",
];

export default function Embedded() {
  const {
    currency,
    market,
    setProduct,
    setScreen,
    setCustomPrice,
    setCompareMode,
    setLowConfidence,
  } = useApp();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [selectedScan, setSelectedScan] = useState(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  const fxMult = currency === "SGD" ? 1.72 : 1;
  const displayBalance = +(2144.51 * fxMult).toFixed(2);

  const openDetailForTx = (tx) => {
    const prod = tx.productId ? getProduct(tx.productId) : null;
    if (!prod) return;
    vibrate(6);
    const price = +(Math.abs(tx.amount) * fxMult).toFixed(2);
    const split = computeSplit(prod, market, "split", price);
    const labour = split.find((s) => s.key === "labour");

    setSelectedScan({
      id: tx.id,
      product_id: prod.id,
      product_name: prod.name,
      origin: tx.origin,
      labour_pct: labour?.pct?.mid || 7.5,
      price,
      currency,
      market,
      basis: tx.basis,
      label_materials: tx.label_materials,
      created_date: tx.created_date,
      stellar_tx_hash: tx.stellar_tx_hash,
      stellar_ledger: tx.stellar_ledger,
      record_sha256: tx.record_sha256,
      canonical_json: tx.canonical_json,
      sample_entry: false,
    });
  };

  const handleTraceProduct = (productId) => {
    vibrate(8);
    const prod = getProduct(productId) || getProduct("hoodie");
    const matchingTx = FEED.find((t) => t.productId === productId);
    setProduct(prod);
    if (matchingTx) {
      setCustomPrice(+(Math.abs(matchingTx.amount) * fxMult).toFixed(2));
    }
    setCompareMode(false);
    setLowConfidence(false);
    setScreen("journey");
    navigate("/");
  };

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pt-1 pb-6 space-y-3.5">
        {/* Top bar: small "Embedded concept" badge + ⓘ chip */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 border border-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-jejak-freight" />
            Embedded concept
          </span>

          <button
            type="button"
            onClick={() => {
              vibrate(5);
              setShowInfoSheet(true);
            }}
            aria-label="About embedded concept"
            className="inline-flex items-center gap-1 rounded-full bg-white/75 border border-white/90 px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy shadow-sm hover:bg-white no-tap"
          >
            <Info size={12} className="text-jejak-freight" />
            <span>Info</span>
          </button>
        </div>

        {/* Bright Bank Account Header: Balance + Provenance Summary + Row of Origin Flags */}
        <div className="rounded-3xl frosted-strong border border-white/90 p-5 shadow-md">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-jejak-navy/50">
            Current account
          </p>
          <p className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-jejak-navy tabular-nums">
            {formatMoney(displayBalance, currency)}
          </p>

          <div className="mt-3 pt-3 border-t border-jejak-navy/8 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-extrabold text-jejak-navy/80">
              This week: 4 purchases traced · 6 countries
            </p>
            <div className="flex items-center gap-1" aria-label="Traced countries">
              {WEEK_COUNTRIES.map((country) => (
                <span
                  key={country}
                  title={country}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/85 border border-jejak-navy/10 text-xs shadow-sm"
                >
                  {FLAGS[country] || "🌐"}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bright Bank Feed Rows */}
        <div className="rounded-3xl frosted-strong border border-white/90 overflow-hidden shadow-md divide-y divide-jejak-navy/8">
          {FEED.map((tx) => {
            const prod = tx.productId ? getProduct(tx.productId) : null;
            const rawPrice = +(Math.abs(tx.amount) * fxMult).toFixed(2);
            const split = prod
              ? computeSplit(prod, market, "split", rawPrice)
              : null;
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

            return (
              <div
                key={tx.id}
                role={prod ? "button" : undefined}
                tabIndex={prod ? 0 : undefined}
                onClick={() => {
                  if (prod) openDetailForTx(tx);
                }}
                onKeyDown={(e) => {
                  if (prod && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    openDetailForTx(tx);
                  }
                }}
                className={`px-4 py-3.5 transition-colors no-tap ${
                  prod
                    ? "cursor-pointer hover:bg-white/75 active:bg-white/90"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Illustrated product icon or neutral merchant avatar + Merchant name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {prod ? (
                      <ProductIllustrationIcon
                        productId={prod.id}
                        size="sm"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-jejak-materials/15 border border-jejak-materials/30 text-jejak-materials">
                        <ArrowDownLeft size={17} strokeWidth={2.4} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-jejak-navy truncate">
                        {tx.merchant}
                      </p>
                      <p className="text-[11px] font-semibold text-jejak-navy/50 truncate">
                        {tx.date} · {tx.cat}
                      </p>
                    </div>
                  </div>

                  {/* Right: "Trace" chip with origin flag(s) + Amount */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {prod && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailForTx(tx);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-jejak-navy/6 hover:bg-jejak-navy hover:text-white border border-jejak-navy/12 px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy transition-colors no-tap"
                      >
                        <span className="text-xs leading-none">
                          {routeFlags.map((c) => FLAGS[c] || "🌐").join("")}
                        </span>
                        <span>Trace</span>
                      </button>
                    )}

                    <span
                      className={`text-sm font-extrabold tabular-nums ${
                        tx.amount > 0
                          ? "text-jejak-materials"
                          : "text-jejak-navy"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : "-"}
                      {formatMoney(rawPrice, currency)}
                    </span>
                  </div>
                </div>

                {/* Optional thin 5-color split bar beneath traceable rows (no orange "est. maker" text) */}
                {split && (
                  <div className="mt-2 pl-12">
                    <div className="flex h-1 w-full overflow-hidden rounded-full bg-jejak-navy/8">
                      {split.map((seg) => (
                        <div
                          key={seg.key}
                          style={{
                            width: `${seg.pct.mid}%`,
                            background: seg.color,
                          }}
                          className="h-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Shared Trace Detail Bottom Sheet */}
        <TraceDetailSheet
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
          onTraceProduct={handleTraceProduct}
          reduce={reduce}
        />

        {/* Single-sentence ⓘ Concept Preview Sheet */}
        <AnimatePresence>
          {showInfoSheet && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-jejak-navy/40 backdrop-blur-sm"
                onClick={() => setShowInfoSheet(false)}
              />
              <motion.div
                className="relative w-full max-w-[420px] rounded-t-3xl frosted-strong p-5 pb-8"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-jejak-navy">
                    Embedded concept
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInfoSheet(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-jejak-navy/10 text-jejak-navy no-tap"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-2.5 text-xs font-semibold leading-relaxed text-jejak-navy/80">
                  Concept preview, not a live bank connection.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}
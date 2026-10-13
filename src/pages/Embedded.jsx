import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import { computeSplit, formatMoney, getRoute } from "@/lib/money";
import ScreenShell from "@/components/ScreenShell";
import Logo from "@/components/Logo";
import CurrencySwitch from "@/components/CurrencySwitch";
import JejakPassportCard from "@/components/JejakPassportCard";
import ProductIllustrationIcon from "@/components/explore/ProductIllustrationIcon";
import OriginFlagChip from "@/components/explore/OriginFlagChip";
import PersonalOriginMapHeader from "@/components/explore/PersonalOriginMapHeader";
import TraceDetailSheet from "@/components/explore/TraceDetailSheet";
import { ArrowDownLeft, Info, Landmark, X } from "lucide-react";
import { vibrate } from "@/lib/haptics";

// Each traced purchase has its own distinct canonical provenance record,
// SHA-256 hash, and Stellar Testnet transaction hash.
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
    stellar_tx_hash:
      "892b9d299032db32a61751c73e3260e85894912b2f1ce44eaddb2c9b525e6d54",
    stellar_ledger: 5181332,
    record_sha256:
      "b29d71731eb680f585554ddad02a103b31ea4bfe0ff8e30121ff52d7564d3c34",
    canonical_json:
      '{"schema_version":"jejak.provenance.v1","record_type":"anchored_record_of_an_estimate","trace_id":"bank-case-china","product_category":"phone_case","product_name":"Phone Case","origin":"China","materials":"Moulded TPU","basis":"Estimated","market":"GB","price":25,"currency":"GBP","estimated_labour_pct":4,"timestamp":"2026-10-13T19:25:00Z"}',
  },
  {
    id: "bank-salary",
    merchant: "Salary Deposit",
    amount: 2400.0,
    date: "3d ago",
    cat: "Income",
  },
];

const WEEK_ORIGINS = ["Ethiopia", "Bangladesh", "Vietnam", "China"];
const WEEK_ALL_COUNTRIES = [
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

  // In-memory state only ("Without Jejak | With Jejak" toggle, default With)
  const [withJejak, setWithJejak] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  const fxMult = currency === "SGD" ? 1.72 : 1;
  const displayBalance = +(2144.51 * fxMult).toFixed(2);

  const openDetailForTx = (tx) => {
    const prod = tx.productId ? getProduct(tx.productId) : null;
    if (!prod || !withJejak) return;
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
    <ScreenShell variant="host-bank" header={false}>
      <div className="flex flex-1 flex-col px-5 pt-5 pb-6 space-y-3.5">
        {/* Fictional "Demo Bank" Host Header + Single Merged "Embedded concept ⓘ" Badge */}
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Landmark size={16} strokeWidth={2.2} />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              Demo Bank
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <CurrencySwitch />
            <button
              type="button"
              onClick={() => {
                vibrate(5);
                setShowInfoSheet(true);
              }}
              aria-label="About embedded concept"
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <span>Concept</span>
              <Info size={13} className="text-slate-500" />
            </button>
          </div>
        </header>

        {/* "Without Jejak | With Jejak" Toggle (in-memory state only, default With) */}
        <div
          role="group"
          aria-label="Jejak integration toggle"
          className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/75 p-1 border border-slate-200"
        >
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              setWithJejak(false);
            }}
            aria-pressed={!withJejak}
            className={`rounded-xl py-1.5 text-xs font-bold transition-all no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              !withJejak
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Without Jejak
          </button>
          <button
            type="button"
            onClick={() => {
              vibrate(5);
              setWithJejak(true);
            }}
            aria-pressed={withJejak}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-extrabold transition-all no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy ${
              withJejak
                ? "bg-white text-jejak-navy shadow-sm ring-1 ring-jejak-gold/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Logo size={16} />
            <span>With Jejak</span>
          </button>
        </div>

        {/* Neutral Host Bank Balance Card + Personal Origin-Arc Map Header (when With Jejak) */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current account
              </p>
              <p className="mt-0.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {formatMoney(displayBalance, currency)}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
              {market === "SG" ? "Demo SG · 000-000" : "Demo UK · 00-00-00"}
            </span>
          </div>

          <AnimatePresence initial={false}>
            {withJejak && (
              <PersonalOriginMapHeader
                key="personal-map"
                origins={WEEK_ORIGINS}
                allCountries={WEEK_ALL_COUNTRIES}
                homeCountry={
                  market === "SG" ? "Singapore" : "United Kingdom"
                }
                reduce={reduce}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Passkey Smart Account ("Jejak Passport") for Bank controls & spending-limit policy */}
        <JejakPassportCard variant="bank" />

        {/* Host Bank Transaction Feed */}
        <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm divide-y divide-slate-100">
          {FEED.map((tx, rowIdx) => {
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
                  if (isInteractive) openDetailForTx(tx);
                }}
                onKeyDown={(e) => {
                  if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    openDetailForTx(tx);
                  }
                }}
                className={`px-4 py-3.5 transition-colors no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 ${
                  isInteractive
                    ? "cursor-pointer hover:bg-slate-50/90 active:bg-slate-100/70"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  {/* Left: Shared ProductIllustrationIcon or neutral merchant avatar */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {prod ? (
                      <ProductIllustrationIcon
                        productId={prod.id}
                        size="sm"
                      />
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

                  {/* Right: Hero Jejak "Trace" Chip (animates in row-by-row when With Jejak) + Amount */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <AnimatePresence>
                      {prod && withJejak && (
                        <motion.div
                          key={`chip-${tx.id}`}
                          initial={
                            reduce
                              ? false
                              : { opacity: 0, scale: 0.82, x: 8 }
                          }
                          animate={
                            reduce
                              ? { opacity: 1, scale: 1, x: 0 }
                              : {
                                  opacity: 1,
                                  scale: [0.85, 1.06, 1],
                                  x: 0,
                                }
                          }
                          exit={
                            reduce
                              ? undefined
                              : { opacity: 0, scale: 0.85, x: 6 }
                          }
                          transition={{
                            duration: reduce ? 0 : 0.38,
                            delay: reduce ? 0 : rowIdx * 0.08,
                            ease: "easeOut",
                          }}
                        >
                          <OriginFlagChip
                            countries={routeFlags}
                            variant="jejak-hero"
                            size="md"
                            labelOverride="Trace"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailForTx(tx);
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <span
                      className={`text-sm font-extrabold tabular-nums ${
                        tx.amount > 0
                          ? "text-emerald-600"
                          : "text-slate-900"
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
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setShowInfoSheet(false)}
              />
              <motion.div
                className="relative w-full max-w-[420px] rounded-t-3xl bg-white border-t border-slate-200 p-5 pb-8 shadow-2xl"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Embedded concept
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInfoSheet(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 no-tap"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-2.5 text-xs font-medium leading-relaxed text-slate-600">
                  Concept preview with a fictional bank. Not a live bank
                  connection.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}
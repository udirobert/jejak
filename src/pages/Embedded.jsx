import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import { computeSplit } from "@/lib/money";
import { CANONICAL_PASSKEY_RP_ID } from "@/lib/stellarConfig";
import ScreenShell from "@/components/ScreenShell";
import Logo from "@/components/Logo";
import CurrencySwitch from "@/components/CurrencySwitch";
import BankMergedHeroCard from "@/components/bank/BankMergedHeroCard";
import BankTransactionsSheet from "@/components/bank/BankTransactionsSheet";
import BankSpendLimitSheet from "@/components/bank/BankSpendLimitSheet";
import JejakPassportSheet from "@/components/JejakPassportSheet";
import TraceDetailSheet from "@/components/explore/TraceDetailSheet";
import { Info, Landmark, X } from "lucide-react";
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

export default function Embedded() {
  const {
    currency,
    market,
    walletSession,
    setProduct,
    setScreen,
    setCustomPrice,
    setCompareMode,
    setLowConfidence,
  } = useApp();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [withJejak, setWithJejak] = useState(true);
  const [sheetSnap, setSheetSnap] = useState("half"); // 'peek' | 'half' | 'full'
  const [selectedScan, setSelectedScan] = useState(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [passportSheetOpen, setPassportSheetOpen] = useState(false);
  const [passportPromptReason, setPassportPromptReason] = useState(null);
  const [spendLimitSheetOpen, setSpendLimitSheetOpen] = useState(false);
  const [openLimitAfterPassport, setOpenLimitAfterPassport] = useState(false);

  const fxMult = currency === "SGD" ? 1.72 : 1;
  const displayBalance = +(2144.51 * fxMult).toFixed(2);

  const openDetailForTx = (tx) => {
    const prod = tx.productId ? getProduct(tx.productId) : null;
    if (!prod || !withJejak) return;
    vibrate(6);
    const mkt = prod?.markets?.[market] ? market : "GB";
    const price = prod.markets[mkt].price;
    const split = computeSplit(prod, mkt, "split", price);
    const labour = split.find((s) => s.key === "labour");

    setSelectedScan({
      id: tx.id,
      product_id: prod.id,
      product_name: prod.name,
      origin: tx.origin,
      labour_pct: labour?.pct?.mid || 7.5,
      price,
      currency,
      market: mkt,
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
    setProduct(prod);
    setCustomPrice(null);
    setCompareMode(false);
    setLowConfidence(false);
    setScreen("journey");
    navigate("/trace");
  };

  const handleOpenPassport = (reason = null) => {
    setOpenLimitAfterPassport(false);
    setPassportPromptReason(reason);
    setPassportSheetOpen(true);
  };

  const handleTriggerSpendCap = () => {
    if (walletSession) {
      setSpendLimitSheetOpen(true);
    } else {
      setOpenLimitAfterPassport(true);
      setPassportPromptReason(
        "Create your passport first to set an on-chain spending limit"
      );
      setPassportSheetOpen(true);
    }
  };

  return (
    <ScreenShell variant="host-bank" header={false}>
      <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-2">
        <a href="/" className="font-grotesk text-xs font-medium text-slate-500 hover:text-slate-900">← Back to Jejak</a>
        <span className="font-plexmono text-[9px] uppercase tracking-[0.14em] text-slate-400">Demo · Jejak inside a banking app</span>
      </div>
      <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col px-5 pt-4">
        {/* Header: Demo Bank + Currency Toggle + Small (i) Icon */}
        <header className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
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
              aria-label="About embedded bank concept"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Info size={15} />
            </button>
          </div>
        </header>

        {/* Without / With Jejak Toggle directly under header */}
        <div
          role="group"
          aria-label="Jejak integration toggle"
          className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/75 p-1 border border-slate-200 shrink-0"
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

        {/* Single Merged Balance + World-Map Hero Card */}
        <div className="mt-3 shrink-0">
          <BankMergedHeroCard
            displayBalance={displayBalance}
            currency={currency}
            market={market}
            withJejak={withJejak}
            origins={WEEK_ORIGINS}
            countryCount={6}
            walletSession={walletSession}
            onOpenPassport={() => handleOpenPassport(null)}
            onTriggerSpendCap={handleTriggerSpendCap}
            isCompact={sheetSnap === "full"}
            reduce={reduce}
          />
        </div>

        {/* Draggable Transactions Bottom Sheet */}
        <BankTransactionsSheet
          snap={sheetSnap}
          setSnap={setSheetSnap}
          feed={FEED}
          withJejak={withJejak}
          currency={currency}
          market={market}
          fxMult={fxMult}
          onSelectTx={openDetailForTx}
          reduce={reduce}
        />

        {/* On-Demand Jejak Passport Bottom Sheet */}
        <JejakPassportSheet
          open={passportSheetOpen}
          onClose={() => setPassportSheetOpen(false)}
          onCreated={() => {
            if (openLimitAfterPassport) {
              setOpenLimitAfterPassport(false);
              setSpendLimitSheetOpen(true);
            }
          }}
          pendingActionLabel={passportPromptReason}
        />

        {/* Real Smart-Account Spending Limit Policy Sheet (Amount + Category -> Passkey -> Stellar) */}
        <BankSpendLimitSheet
          open={spendLimitSheetOpen}
          onClose={() => setSpendLimitSheetOpen(false)}
        />

        {/* Shared Trace Detail Bottom Sheet */}
        <TraceDetailSheet
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
          onTraceProduct={handleTraceProduct}
          reduce={reduce}
        />

        {/* (i) Concept & Technical Info Sheet (holds RP ID out of main UI) */}
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
                <p className="mt-2 font-mono text-[10px] text-slate-400">
                  Passkey RP ID: {CANONICAL_PASSKEY_RP_ID} · Stellar Testnet
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}
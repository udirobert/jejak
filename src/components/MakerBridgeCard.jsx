import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { formatMoney, getRoute } from "@/lib/money";
import causes from "@/data/causes.json";
import SupplyFlowPipe from "./SupplyFlowPipe";
import StellarSettlementBadge from "./StellarSettlementBadge";
import { celebrate } from "@/lib/celebrate";
import { vibrate, coinClink } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import {
  HeartHandshake,
  RotateCcw,
  Zap,
  Lock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

// "Flow & Give to a Cause" card:
// 1. Animated SVG SupplyFlowPipe showing the estimated shelf-price split
// 2. Optional (default OFF) "Give to a cause" action that sends a Stellar Testnet
//    payment to a selected demo cause wallet with a memo recording product category and origin region.
export default function MakerBridgeCard({
  price,
  currency,
  labourPct,
  labourAmount,
}) {
  const {
    product,
    market,
    makerTip,
    setMakerTip,
    lastStellarTx,
    setLastStellarTx,
    stellarLoading,
    stellarError,
    settleStellarPayout,
  } = useApp();

  const route = getRoute(product, market);
  const originCountry = route[0]?.country || "Bangladesh";

  // Default OFF as required
  const [giveEnabled, setGiveEnabled] = useState(false);
  const [selectedCauseId, setSelectedCauseId] = useState(() => {
    const match = causes.find((c) => c.region === originCountry);
    return match ? match.id : causes[0].id;
  });
  const [settlementMode, setSettlementMode] = useState("direct"); // "direct" | "escrow"

  useEffect(() => {
    const match = causes.find((c) => c.region === originCountry);
    if (match) setSelectedCauseId(match.id);
  }, [originCountry]);

  const selectedCause =
    causes.find((c) => c.id === selectedCauseId) || causes[0];

  const handleGive = (amt) => {
    vibrate([0, 10, 25, 10]);
    coinClink();
    const nextTip = +(makerTip + amt).toFixed(2);
    setMakerTip(nextTip);
    celebrate();
    settleStellarPayout({
      amount: amt,
      mode: settlementMode,
      causeObj: selectedCause,
    });
  };

  const resetGive = () => {
    vibrate(6);
    setMakerTip(0);
    setLastStellarTx(null);
  };

  return (
    <div className="space-y-2.5">
      {/* Shelf-price split visualization (does not mix testnet donations into maker share) */}
      <SupplyFlowPipe
        price={price}
        currency={currency}
        labourPct={labourPct}
        labourAmount={labourAmount}
        makerTip={0}
      />

      <div
        className="rounded-2xl p-3"
        style={{
          background: "linear-gradient(135deg,#2FBF7118,#FFC24B22)",
          border: "1px solid #2FBF7155",
        }}
      >
        {/* Header + Default-OFF Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jejak-navy text-amber-300">
              <HeartHandshake size={14} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-extrabold text-jejak-navy">
                  Give to a cause
                </p>
                <span className="rounded-full bg-jejak-navy/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-jejak-navy/75">
                  Demo testnet donation · No real-world disbursement
                </span>
              </div>
              <p className="mt-0.5 text-[10px] font-semibold text-jejak-navy/70">
                Sends a testnet payment to a demo cause wallet. In production, donations would go to a vetted organisation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrate(6);
              setGiveEnabled((v) => !v);
            }}
            aria-pressed={giveEnabled}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors no-tap"
            style={{ background: giveEnabled ? "#1B1B3A" : "#D9DBE8" }}
          >
            <motion.span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
              animate={{ left: giveEnabled ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {giveEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 pt-2.5 border-t border-jejak-navy/10 space-y-2">
                {/* Configurable Cause Selector from src/data/causes.json */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/60">
                    <span>Recipient cause (all entries: Demo cause (testnet))</span>
                    {makerTip > 0 && (
                      <span className="flex items-center gap-2">
                        <span className="text-jejak-labour">
                          {formatMoney(makerTip, currency, { minDigits: 0, maxDigits: 0 })} sent
                        </span>
                        <button
                          type="button"
                          onClick={resetGive}
                          className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-jejak-navy/65 no-tap"
                        >
                          <RotateCcw size={10} /> Reset
                        </button>
                      </span>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <select
                      value={selectedCauseId}
                      onChange={(e) => {
                        vibrate(5);
                        setSelectedCauseId(e.target.value);
                      }}
                      className="w-full appearance-none rounded-xl bg-white/90 border border-jejak-navy/15 py-2 pl-2.5 pr-8 text-xs font-extrabold text-jejak-navy focus:outline-none"
                    >
                      {causes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.region}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-jejak-navy/60"
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-jejak-navy/65">
                    {selectedCause.description}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-jejak-navy/55 truncate">
                    Testnet wallet: {selectedCause.walletAddress}
                  </p>
                </div>

                {/* Stellar Primitive Switcher: Direct Payment vs Claimable Balance */}
                <div className="flex items-center gap-1 rounded-xl bg-white/60 p-1 border border-jejak-navy/10">
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(5);
                      setSettlementMode("direct");
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-extrabold transition-colors no-tap ${
                      settlementMode === "direct"
                        ? "bg-jejak-navy text-white shadow-sm"
                        : "text-jejak-navy/65 hover:text-jejak-navy"
                    }`}
                  >
                    <Zap size={10} /> Direct Transfer (Testnet)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(5);
                      setSettlementMode("escrow");
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-extrabold transition-colors no-tap ${
                      settlementMode === "escrow"
                        ? "bg-jejak-navy text-amber-300 shadow-sm"
                        : "text-jejak-navy/65 hover:text-jejak-navy"
                    }`}
                  >
                    <Lock size={10} /> Claimable Balance (Testnet)
                  </button>
                </div>

                {/* Give amounts */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    whileTap={TAP}
                    onClick={() => handleGive(1)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-white/90 py-2 px-3 text-xs font-extrabold text-jejak-navy shadow-sm no-tap hover:bg-white"
                  >
                    Give {formatMoney(1, currency)} (testnet)
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={TAP}
                    onClick={() => handleGive(5)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-jejak-navy py-2 px-3 text-xs font-extrabold text-amber-300 shadow-sm no-tap"
                  >
                    Give {formatMoney(5, currency)} (testnet)
                  </motion.button>
                </div>

                {/* "Give for real" external link — ONLY shown if an explicit externalDonationUrl is provided */}
                {selectedCause.externalDonationUrl ? (
                  <a
                    href={selectedCause.externalDonationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-jejak-materials py-2 px-3 text-xs font-extrabold text-white shadow-sm no-tap"
                  >
                    Give for real <ExternalLink size={12} />
                  </a>
                ) : null}

                <StellarSettlementBadge
                  tx={lastStellarTx}
                  loading={stellarLoading}
                  error={stellarError}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
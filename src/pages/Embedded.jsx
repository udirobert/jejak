import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import causes from "@/data/causes.json";
import { computeSplit, getRoute } from "@/lib/money";
import SupplyFlowPipe from "@/components/SupplyFlowPipe";
import StellarSettlementBadge from "@/components/StellarSettlementBadge";
import StageSidebars from "@/components/StageSidebars";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronDown,
  HeartHandshake,
  ExternalLink,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { vibrate, coinClink } from "@/lib/haptics";
import { celebrate } from "@/lib/celebrate";
import { TAP } from "@/lib/motion";

const FEED = [
  { id: 1, merchant: "Roastery & Co", amount: -3.8, date: "08:42", cat: "Coffee", productId: "coffee" },
  { id: 2, merchant: "Everyday Hoodie", amount: -45.0, date: "13:15", cat: "Apparel", productId: "hoodie" },
  { id: 3, merchant: "RunLab Footwear", amount: -95.0, date: "Yesterday", cat: "Footwear", productId: "trainers" },
  { id: 4, merchant: "CaseCraft Studio", amount: -25.0, date: "2d ago", cat: "Accessories", productId: "phone_case" },
  { id: 5, merchant: "Salary Deposit", amount: 2400.0, date: "3d ago", cat: "Income" },
];

export default function Embedded() {
  const { setProduct, setScreen, setCustomPrice, setMakerTip, settleStellarPayout } = useApp();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(2);
  const [giveByTx, setGiveByTx] = useState({});
  const [stellarByTx, setStellarByTx] = useState({});
  const [loadingTxId, setLoadingTxId] = useState(null);
  const [giveEnabled, setGiveEnabled] = useState(false); // Default OFF

  const traceableTxs = FEED.filter((t) => t.productId);
  const totalSpent = traceableTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
  const baseToMakers = traceableTxs.reduce((s, t) => {
    const p = getProduct(t.productId);
    const pct = p?.split?.labour?.pct?.mid || 0;
    return s + (Math.abs(t.amount) * pct) / 100;
  }, 0);

  const manualCauseTotal = Object.values(giveByTx).reduce((s, v) => s + v, 0);
  const makerSharePct = Math.min(100, +((baseToMakers / totalSpent) * 100).toFixed(1));

  // SVG Ring Gauge geometry
  const ringR = 28;
  const ringCircumference = 2 * Math.PI * ringR;
  const makerArc = (makerSharePct / 100) * ringCircumference;

  const giveToCauseForTx = async (tx, amount = 1) => {
    const txId = tx.id;
    vibrate([0, 10, 20, 10]);
    coinClink();
    setGiveByTx((prev) => ({ ...prev, [txId]: +((prev[txId] || 0) + amount).toFixed(2) }));
    celebrate();
    const prod = getProduct(tx.productId);
    if (prod) {
      const route = getRoute(prod, "GB");
      const origin = route[0]?.country || "Bangladesh";
      const causeObj = causes.find((c) => c.region === origin) || causes[0];
      setLoadingTxId(txId);
      const res = await settleStellarPayout({
        amount,
        productObj: prod,
        currencyOverride: "GBP",
        causeObj,
      });
      setLoadingTxId(null);
      if (res) {
        setStellarByTx((prev) => ({ ...prev, [txId]: res }));
      }
    }
  };

  const openFullTrace = (tx) => {
    vibrate(8);
    const prod = getProduct(tx.productId);
    if (prod) {
      setProduct(prod);
      setCustomPrice(Math.abs(tx.amount));
      setMakerTip(giveByTx[tx.id] || 0);
      setScreen("journey");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-jejak-navy">
      <StageSidebars />
      <div
        className="relative w-full min-h-screen flex flex-col bg-[#0E1230] text-white xl:shadow-2xl"
        style={{ maxWidth: 420 }}
      >
        {/* Minimal top bar */}
        <header className="flex items-center justify-between px-5 pt-5 pb-1">
          <Link to="/" className="flex items-center gap-1 text-xs font-bold text-white/70 hover:text-white no-tap">
            <ChevronLeft size={16} /> Scanner
          </Link>
          <span className="rounded-full bg-amber-300/15 border border-amber-300/35 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            Embedded Bank Concept
          </span>
        </header>

        <p className="px-5 pb-2 text-[11px] font-semibold text-white/65">
          Concept preview: inspect estimated provenance and cost splits inside a bank feed, or optionally send a demo testnet donation to a demo cause wallet.
        </p>

        {/* Unified Visual Bank Card */}
        <div className="px-5 pt-1">
          <div
            className="rounded-3xl p-4 border border-white/15 shadow-xl"
            style={{
              background:
                "radial-gradient(circle at 85% 15%, rgba(255,138,101,0.28), rgba(255,255,255,0.06) 65%)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">
                  Current Account (Illustrative)
                </p>
                <p className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums">
                  £2,144.51
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="rounded-lg bg-jejak-labour/20 border border-jejak-labour/40 px-2 py-0.5 text-amber-300 tabular-nums">
                    ~£{baseToMakers.toFixed(2)} est. maker share
                  </span>
                  {manualCauseTotal > 0 && (
                    <span className="rounded-lg bg-jejak-materials/20 border border-jejak-materials/40 px-2 py-0.5 text-jejak-materials tabular-nums">
                      £{manualCauseTotal.toFixed(2)} demo cause (testnet)
                    </span>
                  )}
                </div>
              </div>

              {/* Animated SVG Estimated Maker Share Ring Gauge */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
                  <circle
                    cx="36"
                    cy="36"
                    r={ringR}
                    fill="none"
                    stroke="rgba(255,61,129,0.28)"
                    strokeWidth="7"
                  />
                  <motion.circle
                    cx="36"
                    cy="36"
                    r={ringR}
                    fill="none"
                    stroke="#FF7A1A"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    animate={{ strokeDashoffset: ringCircumference - makerArc }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-extrabold text-white tabular-nums">
                    {makerSharePct}%
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-white/55">
                    Est. Maker
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Give to a Cause Toggle (Default OFF) */}
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 border border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <HeartHandshake size={14} className="text-amber-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white">
                    Give to a cause (optional, default off)
                  </p>
                  <p className="text-[10px] font-semibold text-white/60">
                    Demo testnet donation. No real-world disbursement.
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
                style={{ background: giveEnabled ? "#2FBF71" : "rgba(255,255,255,0.22)" }}
              >
                <motion.span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ left: giveEnabled ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Clean Accordion Transaction Sheet */}
        <div className="mt-4 flex-1 rounded-t-3xl bg-[#F4F2FB] px-4 pt-4 pb-28 text-jejak-navy">
          <div className="mb-2.5 flex items-center justify-between px-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-jejak-navy/55">
              Activity · Tap to inspect estimate
            </p>
            <span className="text-[10px] font-bold text-jejak-navy/45">
              5-color bar = estimated split
            </span>
          </div>

          <div className="space-y-2">
            {FEED.map((tx) => {
              const prod = tx.productId ? getProduct(tx.productId) : null;
              const price = Math.abs(tx.amount);
              const split = prod ? computeSplit(prod, "GB", "split", price) : null;
              const labour = split?.find((s) => s.key === "labour");
              const route = prod ? getRoute(prod, "GB") : [];
              const origin = route[0]?.country || "Bangladesh";
              const causeObj = causes.find((c) => c.region === origin) || causes[0];
              const txGiven = giveByTx[tx.id] || 0;
              const isOpen = expandedId === tx.id;

              return (
                <motion.div
                  key={tx.id}
                  layout
                  className="overflow-hidden rounded-2xl bg-white border border-white shadow-sm"
                >
                  {/* Compact single-row transaction header */}
                  <button
                    type="button"
                    disabled={!prod}
                    onClick={() => {
                      if (!prod) return;
                      vibrate(6);
                      setExpandedId(isOpen ? null : tx.id);
                    }}
                    className={`flex w-full items-center gap-3 p-3 text-left no-tap ${
                      prod ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg"
                      style={{ background: tx.amount > 0 ? "#2FBF7120" : "#EDE7FF" }}
                    >
                      {prod ? (
                        prod.emoji
                      ) : (
                        <ArrowUpRight size={16} className="text-jejak-materials" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-extrabold text-jejak-navy">
                          {tx.merchant}
                        </p>
                        <p
                          className={`shrink-0 text-sm font-extrabold tabular-nums ${
                            tx.amount > 0 ? "text-jejak-materials" : "text-jejak-navy"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : "-"}£{price.toFixed(2)}
                        </p>
                      </div>

                      {split ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-jejak-navy/10">
                            {split.map((seg) => (
                              <div
                                key={seg.key}
                                style={{ width: `${seg.pct.mid}%`, background: seg.color }}
                                className="h-full"
                              />
                            ))}
                          </div>
                          <span className="shrink-0 text-[10px] font-extrabold text-jejak-labour tabular-nums">
                            {txGiven > 0
                              ? `£${txGiven.toFixed(2)} demo cause`
                              : `~${labour.pct.mid}% est. maker`}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-jejak-navy/45 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] font-semibold text-jejak-navy/45">
                          {tx.date} · {tx.cat}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Inline progressive-disclosure drawer */}
                  <AnimatePresence initial={false}>
                    {prod && isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden border-t border-jejak-navy/8 bg-[#FAF8FF] px-3 pb-3 pt-2.5"
                      >
                        <SupplyFlowPipe
                          price={price}
                          currency="GBP"
                          labourPct={labour.pct.mid}
                          labourAmount={labour.amount}
                          makerTip={0}
                        />

                        {giveEnabled && (
                          <div className="mt-2 rounded-xl bg-jejak-navy/5 border border-jejak-navy/10 p-2">
                            <p className="text-[10px] font-extrabold text-jejak-navy">
                              {causeObj.name}
                            </p>
                            <p className="text-[9px] font-semibold text-jejak-navy/65">
                              Sends a testnet payment to a demo cause wallet. In production, donations would go to a vetted organisation.
                            </p>
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-1.5">
                          {giveEnabled && (
                            <motion.button
                              type="button"
                              whileTap={TAP}
                              onClick={() => giveToCauseForTx(tx, 1)}
                              className="flex-1 rounded-xl bg-white border border-jejak-navy/15 py-2 px-2.5 text-xs font-extrabold text-jejak-navy shadow-sm no-tap"
                            >
                              Give £1 to demo cause (testnet)
                            </motion.button>
                          )}
                          <motion.button
                            type="button"
                            whileTap={TAP}
                            onClick={() => openFullTrace(tx)}
                            aria-label="Open provenance trace"
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-jejak-navy px-3 py-2 text-xs font-extrabold text-amber-300 no-tap"
                          >
                            Trace {origin} provenance <ExternalLink size={12} />
                          </motion.button>
                        </div>

                        <StellarSettlementBadge
                          tx={stellarByTx[tx.id]}
                          loading={loadingTxId === tx.id}
                          compact
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
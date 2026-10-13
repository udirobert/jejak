import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import { computeSplit, getRoute } from "@/lib/money";
import SupplyFlowPipe from "@/components/SupplyFlowPipe";
import StellarSettlementBadge from "@/components/StellarSettlementBadge";
import StageSidebars from "@/components/StageSidebars";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Check,
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
  const { setProduct, setScreen, setCustomPrice, setMakerTip, addToWorkerFund, settleStellarPayout } = useApp();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(2); // Default Everyday Hoodie open for immediate visual punch
  const [fundByTx, setFundByTx] = useState({});
  const [stellarByTx, setStellarByTx] = useState({});
  const [loadingTxId, setLoadingTxId] = useState(null);
  const [autoRoundup, setAutoRoundup] = useState(false);

  const traceableTxs = FEED.filter((t) => t.productId);
  const totalSpent = traceableTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
  const baseToMakers = traceableTxs.reduce((s, t) => {
    const p = getProduct(t.productId);
    const pct = p?.split?.labour?.pct?.mid || 0;
    return s + (Math.abs(t.amount) * pct) / 100;
  }, 0);

  const roundupTotal = autoRoundup ? traceableTxs.length * 1.0 : 0;
  const manualBoostTotal = Object.values(fundByTx).reduce((s, v) => s + v, 0);
  const totalBoosted = roundupTotal + manualBoostTotal;
  const effectiveMakers = baseToMakers + totalBoosted;
  const makerSharePct = Math.min(100, +((effectiveMakers / totalSpent) * 100).toFixed(1));

  // SVG Ring Gauge geometry
  const ringR = 28;
  const ringCircumference = 2 * Math.PI * ringR;
  const makerArc = (makerSharePct / 100) * ringCircumference;

  const toggleAutoRoundup = () => {
    vibrate([0, 8, 20, 8]);
    coinClink();
    setAutoRoundup((prev) => {
      const next = !prev;
      if (next) celebrate();
      return next;
    });
  };

  const addFundForTx = async (tx, amount = 1) => {
    const txId = tx.id;
    vibrate([0, 10, 20, 10]);
    coinClink();
    setFundByTx((prev) => ({ ...prev, [txId]: +((prev[txId] || 0) + amount).toFixed(2) }));
    addToWorkerFund(amount);
    celebrate();
    const prod = getProduct(tx.productId);
    if (prod) {
      setLoadingTxId(txId);
      const res = await settleStellarPayout({
        amount,
        productObj: prod,
        currencyOverride: "GBP",
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
      setMakerTip((fundByTx[tx.id] || 0) + (autoRoundup ? 1 : 0));
      setScreen("split");
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
            Embedded Bank Preview
          </span>
        </header>

        <p className="px-5 pb-2 text-[11px] font-semibold text-white/65">
          See how Jejak plugs into a banking app: tap any purchase to see its cost split or round up £1 to the makers.
        </p>

        {/* Unified Visual Bank Card: Balance + Animated Ring Gauge + 1-Tap Auto-Roundup */}
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
                  Current Account
                </p>
                <p className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums">
                  £{(2144.51 - totalBoosted).toFixed(2)}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                  <span className="rounded-lg bg-jejak-materials/20 border border-jejak-materials/40 px-2 py-0.5 text-jejak-materials tabular-nums">
                    £{effectiveMakers.toFixed(2)} to makers
                  </span>
                  <span className="text-white/50 tabular-nums">
                    of £{totalSpent.toFixed(0)} spent
                  </span>
                </div>
              </div>

              {/* Animated SVG Fairness Ring Gauge */}
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
                    stroke="#2FBF71"
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
                    Maker
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive 1-Tap Auto-Roundup Toggle */}
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-300 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-white">
                    Auto-roundup +£1 to makers
                  </p>
                  <p className="text-[10px] font-semibold text-white/60">
                    {autoRoundup
                      ? "Active on 4 retail purchases (+£4.00)"
                      : "Boost every purchase automatically"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleAutoRoundup}
                aria-pressed={autoRoundup}
                className="relative h-6 w-11 shrink-0 rounded-full transition-colors no-tap"
                style={{ background: autoRoundup ? "#2FBF71" : "rgba(255,255,255,0.22)" }}
              >
                <motion.span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ left: autoRoundup ? 22 : 2 }}
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
              Activity · Tap to inspect flow
            </p>
            <span className="text-[10px] font-bold text-jejak-navy/45">
              5-color bar = cost split
            </span>
          </div>

          <div className="space-y-2">
            {FEED.map((tx) => {
              const prod = tx.productId ? getProduct(tx.productId) : null;
              const price = Math.abs(tx.amount);
              const split = prod ? computeSplit(prod, "GB", "split", price) : null;
              const transparentSplit = prod
                ? computeSplit(prod, "GB", "transparent", price)
                : null;
              const labour = split?.find((s) => s.key === "labour");
              const transparentLabour = transparentSplit?.find((s) => s.key === "labour");
              const gap =
                labour && transparentLabour
                  ? Math.max(0.5, +(transparentLabour.amount - labour.amount).toFixed(2))
                  : 1;
              const route = prod ? getRoute(prod, "GB") : [];
              const txBoost = (fundByTx[tx.id] || 0) + (prod && autoRoundup ? 1 : 0);
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

                      {/* Micro 5-color split bar + compact origin pill instead of verbose text lines */}
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
                            {txBoost > 0
                              ? `£${(labour.amount + txBoost).toFixed(2)} boosted`
                              : `${labour.pct.mid}% maker`}
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

                  {/* Inline progressive-disclosure drawer with visual SupplyFlowPipe */}
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
                          makerTip={txBoost}
                        />

                        <div className="mt-2 flex items-center gap-1.5">
                          <motion.button
                            type="button"
                            whileTap={TAP}
                            onClick={() => addFundForTx(tx, 1)}
                            className="flex-1 rounded-xl bg-white border border-jejak-navy/15 py-2 text-xs font-extrabold text-jejak-navy shadow-sm no-tap"
                          >
                            +£1 Stellar round-up
                          </motion.button>
                          <motion.button
                            type="button"
                            whileTap={TAP}
                            onClick={() => addFundForTx(tx, gap)}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-jejak-materials py-2 text-xs font-extrabold text-white shadow-sm no-tap"
                          >
                            {txBoost >= gap && <Check size={12} />}
                            Bridge £{gap.toFixed(2)}
                          </motion.button>
                          <motion.button
                            type="button"
                            whileTap={TAP}
                            onClick={() => openFullTrace(tx)}
                            aria-label="Open full receipt"
                            className="flex items-center gap-1 rounded-xl bg-jejak-navy px-3 py-2 text-xs font-extrabold text-amber-300 no-tap"
                          >
                            {route[0]?.country} <ExternalLink size={12} />
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
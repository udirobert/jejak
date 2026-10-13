import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import { computeSplit, formatMoney, getRoute } from "@/lib/money";
import Logo from "@/components/Logo";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import StageSidebars from "@/components/StageSidebars";
import { ArrowUpRight, ArrowDownRight, ChevronLeft, HeartHandshake, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { vibrate, coinClink } from "@/lib/haptics";
import { celebrate } from "@/lib/celebrate";
import { TAP } from "@/lib/motion";

// Concept screen: a mock neobank feed where every retail product transaction
// has a live "Trace" chip opening the embedded Jejak receipt + worker fund round-up.
const FEED = [
  { id: 1, merchant: "Roastery & Co", amount: -3.8, date: "Today · 08:42", cat: "Coffee", productId: "coffee" },
  { id: 2, merchant: "Everyday Hoodie", amount: -45.0, date: "Today · 13:15", cat: "Apparel", productId: "hoodie" },
  { id: 3, merchant: "RunLab Footwear", amount: -95.0, date: "Yesterday", cat: "Footwear", productId: "trainers" },
  { id: 4, merchant: "CaseCraft Studio", amount: -25.0, date: "2 days ago", cat: "Accessories", productId: "phone_case" },
  { id: 5, merchant: "Salary Deposit", amount: 2400.0, date: "3 days ago", cat: "Income" },
];

export default function Embedded() {
  const { setProduct, setScreen, setCustomPrice, setMakerTip, addToWorkerFund } = useApp();
  const navigate = useNavigate();
  const [activeTx, setActiveTx] = useState(null);
  const [fundByTx, setFundByTx] = useState({});

  // Compute weekly supply-chain footprint across all traceable transactions
  const traceableTxs = FEED.filter((t) => t.productId);
  const totalSpent = traceableTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalToMakers = traceableTxs.reduce((s, t) => {
    const p = getProduct(t.productId);
    const pct = p?.split?.labour?.pct?.mid || 0;
    return s + (Math.abs(t.amount) * pct) / 100;
  }, 0);
  const totalBoosted = Object.values(fundByTx).reduce((s, v) => s + v, 0);

  const openFullTrace = (tx) => {
    vibrate(8);
    const prod = getProduct(tx.productId);
    if (prod) {
      setProduct(prod);
      setCustomPrice(Math.abs(tx.amount));
      setMakerTip(fundByTx[tx.id] || 0);
      setScreen("split");
      navigate("/");
    }
  };

  const addFundForTx = (txId, amount = 1) => {
    vibrate([0, 10, 20, 10]);
    coinClink();
    setFundByTx((prev) => ({ ...prev, [txId]: (prev[txId] || 0) + amount }));
    addToWorkerFund(amount);
    celebrate();
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-jejak-navy">
      <StageSidebars />
      <div
        className="relative w-full min-h-screen flex flex-col bg-[#0E1230] text-white xl:shadow-2xl"
        style={{ maxWidth: 420 }}
      >
        <header className="flex items-center justify-between px-5 pt-6 pb-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-bold text-white/70">
            <ChevronLeft size={18} /> Back to Jejak
          </Link>
          <span className="rounded-full bg-amber-300/15 border border-amber-300/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            B2B2C Bank Concept
          </span>
        </header>

        <div className="px-5">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Current account</p>
          <p className="mt-1 text-3xl font-extrabold">£{(2144.51 - totalBoosted).toFixed(2)}</p>
          <p className="text-xs text-white/40">Sort 12-34-56 · Acct 12345678 (illustrative)</p>

          {/* Weekly Supply-Chain Footprint Summary Card */}
          <div className="mt-4 rounded-2xl bg-white/10 border border-white/15 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                <Sparkles size={12} /> Weekly Supply-Chain Footprint
              </span>
              <span className="text-[10px] font-bold text-white/60">4 items traced</span>
            </div>
            <p className="mt-1.5 text-sm font-extrabold text-white">
              Of £{totalSpent.toFixed(2)} spent,{" "}
              <span className="text-amber-300">
                £{(totalToMakers + totalBoosted).toFixed(2)}
              </span>{" "}
              reached the makers.
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-white/65">
              £{(totalSpent - totalToMakers).toFixed(2)} absorbed by retail, brand & freight intermediaries
              {totalBoosted > 0 ? ` · +£${totalBoosted.toFixed(2)} boosted by you` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 flex-1 rounded-t-3xl bg-[#F4F2FB] p-5 pb-28 text-jejak-navy">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold">Recent transactions</p>
            <span className="text-[11px] font-bold text-jejak-navy/50">Tap any item to trace</span>
          </div>
          <div className="space-y-2.5">
            {FEED.map((tx) => {
              const prod = tx.productId ? getProduct(tx.productId) : null;
              const labourPct = prod?.split?.labour?.pct?.mid;
              const labourAmt = prod ? (Math.abs(tx.amount) * labourPct) / 100 : null;
              const txBoost = fundByTx[tx.id] || 0;

              return (
                <motion.div
                  key={tx.id}
                  whileTap={prod ? TAP : undefined}
                  onClick={() => prod && (vibrate(6), setActiveTx(tx))}
                  className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition-shadow ${
                    prod ? "cursor-pointer hover:shadow-md" : ""
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{ background: tx.amount > 0 ? "#2FBF7122" : "#8B5CF618" }}
                  >
                    {prod ? (
                      prod.emoji
                    ) : tx.amount > 0 ? (
                      <ArrowUpRight size={16} className="text-jejak-materials" />
                    ) : (
                      <ArrowDownRight size={16} className="text-jejak-brand" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-jejak-navy truncate">{tx.merchant}</p>
                    <p className="text-xs text-jejak-navy/50">
                      {tx.date} · {tx.cat}
                    </p>
                    {prod && (
                      <p className="mt-0.5 text-[11px] font-bold text-jejak-labour">
                        ~£{labourAmt.toFixed(2)} ({labourPct}%) to makers
                        {txBoost > 0 ? ` · +£${txBoost.toFixed(2)} boosted` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-extrabold ${
                        tx.amount > 0 ? "text-jejak-materials" : "text-jejak-navy"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : "-"}£{Math.abs(tx.amount).toFixed(2)}
                    </p>
                    {prod && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          vibrate(6);
                          setActiveTx(tx);
                        }}
                        className="mt-1 inline-flex items-center gap-1 rounded-full bg-jejak-navy px-2.5 py-1 text-[11px] font-bold text-amber-300 no-tap"
                      >
                        <Logo size={13} glow={false} /> Trace
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-[11px] font-semibold text-jejak-navy/45">
            Concept: Jejak embedded inside your banking feed — not a live bank connection.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {activeTx && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-jejak-navy/50 backdrop-blur-sm"
              onClick={() => setActiveTx(null)}
            />
            <ReceiptSheet
              tx={activeTx}
              fund={fundByTx[activeTx.id] || 0}
              onAddFund={(amt) => addFundForTx(activeTx.id, amt)}
              onClose={() => setActiveTx(null)}
              onFullTrace={() => openFullTrace(activeTx)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReceiptSheet({ tx, fund, onAddFund, onClose, onFullTrace }) {
  const product = getProduct(tx.productId) || getProduct("hoodie");
  const price = Math.abs(tx.amount);
  const split = computeSplit(product, "GB", "split", price);
  const transparentSplit = computeSplit(product, "GB", "transparent", price);
  const labour = split.find((s) => s.key === "labour");
  const transparentLabour = transparentSplit.find((s) => s.key === "labour");
  const gap = Math.max(0.5, +(transparentLabour.amount - labour.amount).toFixed(2));
  const route = getRoute(product, "GB");

  return (
    <motion.div
      className="relative w-full max-w-[420px] rounded-t-3xl bg-lilac-peach p-6 pb-8 max-h-[82vh] overflow-y-auto scrollbar-hide"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-jejak-navy/20" />
      <div className="flex items-center gap-2">
        <Logo size={28} />
        <span className="text-base font-extrabold text-jejak-navy">
          {tx.merchant} · Jejak receipt
        </span>
        <span className="ml-auto text-xs font-bold text-jejak-navy/50">Estimated</span>
      </div>
      <p className="mt-1 text-sm font-bold text-jejak-navy">
        {product.emoji} {product.name} · {formatMoney(price, "GBP")}
      </p>

      <div className="mt-3 space-y-1.5">
        {split.map((cat) => (
          <div key={cat.key} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
            <span className="font-semibold text-jejak-navy/80">{cat.label}</span>
            <span className="ml-auto font-extrabold text-jejak-navy">
              {formatMoney(cat.amount, "GBP")}
            </span>
            <span className="w-10 text-right text-jejak-navy/50">{cat.pct.mid}%</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/60 p-2.5">
        <ConfidenceBadge level={labour.confidence} />
        <span className="text-xs text-jejak-navy/60">
          {route.length} stops ({route[0]?.country} → UK) · ranges, not facts
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-white/80 p-3.5 border border-jejak-materials/40">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-extrabold text-jejak-navy">
            <HeartHandshake size={14} className="text-jejak-materials" /> Direct Maker Boost
          </p>
          <p className="text-sm font-extrabold text-jejak-materials">+£{fund.toFixed(2)}</p>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-jejak-navy/65">
          Only £{labour.amount.toFixed(2)} reached makers. Bridge the £{gap.toFixed(2)} fair-share gap directly from your account:
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onAddFund(1)}
            className="rounded-lg bg-white border border-jejak-navy/15 py-2 text-xs font-extrabold text-jejak-navy no-tap"
          >
            +£1.00 round-up
          </button>
          <button
            type="button"
            onClick={() => onAddFund(gap)}
            className="rounded-lg bg-jejak-materials py-2 text-xs font-extrabold text-white no-tap"
          >
            Bridge £{gap.toFixed(2)} gap
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-jejak-navy/50">
          Concept — illustrates instant maker micro-payouts inside a banking app.
        </p>
      </div>

      <button
        type="button"
        onClick={onFullTrace}
        className="mt-4 w-full rounded-xl bg-jejak-navy py-3 text-sm font-extrabold text-white no-tap"
      >
        Open full interactive Jejak receipt
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full rounded-xl py-2 text-sm font-semibold text-jejak-navy/60 no-tap"
      >
        Close
      </button>
    </motion.div>
  );
}
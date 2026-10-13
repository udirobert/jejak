import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import { computeSplit, formatMoney, getRoute } from "@/lib/money";
import Logo from "@/components/Logo";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { ArrowUpRight, ArrowDownRight, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { vibrate } from "@/lib/haptics";

// Concept screen: a generic mock banking-app feed. No real brand logos.
// The hoodie transaction has a "Trace" chip that opens the Jejak receipt
// as a bottom sheet. Clearly labelled as a concept, not a real integration.
const FEED = [
  { id: 1, merchant: "Coffee Club", amount: -4.5, date: "Today", cat: "Food" },
  { id: 2, merchant: "Everyday Hoodie", amount: -120, date: "Today", cat: "Shopping", trace: true },
  { id: 3, merchant: "Tube top-up", amount: -20, date: "Yesterday", cat: "Transport" },
  { id: 4, merchant: "Salary", amount: 2400, date: "2 days ago", cat: "Income" },
  { id: 5, merchant: "Streaming", amount: -10.99, date: "3 days ago", cat: "Subs" },
];

export default function Embedded() {
  const { setProduct, setScreen } = useApp();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(false);

  const goFullTrace = () => {
    setProduct(getProduct("hoodie"));
    setScreen("split");
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-jejak-navy">
      <div className="relative w-full min-h-screen flex flex-col bg-[#0E1230] text-white" style={{ maxWidth: 420 }}>
        <header className="flex items-center justify-between px-5 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/60">
            <ChevronLeft size={18} /> Back to Jejak
          </Link>
          <span className="text-xs font-bold uppercase tracking-wide text-amber-300">Concept</span>
        </header>

        <div className="px-5">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Current account</p>
          <p className="mt-1 text-3xl font-extrabold">£ 2,144.51</p>
          <p className="text-xs text-white/40">Sort 12-34-56 · Acct 12345678 (mock)</p>
        </div>

        <div className="mt-6 flex-1 rounded-t-3xl bg-[#F4F2FB] p-5 pb-28 text-jejak-navy">
          <p className="mb-3 text-sm font-extrabold">Recent transactions</p>
          <div className="space-y-2">
            {FEED.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: tx.amount > 0 ? "#2FBF7122" : "#8B5CF622" }}
                >
                  {tx.amount > 0 ? <ArrowUpRight size={16} className="text-jejak-materials" /> : <ArrowDownRight size={16} className="text-jejak-brand" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{tx.merchant}</p>
                  <p className="text-xs text-jejak-navy/50">{tx.date} · {tx.cat}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-extrabold ${tx.amount > 0 ? "text-jejak-materials" : "text-jejak-navy"}`}>
                    {tx.amount > 0 ? "+" : ""}£{Math.abs(tx.amount).toFixed(2)}
                  </p>
                  {tx.trace && (
                    <button
                      type="button"
                      onClick={() => setSheet(true)}
                      className="mt-1 inline-flex items-center gap-1 rounded-full bg-jejak-navy px-2.5 py-1 text-[11px] font-bold text-amber-300 no-tap"
                    >
                      <Logo size={14} glow={false} /> Trace
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-jejak-navy/40">
            Concept: embedded in your banking app — not a real integration.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {sheet && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-jejak-navy/50 backdrop-blur-sm" onClick={() => setSheet(false)} />
            <ReceiptSheet onClose={() => setSheet(false)} onFullTrace={goFullTrace} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReceiptSheet({ onClose, onFullTrace }) {
  const { currency, market } = useApp();
  const [fund, setFund] = useState(0);
  const product = getProduct("hoodie");
  const split = computeSplit(product, market, "split");
  const route = getRoute(product, market);
  return (
    <motion.div
      className="relative w-full max-w-[420px] rounded-t-3xl bg-lilac-peach p-6 pb-8 max-h-[80vh] overflow-y-auto scrollbar-hide"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-jejak-navy/20" />
      <div className="flex items-center gap-2">
        <Logo size={28} />
        <span className="text-base font-extrabold text-jejak-navy">Jejak receipt</span>
        <span className="ml-auto text-xs font-bold text-jejak-navy/50">Estimated</span>
      </div>
      <p className="mt-2 text-sm font-bold text-jejak-navy">{product.name} · {formatMoney(product.markets[market].price, currency)}</p>

      <div className="mt-3 space-y-1.5">
        {split.map((cat) => (
          <div key={cat.key} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
            <span className="font-semibold text-jejak-navy/80">{cat.label}</span>
            <span className="ml-auto font-extrabold text-jejak-navy">{formatMoney(cat.amount, currency)}</span>
            <span className="w-9 text-right text-jejak-navy/50">{cat.pct.mid}%</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/60 p-2.5">
        <ConfidenceBadge level="medium" />
        <span className="text-xs text-jejak-navy/60">Ranges, not facts · {route.length} stops traced</span>
      </div>

      <div className="mt-3 rounded-xl bg-white/70 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-jejak-navy">Jejak worker fund</p>
          <p className="text-sm font-extrabold text-jejak-materials">£{fund.toFixed(2)}</p>
        </div>
        <button
          type="button"
          onClick={() => { vibrate(10); setFund((f) => f + 1); }}
          className="mt-2 w-full rounded-lg bg-jejak-materials py-2 text-xs font-extrabold text-white no-tap"
        >
          {fund > 0 ? "Add another £1" : "Add £1 to the worker fund"}
        </button>
        <p className="mt-1.5 text-[10px] text-jejak-navy/50">Concept — rounds into a worker welfare fund, not a real charge.</p>
      </div>

      <button
        type="button"
        onClick={onFullTrace}
        className="mt-4 w-full rounded-xl bg-jejak-navy py-3 text-sm font-extrabold text-white no-tap"
      >
        Open full Jejak trace
      </button>
      <button type="button" onClick={onClose} className="mt-2 w-full rounded-xl py-2 text-sm font-semibold text-jejak-navy/60 no-tap">
        Close
      </button>
    </motion.div>
  );
}
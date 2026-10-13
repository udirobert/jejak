import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { DEMO_CHIPS, getProduct } from "@/data";
import { formatMoney } from "@/lib/money";
import { vibrate } from "@/lib/haptics";
import { ShieldCheck, Sparkles, ArrowRight, Landmark, Compass, Coins } from "lucide-react";

// Desktop-only left/right floating context cards so wide-screen demo reviews
// frame the mobile viewport with the hackathon thesis and live trust telemetry.
export default function StageSidebars() {
  const {
    product,
    currency,
    traces,
    workerTotal,
    shareMode,
    lastStellarTx,
    setProduct,
    setScreen,
    setCustomPrice,
    setMakerTip,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const jumpToProduct = (id) => {
    vibrate(8);
    setProduct(getProduct(id));
    setCustomPrice(null);
    setMakerTip(0);
    setScreen("split");
    if (location.pathname !== "/") navigate("/");
  };

  return (
    <>
      {/* Left rail — Hackathon thesis + instant product switcher */}
      <aside className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-20 w-64 flex-col gap-3">
        <div className="rounded-3xl frosted-strong p-4 border border-white/70">
          <span className="inline-flex items-center gap-1 rounded-full bg-jejak-navy px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            Stellar · Find Your Way
          </span>
          <h2 className="mt-2 text-base font-extrabold leading-snug text-jejak-navy">
            Start where money gets stuck.
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-jejak-navy/65">
            Your bank receipt stops at the checkout terminal. Jejak reveals where
            92.5% of your payment gets stuck—and settles micro-boosts directly to
            maker co-ops on Stellar in ~5s for 0.00001 XLM.
          </p>
        </div>

        <div className="rounded-3xl frosted p-4 border border-white/70">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/55">
            <Sparkles size={12} /> Quick-jump receipt
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {DEMO_CHIPS.map((c) => {
              const active = product?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => jumpToProduct(c.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors no-tap ${
                    active
                      ? "bg-jejak-navy text-white"
                      : "bg-white/75 text-jejak-navy hover:bg-white"
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-jejak-navy/10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                vibrate(6);
                navigate("/explore");
              }}
              className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs font-extrabold text-jejak-navy hover:bg-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Compass size={13} className="text-jejak-freight" /> Live Explore Feed
              </span>
              <ArrowRight size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                vibrate(6);
                navigate("/embedded");
              }}
              className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs font-extrabold text-jejak-navy hover:bg-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Landmark size={13} className="text-jejak-brand" /> Embedded Bank App
              </span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* Right rail — Trust, responsibility & session telemetry */}
      <aside className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-20 w-64 flex-col gap-3">
        <div className="rounded-3xl frosted-strong p-4 border border-white/70">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-jejak-materials">
            <ShieldCheck size={13} /> Trust & Responsibility
          </div>
          <ul className="mt-2 space-y-2 text-xs font-semibold text-jejak-navy/75">
            <li className="rounded-xl bg-white/65 p-2">
              <strong className="text-jejak-navy">Epistemic honesty:</strong>{" "}
              Every split is shown as a low–high range with sourced confidence
              badges.
            </li>
            <li className="rounded-xl bg-white/65 p-2">
              <strong className="text-jejak-navy">Private AI vision:</strong>{" "}
              Photos use short-lived private signed URLs unless you opt in.
            </li>
            <li className="rounded-xl bg-white/65 p-2">
              <strong className="text-jejak-navy">Current privacy mode:</strong>{" "}
              <span className="uppercase font-extrabold text-jejak-navy">
                {shareMode}
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl frosted p-4 border border-white/70">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/55">
            <Coins size={12} /> Your session impact
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/75 p-2.5">
              <p className="text-lg font-extrabold text-jejak-navy">{traces}</p>
              <p className="text-[10px] font-semibold text-jejak-navy/55">
                Items traced
              </p>
            </div>
            <div className="rounded-xl bg-white/75 p-2.5">
              <p className="text-lg font-extrabold text-jejak-labour">
                {formatMoney(workerTotal, currency)}
              </p>
              <p className="text-[10px] font-semibold text-jejak-navy/55">
                Maker value mapped
              </p>
            </div>
          </div>
          {lastStellarTx && (
            <a
              href={lastStellarTx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-between rounded-xl bg-jejak-navy px-3 py-2 text-[10px] font-extrabold text-amber-300 hover:opacity-95"
            >
              <span>Stellar TX #{lastStellarTx.ledger}</span>
              <span className="underline">Stellar.Expert ↗</span>
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
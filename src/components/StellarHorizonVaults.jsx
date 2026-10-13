import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ExternalLink, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

const FLAGS = {
  Bangladesh: "🇧🇩",
  Vietnam: "🇻🇳",
  Ethiopia: "🇪🇹",
  China: "🇨🇳",
};

// Live Stellar Testnet Demo Co-op Wallets component: fetches real testnet balances and
// recent JEJAK/EST memo transactions from Horizon, with honest labels.
export default function StellarHorizonVaults() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTelemetry = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("stellarMakerPayout", {
        action: "telemetry",
      });
      if (res?.data?.vaults) {
        setVaults(res.data.vaults);
      }
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  return (
    <div className="mt-3.5 rounded-3xl bg-jejak-navy p-4 text-white shadow-lg border border-amber-300/35">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 border border-amber-300/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
            <Sparkles size={10} /> Live Stellar Horizon Testnet
          </span>
          <h2 className="mt-1 text-sm font-extrabold text-white">
            Demo Co-op Wallets (Testnet)
          </h2>
        </div>
        <button
          type="button"
          onClick={loadTelemetry}
          disabled={loading}
          aria-label="Refresh Horizon ledger"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 no-tap"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-amber-300" : ""} />
        </button>
      </div>

      <p className="mt-1 text-[11px] font-semibold text-white/65">
        Boosts and shared scan estimate records are broadcast to these Stellar Testnet demo wallets. Local anchor off-ramps are a future integration.
      </p>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {vaults.map((v) => (
          <a
            key={v.origin}
            href={v.accountExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl bg-white/8 border border-white/12 p-2.5 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white flex items-center gap-1">
                <span>{FLAGS[v.origin] || "🌐"}</span> {v.origin}
              </span>
              <ExternalLink size={11} className="text-amber-300 opacity-75 group-hover:opacity-100" />
            </div>
            <p className="mt-0.5 text-[10px] font-bold text-white/80 truncate">
              {v.coopLabel}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold text-white/55 truncate">
              {v.futureAnchorNote}
            </p>
            <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1 text-[9px] font-mono text-amber-200">
              <span>{v.xlmBalance} XLM</span>
              <span>{v.recentTxs?.length || 0} recent TXs</span>
            </div>
          </a>
        ))}
      </div>

      {vaults.some((v) => v.recentTxs?.length > 0) && (
        <div className="mt-2.5 rounded-2xl bg-white/6 border border-white/10 p-2.5">
          <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-white/60">
            <ShieldCheck size={11} className="text-jejak-materials" /> Recent Testnet Transactions (Memos)
          </p>
          <div className="mt-1.5 space-y-1">
            {vaults
              .flatMap((v) =>
                (v.recentTxs || []).map((t) => ({ ...t, origin: v.origin }))
              )
              .slice(0, 3)
              .map((t) => (
                <a
                  key={t.hash}
                  href={t.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-white/8 px-2 py-1 text-[10px] hover:bg-white/15"
                >
                  <span className="font-mono text-amber-200 truncate max-w-[55%]">
                    {t.memo}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-white/80">
                    Ledger #{t.ledger} <ExternalLink size={9} className="text-amber-300" />
                  </span>
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
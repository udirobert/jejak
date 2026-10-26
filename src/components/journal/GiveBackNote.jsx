import React, { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { getRoute, formatMoney } from "@/lib/money";
import causes from "@/data/causes.json";
import { vibrate, coinClink } from "@/lib/haptics";
import { celebrate } from "@/lib/celebrate";
import JournalButton from "./JournalButton";
import MarginNote from "./MarginNote";

// Some of it could go back.
//
// The only place in the app where money actually moves is this one, so it
// doesn't belong in a drawer. It's offered here, right after the split is
// revealed, because that's the moment the number makes sense to act on.
//
// The transfer is a demonstration on the Stellar test network. It says so.
export default function GiveBackNote({ price, currency, labourAmount }) {
  const {
    product,
    market,
    makerTip,
    setMakerTip,
    lastStellarTx,
    setLastStellarTx,
    stellarLoading,
    settleStellarPayout,
  } = useApp();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  if (!product) return null;

  const route = getRoute(product, market);
  const origin = route[0]?.country || "Bangladesh";
  const cause = causes.find((c) => c.region === origin) || causes[0];
  const amount = 1;

  const give = async () => {
    setBusy(true);
    try {
      vibrate([0, 10, 25, 10]);
      coinClink();
      const tx = await settleStellarPayout({
        amount,
        mode: "escrow",
        causeObj: cause,
      });
      setMakerTip(+(makerTip + amount).toFixed(2));
      setSent(tx);
      celebrate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 max-w-md border border-journal-rule bg-journal-card p-4">
      <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
        Some of it could go back
      </p>

      {!sent ? (
        <>
          <p className="mt-1.5 font-grotesk text-[14px] leading-relaxed text-journal-ink">
            About {formatMoney(labourAmount, currency)} of your {formatMoney(price, currency, { minDigits: 0, maxDigits: 0 })} is
            estimated to have reached the people who made it, in {cause.region}.
          </p>
          <p className="mt-1.5 font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
            Send {formatMoney(amount, currency, { minDigits: 0, maxDigits: 0 })} of it to the{" "}
            {cause.region.toLowerCase()} corridor cause — as a claimable balance on the Stellar test
            network, so it can be claimed or returned. No real money moves.
          </p>
          <div className="mt-3">
            <JournalButton onClick={give} disabled={busy || stellarLoading} className={busy ? "opacity-60" : ""}>
              {busy || stellarLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              {busy || stellarLoading ? "Sending…" : `Give ${formatMoney(amount, currency, { minDigits: 0, maxDigits: 0 })} (testnet)`}
            </JournalButton>
          </div>
          <div className="mt-2">
            <MarginNote tone="ink">a claimable balance, not a donation</MarginNote>
          </div>
        </>
      ) : (
        <div className="mt-2">
          <p className="font-grotesk text-[14px] leading-relaxed text-journal-ink">
            {formatMoney(amount, currency, { minDigits: 0, maxDigits: 0 })} is on its way to the {cause.region.toLowerCase()}{" "}
            corridor. It's a claimable balance — the recipient claims it, or it returns.
          </p>
          {sent?.explorerUrl && (
            <a
              href={sent.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-stamp underline decoration-journal-stamp/40 underline-offset-2 no-tap hover:text-journal-ink"
            >
              open the transaction
              <ExternalLink size={11} />
            </a>
          )}
          <div className="mt-2">
            <MarginNote tone="stamp">paid forward, on the test network</MarginNote>
          </div>
        </div>
      )}

      {/* The tip is money you sent on top of the shelf price. It is kept out
          of the split on purpose — the split estimates where the shelf price
          went, and your extra £1 doesn't change that. So it gets its own
          line, and it survives moving around the trace. */}
      {makerTip > 0 && (
        <p className="mt-3 border-t border-dotted border-journal-rule pt-2.5 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
          {formatMoney(makerTip, currency, { minDigits: 0, maxDigits: 0 })} sent to causes on this
          trace · separate from the split above
        </p>
      )}

      {lastStellarTx?.cachedFallback && !sent && (
        <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
          testnet is slow — showing a recent verified transaction
        </p>
      )}
    </div>
  );
}

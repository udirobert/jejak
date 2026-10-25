import React from "react";
import { useApp } from "@/lib/AppContext";
import { computeSplit } from "@/lib/money";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import StellarTraceReceiptCard from "@/components/StellarTraceReceiptCard";
import MakerBridgeCard from "@/components/MakerBridgeCard";
import Stamp from "./Stamp";
import MarginNote from "./MarginNote";

// The one place technical detail lives: ledger anchoring, verification and the
// optional maker payout. Plain explainer up top; terms like SHA-256/Testnet
// are allowed only inside this drawer.
export default function ProofDrawer({ open, onOpenChange }) {
  const { product, market, currency, customPrice } = useApp();
  const price = customPrice != null && customPrice > 0 ? customPrice : product.markets[market].price;
  const labour = computeSplit(product, market).find((s) => s.key === "labour");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-journal-rule bg-journal-paper font-grotesk text-journal-ink">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto px-5 pb-10 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp">
                Proof · field record
              </p>
              <h2
                className="mt-1 font-serif-display text-3xl text-journal-ink"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
              >
                This record can't be quietly changed
              </h2>
              <p className="mt-2 max-w-lg font-grotesk text-sm leading-relaxed text-journal-ink-soft">
                We save a fingerprint of this trace on a public ledger, so anyone — including you —
                can check later that nothing was edited after the fact.
              </p>
              <MarginNote tone="stamp" className="mt-3">
                brands change their stories — the ledger doesn't.
              </MarginNote>
            </div>
            <Stamp country="Field record" code="PROOF" date="JEJAK" rotation={5} className="h-14 w-14 shrink-0" />
          </div>

          <section className="mt-6 border-t border-journal-rule pt-5" aria-label="Ledger record">
            <StellarTraceReceiptCard autoAnchor={true} />
          </section>

          <section className="mt-8 border-t border-journal-rule pt-5" aria-label="Support the makers">
            <h3 className="font-serif-display text-2xl text-journal-ink" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}>
              Support the makers <span className="font-plexmono text-xs uppercase tracking-[0.1em] text-journal-ink-soft">(test network)</span>
            </h3>
            <p className="mt-1 font-grotesk text-sm text-journal-ink-soft">
              Optional. Sends a small demonstration payment on the test network — no real money moves.
            </p>
            <div className="mt-3 border border-journal-rule bg-journal-card p-4">
              <MakerBridgeCard
                price={price}
                currency={currency}
                labourPct={labour.pct.mid}
                labourAmount={labour.amount}
                transparentLabourAmount={labour.amount}
              />
            </div>
          </section>

          <section className="mt-8 border-t border-journal-rule pt-5" aria-label="What is real vs estimated">
            <h3 className="font-serif-display text-2xl text-journal-ink" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}>
              What's real vs estimated
            </h3>
            <div className="mt-3 space-y-2 font-grotesk text-sm leading-relaxed text-journal-ink-soft">
              <p><strong className="text-journal-ink">Real:</strong> the ledger fingerprint above, the label you scanned, and the photo you took.</p>
              <p><strong className="text-journal-ink">Estimated:</strong> the route upstream of the label, every money figure (always a range), and likely origins.</p>
            </div>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

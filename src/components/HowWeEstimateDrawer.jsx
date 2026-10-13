import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { BASIS_LABELS } from "@/lib/tokens";

// "How we estimate this" — methodology drawer, accessible from every screen.
export default function HowWeEstimateDrawer() {
  const { showHowTo, setShowHowTo, startGuidedTour } = useApp();
  return (
    <AnimatePresence>
      {showHowTo && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-jejak-navy/40 backdrop-blur-sm" onClick={() => setShowHowTo(false)} />
          <motion.div
            className="relative w-full max-w-[420px] frosted-strong rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto scrollbar-hide"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-jejak-navy/20" />
            <h3 className="text-lg font-extrabold text-jejak-navy">How we estimate this</h3>

            <div className="mt-4 space-y-3 text-sm text-jejak-navy/80">
              <p>
                Jejak turns a photo into a <strong>receipt for the physical supply chain</strong>. We estimate two things:
                where a product likely travelled, and how your payment splits across the people and steps behind it.
              </p>
              <p>
                Every figure you see is an <strong>estimate</strong>, shown as a range (low–high), not a precise fact.
                Confidence is labelled <strong>high</strong>, <strong>medium</strong> or <strong>low</strong>:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>High</strong> — backed by multiple public benchmarks.</li>
                <li><strong>Medium</strong> — a reasonable estimate from partial data.</li>
                <li><strong>Low</strong> — an AI inference, treat as indicative only.</li>
              </ul>
              <p>Each figure carries a <strong>basis label</strong> from this set only:</p>
              <div className="flex flex-wrap gap-2">
                {BASIS_LABELS.map((b) => (
                  <span key={b} className="rounded-full bg-jejak-navy/8 px-2.5 py-1 text-xs font-semibold text-jejak-navy">{b}</span>
                ))}
              </div>
              <p className="mt-2">
                <strong>What we do NOT know:</strong> specific factories, suppliers or worker names. We name countries and
                stage types only — never a facility as fact.
              </p>
              <p>
                <strong>Your photo isn't stored on your profile.</strong> It's uploaded privately and used only for the
                one-time recognition call, then discarded — we never keep it.
              </p>
              <div className="rounded-2xl bg-jejak-navy/6 border border-jejak-navy/15 p-3.5 text-xs space-y-1.5">
                <p className="font-extrabold text-jejak-navy uppercase tracking-wide text-[11px]">
                  What’s real vs. mocked in this prototype
                </p>
                <p>
                  <strong>Real:</strong> AI vision product recognition (via short-lived private signed URLs), live Stellar Testnet transactions (<code className="font-mono">payment</code>, <code className="font-mono">createClaimableBalance</code>, and <code className="font-mono">MEMO_TEXT</code> estimate records verifiable on Stellar.Expert), and the live Explore database feed.
                </p>
                <p>
                  <strong>Mocked / Future:</strong> Destination wallets are <strong>Demo co-op wallets (testnet)</strong>, not real partner cooperatives. Local mobile-money anchor off-ramps (SEP-24) and the Embedded Bank feed are illustrative previews of future integrations.
                </p>
              </div>
              <p className="text-jejak-navy/60 italic">
                We're not telling you what to buy — we're making the payment visible.
              </p>
            </div>

            <a
              href="mailto:errors@jejak.example?subject=Report%20an%20estimate%20error"
              className="mt-4 block w-full rounded-xl border border-jejak-navy/20 py-3 text-center text-sm font-bold text-jejak-navy no-tap"
            >
              Report an error (mock)
            </a>
            <button
              type="button"
              onClick={() => {
                setShowHowTo(false);
                startGuidedTour();
              }}
              className="mt-2 w-full rounded-xl bg-sunrise py-3 text-sm font-extrabold text-white shadow-sm no-tap"
            >
              Launch 15-second Guided Tour
            </button>
            <button
              type="button"
              onClick={() => setShowHowTo(false)}
              className="mt-2 w-full rounded-xl bg-jejak-navy py-3 text-sm font-bold text-white no-tap"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React from "react";
import MarginNote from "./MarginNote";
import JournalButton from "./JournalButton";

// Guided micro-tour callout: a paper card with step dots, Skip and a primary
// action. Fixed above the tab bar on mobile; a sticky card in the Journey
// entries column on desktop.
export default function TourCallout({
  step,
  marketName,
  onReadLabel,
  onNext,
  onOpenProof,
  onSkip,
}) {
  if (!step) return null;

  const copy = {
    1: {
      note: "start here",
      text: `Every stop is an estimate. Trade data shows who really supplies ${marketName}.`,
      action: "Read the label",
      onAction: onReadLabel,
    },
    2: {
      note: "nice",
      text: "A label turns a guess into a fact. This one is a sample.",
      action: "Next",
      onAction: onNext,
    },
    3: {
      note: "last one",
      text: "Follow the money, then open Proof to anchor this entry on Stellar.",
      action: "Open proof",
      onAction: onOpenProof,
    },
  }[step];
  if (!copy) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 border border-journal-rule bg-journal-card p-4 shadow-[0_18px_40px_-18px_rgba(30,27,22,0.4)] lg:static lg:z-auto">
      <div className="flex items-center justify-between">
        <span className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
          Tour {step}/3
        </span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full ${i === step ? "w-4 bg-journal-stamp" : "w-1.5 bg-journal-rule"}`}
            />
          ))}
        </span>
      </div>
      <p className="mt-2 font-grotesk text-sm leading-relaxed text-journal-ink">{copy.text}</p>
      <MarginNote tone="stamp" className="mt-1">{copy.note}</MarginNote>
      <div className="mt-3 flex items-center gap-4">
        <JournalButton onClick={copy.onAction}>{copy.action}</JournalButton>
        {step === 3 ? (
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft no-tap hover:text-journal-ink"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft no-tap hover:text-journal-ink"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

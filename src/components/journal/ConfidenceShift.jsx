import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import MarginNote from "./MarginNote";

const CONFIDENCE_WORD = { high: "sure", medium: "fairly sure", low: "rough guess" };
const CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 };

// The moment the estimate moves.
//
// Shown where the change happened, so "one fact and I got less vague" is
// something the user watches rather than something they're told. It also says
// what did NOT change — a label pins down where something was made, it does
// not price a factory. Being explicit about that is the whole point of the
// app, and hiding it would make the confidence swing look like a bigger
// claim than it is.
export default function ConfidenceShift({ before, after, reduce: reduceProp }) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceProp ?? reduceMotion;

  if (!before || !after) return null;

  const from = CONFIDENCE_RANK[before.provenanceConfidence] ?? 1;
  const to = CONFIDENCE_RANK[after.provenanceConfidence] ?? 1;
  const moved = to > from;
  const countryChanged =
    before.country && after.country && before.country.toLowerCase() !== after.country.toLowerCase();

  if (!moved && !countryChanged) return null;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mt-3 border border-dashed border-journal-stamp/50 bg-journal-stamp/5 p-3"
    >
      <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
        One fact in
      </p>

      {countryChanged && (
        <p className="mt-1.5 flex flex-wrap items-center gap-2 font-grotesk text-[13px] text-journal-ink">
          <span className="font-plexmono text-[11px] uppercase tracking-[0.08em] text-journal-ink-soft line-through">
            {before.country}
          </span>
          <ArrowRight size={13} className="shrink-0 text-journal-stamp" />
          <span className="font-medium">{after.country}</span>
        </p>
      )}

      {moved && (
        <p className="mt-1.5 flex flex-wrap items-center gap-2 font-grotesk text-[13px] text-journal-ink">
          <span className="font-plexmono text-[11px] uppercase tracking-[0.08em] text-journal-ink-soft line-through">
            {CONFIDENCE_WORD[before.provenanceConfidence] || "fairly sure"}
          </span>
          <ArrowRight size={13} className="shrink-0 text-journal-stamp" />
          <span className="font-medium">{CONFIDENCE_WORD[after.provenanceConfidence] || "fairly sure"}</span>
          <span className="font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
            where it was made
          </span>
        </p>
      )}

      <div className="mt-2">
        <MarginNote tone="stamp">
          {countryChanged
            ? "your label corrected my guess"
            : "that pinpoints where it was made"}
        </MarginNote>
      </div>
      <p className="mt-1.5 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-ink-soft">
        the money split is unchanged — one label doesn't price a factory
      </p>
    </motion.div>
  );
}

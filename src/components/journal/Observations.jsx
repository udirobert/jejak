import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import JournalButton from "./JournalButton";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

// What the app noticed while you were away.
//
// The most agentic thing a product can say is an observation the user never
// asked for — but only one it can actually back with a record. Every
// observation here is derived from the journal's own scans and letters, so it
// can't claim something the app doesn't know.
export default function Observations({ observations, onAction, reduce: reduceProp }) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceProp ?? reduceMotion;

  if (!observations || observations.length === 0) return null;

  return (
    <section className="mt-8" aria-label="What I noticed">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
          What I noticed
        </p>
        <span className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
          {observations.length} {observations.length === 1 ? "thing" : "things"}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {observations.map((o, i) => (
          <motion.div
            key={o.id}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="border-l-2 border-journal-stamp bg-journal-card p-4 shadow-[3px_3px_0_0_transparent]"
          >
            <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
              {o.kicker}
            </p>
            <h3 className="mt-1.5 font-serif-display text-xl leading-tight text-journal-ink" style={displayFont}>
              {o.title}
            </h3>
            <p className="mt-1.5 max-w-xl font-grotesk text-[14px] leading-relaxed text-journal-ink-soft">
              {o.body}
            </p>
            {o.action?.label && (
              <div className="mt-3">
                <JournalButton
                  variant="secondary"
                  onClick={() => onAction(o)}
                >
                  {o.action.label}
                </JournalButton>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

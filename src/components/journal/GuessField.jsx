import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const MIN_PCT = 1;
const MAX_PCT = 40;
const TICK_BASE = 9;
const TICK_STEP = 5;
const TICK_MAX_TIER = 4;

const pos = (pct) =>
  Math.max(0, Math.min(100, ((Number(pct) - MIN_PCT) / (MAX_PCT - MIN_PCT)) * 100));

// Where everyone stands.
//
// A hand-inked axis from 1% to 40%. One mark per person, stacked where they
// cluster. Your guess is the vermilion diamond. The app's own estimate is
// the faint band. Once the real number is out, a solid rule marks it.
//
// This is deliberately not a leaderboard. It doesn't rank people and it
// doesn't say who is right — it shows you where your belief sits among
// everyone else's, and where the trade data sits, so you can tell whether
// you were optimistic, cautious, or somewhere in the crowd.
export default function GuessField({
  fieldPcts = [],
  yourPct = null,
  actualPct = null,
  estimate = null,
  reduce: reduceProp,
}) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceProp ?? reduceMotion;

  const values = useMemo(
    () => (Array.isArray(fieldPcts) ? fieldPcts.map(Number).filter((n) => isFinite(n)) : []),
    [fieldPcts]
  );

  // Marks that land on the same number stack upward so none is hidden.
  const tiers = useMemo(() => {
    const seen = new Map();
    return values.map((v) => {
      const key = v.toFixed(1);
      const i = seen.get(key) || 0;
      seen.set(key, i + 1);
      return Math.min(i, TICK_MAX_TIER);
    });
  }, [values]);

  const hasField = values.length > 0;
  const showEstimate = estimate && isFinite(estimate.low) && isFinite(estimate.high);

  return (
    <div className="w-full select-none">
      {/* the axis */}
      <div className="relative h-[68px] w-full">
        {/* the app's estimate range — the faint band */}
        {showEstimate && (
          <motion.div
            initial={reduce ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              left: `${pos(estimate.low)}%`,
              width: `${Math.max(1.5, pos(estimate.high) - pos(estimate.low))}%`,
              transformOrigin: "left center",
            }}
            className="absolute bottom-[18px] top-[10px] border-x border-dashed border-journal-ink/25 bg-journal-ink/[0.07]"
            aria-hidden="true"
          />
        )}

        {/* everyone's guess, one mark each */}
        {values.map((v, i) => {
          const tier = tiers[i];
          const isYours = yourPct != null && Math.abs(v - Number(yourPct)) < 0.05;
          const h = TICK_BASE + tier * TICK_STEP;
          return (
            <motion.span
              key={`${v}-${i}`}
              initial={reduce ? false : { opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{
                duration: 0.34,
                delay: reduce ? 0 : Math.min(i, 20) * 0.03,
                ease: "easeOut",
              }}
              style={{
                left: `${pos(v)}%`,
                height: `${h}px`,
                transformOrigin: "bottom center",
              }}
              className={`absolute bottom-[18px] w-[2px] -translate-x-1/2 ${
                isYours ? "bg-journal-stamp" : "bg-journal-ink/60"
              }`}
              aria-hidden="true"
            />
          );
        })}

        {/* your guess — the vermilion diamond */}
        {yourPct != null && (
          <motion.span
            initial={reduce ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ left: `${pos(yourPct)}%` }}
            className="absolute bottom-[11px] z-10 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-journal-stamp shadow-[0_0_0_3px_var(--j-card)]"
            aria-hidden="true"
          />
        )}

        {/* the real number, once it's out */}
        {actualPct != null && (
          <motion.span
            initial={reduce ? false : { opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ left: `${pos(actualPct)}%` }}
            className="absolute bottom-[14px] top-[4px] z-20 w-[2px] -translate-x-1/2 bg-journal-ink"
            aria-hidden="true"
          />
        )}

        {/* the baseline */}
        <motion.span
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "left center" }}
          className="absolute bottom-[18px] left-0 h-[1.5px] w-full bg-journal-ink/50"
          aria-hidden="true"
        />
      </div>

      {/* axis labels */}
      <div className="relative h-4">
        {[1, 10, 20, 30, 40].map((t) => (
          <span
            key={t}
            style={{ left: `${pos(t)}%` }}
            className="absolute -translate-x-1/2 font-plexmono text-[9px] uppercase tracking-[0.08em] text-journal-ink-soft tabular-nums"
          >
            {t}
          </span>
        ))}
      </div>

      {/* legend */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-plexmono text-[9.5px] uppercase tracking-[0.08em] text-journal-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-0.5 bg-journal-stamp" />
          you
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-[2px] bg-journal-ink/60" />
          {hasField ? `${values.length} ${values.length === 1 ? "guess" : "guesses"}` : "no guesses yet"}
        </span>
        {showEstimate && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-3 border border-dashed border-journal-ink/25 bg-journal-ink/[0.07]" />
            my estimate
          </span>
        )}
        {actualPct != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-[2px] bg-journal-ink" />
            actual
          </span>
        )}
      </div>
    </div>
  );
}

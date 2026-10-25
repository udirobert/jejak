import { useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { formatMoney } from "@/lib/money";
import MarginNote from "./MarginNote";

const zigzagMask = {
  WebkitMaskImage:
    "conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) top / 14px 51% repeat-x, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 14px 51% repeat-x, linear-gradient(#000 0 0) center / 100% calc(100% - 20px) no-repeat",
  maskImage:
    "conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) top / 14px 51% repeat-x, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 14px 51% repeat-x, linear-gradient(#000 0 0) center / 100% calc(100% - 20px) no-repeat",
};

// Torn-paper receipt. lines: [{key,label,amount,amountLow,amountHigh,color}]
// highlightKey draws a hand-drawn red ellipse around that line + MarginNote.
export default function Receipt({
  title = "JEJAK FIELD RECEIPT",
  lines = [],
  total,
  currency = "GBP",
  highlightKey = null,
  highlightNote = null,
  onLineClick = null,
  className = "",
}) {
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const inView = useInView(rootRef, { once: true, margin: "0px 0px -10% 0px" });
  const fmt = (v) => formatMoney(v, currency);

  return (
    <div
      ref={rootRef}
      className={`bg-journal-card px-6 py-8 font-plexmono text-journal-ink ${className}`}
      style={{ ...zigzagMask, paddingTop: "2.4rem", paddingBottom: "2.4rem" }}
    >
      <div className="mb-1 text-center text-[11px] uppercase tracking-[0.18em] text-journal-ink-soft">{title}</div>
      <div className="mb-5 text-center text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
        — where the money went —
      </div>
      <div>
        {lines.map((l, i) => {
          const highlighted = l.key === highlightKey;
          return (
            <div key={l.key}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ delay: i * 0.12, duration: 0.35 }}
              onClick={onLineClick ? () => onLineClick(l.key) : undefined}
              onKeyDown={onLineClick ? (e) => { if (e.key === "Enter") onLineClick(l.key); } : undefined}
              role={onLineClick ? "button" : undefined}
              tabIndex={onLineClick ? 0 : undefined}
              className={`relative flex items-baseline gap-2 py-1.5 text-[12.5px] ${onLineClick ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp" : ""}`}
            >
              {l.color && (
                <span className="inline-block h-2.5 w-2.5 shrink-0 translate-y-[1px]" style={{ background: l.color }} aria-hidden="true" />
              )}
              <span className={`shrink-0 ${l.struck ? "text-journal-ink-soft line-through" : ""}`}>{l.label}</span>
              <span className="flex-1 border-b border-dotted border-journal-ink-soft/60" aria-hidden="true" />
              <span className="flex shrink-0 flex-col items-end">
                <span className="font-medium">{fmt(l.amount)}</span>
                {l.sub && <span className="text-[9px] text-journal-ink-soft">{l.sub}</span>}
              </span>
              {highlighted && (
                <motion.svg
                  className="pointer-events-none absolute -inset-x-3 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+24px)]"
                  viewBox="0 0 300 34"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M 8 17 C 8 4, 150 2, 240 5 C 292 7, 296 14, 294 20 C 290 32, 120 33, 40 30 C 12 29, 6 24, 10 15"
                    fill="none"
                    stroke="var(--j-stamp)"
                    strokeWidth="1.6"
                    initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                    animate={reduce || inView ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ delay: i * 0.12 + 0.3, duration: 0.7, ease: "easeOut" }}
                  />
                </motion.svg>
              )}
              {highlighted && highlightNote && (
                <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 translate-x-full md:block">
                  <MarginNote tone="stamp" arrow="left">{highlightNote}</MarginNote>
                </div>
              )}
            </motion.div>
            {highlighted && highlightNote && (
              <div className="py-1 md:hidden">
                <MarginNote tone="stamp">{highlightNote}</MarginNote>
              </div>
            )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-baseline gap-2 border-t border-journal-ink pt-3 text-sm font-medium">
        <span>TOTAL</span>
        <span className="flex-1 border-b border-dotted border-journal-ink-soft/60" aria-hidden="true" />
        <span>{fmt(total)}</span>
      </div>
      <div className="mt-3 text-center text-[9px] uppercase tracking-[0.15em] text-journal-ink-soft">
        figures are estimates · confidence varies
      </div>
    </div>
  );
}

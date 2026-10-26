import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Copy, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import JournalButton from "./JournalButton";
import MarginNote from "./MarginNote";
import { delegationState, nudgeDraft, DELEGATION_STAGES } from "@/lib/delegation";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

// The progress rail — the letter's position in its own lifecycle. It reads
// as work in progress rather than a row in a table.
function StageRail({ stage, reduce }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {DELEGATION_STAGES.map((key, i) => {
        const reached = i <= stage;
        return (
          <React.Fragment key={key}>
            {i > 0 && (
              <span
                className={`h-px w-4 ${i <= stage ? "bg-journal-stamp/70" : "bg-journal-rule"}`}
              />
            )}
            <span
              className={`block h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                reached ? "bg-journal-stamp" : "bg-journal-ink/20"
              }`}
              style={reached && !reduce ? { boxShadow: "0 0 0 2px rgba(200,68,43,0.14)" } : undefined}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

// A delegated question, shown as a task with a state the app keeps for you.
//
// The user handed this off. The app drafts it, watches the clock, reminds
// them when it's gone quiet, and drafts the follow-up — but the send button
// stays theirs.
export default function DelegationCard({ record, onUpdate, onOpen, autoNudge = false, reduce: reduceProp }) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceProp ?? reduceMotion;
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const nudgedRef = useRef(false);

  // An observation elsewhere on the page can ask for this letter's nudge to
  // be opened directly.
  useEffect(() => {
    if (!autoNudge || nudgedRef.current) return;
    nudgedRef.current = true;
    setNudgeOpen(true);
  }, [autoNudge]);

  const state = delegationState(record, now);
  if (!state) return null;

  const nudge = nudgeDraft(record);
  const closed = state.key === "closed";

  const toneClass =
    state.key === "replied"
      ? "text-journal-materials"
      : state.key === "overdue" || state.key === "flagged" || state.key === "escalated"
        ? "text-journal-stamp"
        : "text-journal-ink-soft";

  const markEscalated = async () => {
    try {
      await onUpdate(record.id, { status: "escalated" });
      setNudgeOpen(false);
    } catch {
      toast.error("Couldn't save that — try again.");
    }
  };

  return (
    <motion.div
      layout
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="border border-journal-rule bg-journal-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif-display text-lg leading-tight text-journal-ink" style={displayFont}>
            {record.brand}
          </p>
          <p className="font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
            {record.product_name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`font-plexmono text-[10px] uppercase tracking-[0.12em] ${toneClass}`}>
            {state.label}
          </span>
          <StageRail stage={state.stage} reduce={reduce} />
        </div>
      </div>

      <p className="mt-2 truncate font-grotesk text-[13px] text-journal-ink-soft">{record.subject}</p>

      <p className="mt-2 font-grotesk text-[14px] leading-relaxed text-journal-ink">{state.detail}</p>

      {state.canNudge && (
        <div className="mt-2">
          <MarginNote tone="stamp">I'll draft the follow-up — you send it</MarginNote>
        </div>
      )}

      {/* The drafted follow-up. */}
      <AnimatePresence>
        {nudgeOpen && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 border border-dashed border-journal-stamp/50 bg-journal-paper p-3">
              <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
                A short follow-up
              </p>
              <p className="mt-1.5 font-grotesk text-sm font-medium text-journal-ink">{nudge.subject}</p>
              <pre className="mt-1.5 whitespace-pre-wrap font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
                {nudge.body}
              </pre>
              <div className="mt-3 flex flex-wrap gap-4">
                <JournalButton
                  href={`mailto:?subject=${encodeURIComponent(nudge.subject)}&body=${encodeURIComponent(nudge.body)}`}
                >
                  <Mail size={13} /> Open in email app
                </JournalButton>
                <JournalButton
                  variant="secondary"
                  onClick={() => { navigator.clipboard?.writeText(`${nudge.subject}\n\n${nudge.body}`); toast.success("Copied"); }}
                >
                  <Copy size={13} /> Copy
                </JournalButton>
                <JournalButton variant="secondary" onClick={markEscalated}>
                  <Send size={13} /> I've sent the nudge
                </JournalButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!closed && (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-journal-rule pt-3">
          {state.canNudge && !nudgeOpen && (
            <button
              type="button"
              onClick={() => setNudgeOpen(true)}
              className="min-h-[44px] font-grotesk text-sm font-medium text-journal-stamp underline decoration-journal-stamp/40 underline-offset-4 no-tap hover:text-journal-ink"
            >
              Draft a nudge
            </button>
          )}
          {(state.key === "drafted" || state.key === "replied") && (
            <button
              type="button"
              onClick={() => onOpen(record)}
              className="min-h-[44px] font-grotesk text-sm font-medium text-journal-ink underline decoration-journal-stamp underline-offset-4 no-tap hover:text-journal-stamp"
            >
              {state.key === "replied" ? "Read the reply" : "Open the letter"}
            </button>
          )}
          {state.key !== "replied" && (
            <button
              type="button"
              onClick={() => onUpdate(record.id, { status: "replied" })}
              className="min-h-[44px] px-2 font-grotesk text-sm text-journal-ink underline decoration-journal-stamp underline-offset-4 no-tap"
            >
              Mark replied
            </button>
          )}
          <button
            type="button"
            onClick={() => onUpdate(record.id, { status: "closed" })}
            className="ml-auto min-h-[44px] px-2 font-grotesk text-sm text-journal-ink-soft no-tap hover:text-journal-ink"
          >
            Close
          </button>
        </div>
      )}
    </motion.div>
  );
}

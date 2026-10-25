import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import html2canvas from "html2canvas";
import Stamp from "./Stamp";
import { Share2, Loader2 } from "lucide-react";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

// Watches a Scan's story fields and renders the journal entry + postcard export.
export default function StoryCard({ scanId, productName, routeCodes, labourLine, currency }) {
  const reduce = useReducedMotion();
  const [scan, setScan] = useState(null);
  const [busy, setBusy] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (!scanId) return;
    let mounted = true;
    base44.entities.Scan.get(scanId).then((s) => mounted && setScan(s)).catch(() => {});
    const unsub = base44.entities.Scan.subscribe((event) => {
      if (event.type === "update" && event.data?.id === scanId) setScan(event.data);
    });
    return () => { mounted = false; unsub && unsub(); };
  }, [scanId]);

  if (!scanId) return null;
  const status = scan?.story_status || "pending";

  const makePostcard = async () => {
    if (!nodeRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(nodeRef.current, { scale: 2, backgroundColor: "#F3EDE2", logging: false });
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      const file = new File([blob], `${(scan?.story_title || "jejak-postcard").replace(/\W+/g, "-")}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: scan?.story_title || "Jejak postcard" });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
      }
    } catch {} finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-journal-rule bg-journal-card p-5 shadow-[0_10px_30px_-16px_rgba(30,27,22,0.3)]">
      <div ref={nodeRef} className="bg-journal-card p-1">
        <div className="flex items-baseline justify-between">
          <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">Field notes</p>
          <p className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">{routeCodes}</p>
        </div>
        {status === "done" ? (
          <>
            <h3 className="mt-3 font-serif-display text-2xl leading-tight text-journal-ink" style={displayFont}>
              {scan.story_title}
            </h3>
            <p className="mt-3 font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">{scan.story_text}</p>
            <p className="mt-3 border-t border-dotted border-journal-rule pt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
              {labourLine}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Stamp country="Field journal" code="STORY" date="WRITTEN" rotation={-5} className="h-11 w-11" />
              <span className="font-serif-display text-lg italic text-journal-ink" style={displayFont}>Jejak</span>
            </div>
          </>
        ) : status === "failed" ? (
          <p className="mt-3 font-grotesk text-sm text-journal-ink-soft">The story didn't come through this time — the trace itself is still yours.</p>
        ) : (
          <div className="mt-4 flex items-center gap-3" role="status" aria-label="Writing your journal entry">
            <motion.svg width="34" height="22" viewBox="0 0 34 22" aria-hidden="true">
              <motion.path
                d="M 2 14 C 6 4, 10 20, 14 10 C 17 3, 20 18, 24 12 C 27 8, 30 14, 32 11"
                fill="none" stroke="var(--j-ink)" strokeWidth="1.6" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 1] }}
                transition={reduce ? { duration: 0.2 } : { duration: 1.6, repeat: Infinity, times: [0, 0.6, 1], repeatDelay: 0.4 }}
              />
            </motion.svg>
            <p className="font-grotesk text-sm text-journal-ink-soft">Writing your journal entry…</p>
          </div>
        )}
      </div>
      {status === "done" && (
        <button
          type="button"
          onClick={makePostcard}
          disabled={busy}
          className="mt-3 flex min-h-[44px] items-center gap-2 font-grotesk text-sm font-medium text-journal-ink underline decoration-journal-stamp underline-offset-4 no-tap disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} strokeWidth={1.5} />}
          Make a postcard
        </button>
      )}
    </div>
  );
}

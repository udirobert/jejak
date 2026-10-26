import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import JournalButton from "./JournalButton";
import { toast } from "sonner";
import { CheckSquare, Copy, Mail, Send } from "lucide-react";
import { REMIND_DAYS } from "@/lib/delegation";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

// "Ask the brand" — drafts a transparency letter, the user sends it themselves.
//
// Two modes:
//   new      — no record: draft a letter from a scan/product
//   existing — a record: open the letter that's already in the journal, edit
//              it, and mark it sent. The journal's delegated items open here.
//
// Jejak never emails brands on the user's behalf. It drafts, it follows up,
// it reports back — the send button stays with the user.
export default function AskBrandSheet({ open, onClose, scan = null, product = null, record = null }) {
  const { labelEvidence, savedScanId } = useApp();
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [brand, setBrand] = useState(scan?.brand || product?.brand || record?.brand || "");
  const [drafting, setDrafting] = useState(false);
  const [rec, setRec] = useState(record);
  const [subject, setSubject] = useState(record?.subject || "");
  const [body, setBody] = useState(record?.body || "");
  const [questions, setQuestions] = useState(record?.questions || []);

  // Re-sync whenever the sheet is opened, so a re-opened letter shows its
  // saved state rather than a stale draft.
  useEffect(() => {
    if (!open) return;
    setRec(record);
    setBrand(record?.brand || scan?.brand || product?.brand || "");
    setSubject(record?.subject || "");
    setBody(record?.body || "");
    setQuestions(record?.questions || []);
  }, [open, record, scan, product]);

  if (!open) return null;

  const draft = async () => {
    if (!brand.trim()) return;
    setDrafting(true);
    try {
      const estimated = (product?.route || [])
        .filter((s) => s.basis !== "Read from label")
        .map((s) => `${s.stage} (${s.country})`);
      const res = await base44.functions.invoke("draftBrandLetter", {
        scan_id: scan?.id || savedScanId || "",
        brand: brand.trim(),
        productName: product?.name || scan?.product_name || "this product",
        labelCountry: labelEvidence?.country_of_manufacture || scan?.label_country || "",
        labelMaterials: labelEvidence?.fibre_composition || scan?.label_materials || "",
        estimatedStages: estimated,
      });
      const created = res?.data?.record;
      if (created) {
        setRec(created);
        setSubject(created.subject);
        setBody(created.body);
        setQuestions(created.questions || []);
      }
    } catch {
      toast.error("Couldn't draft the letter right now — try again.");
    } finally {
      setDrafting(false);
    }
  };

  const markSent = async () => {
    if (!rec) return;
    const now = new Date();
    const remind = new Date(now.getTime() + REMIND_DAYS * 24 * 3600 * 1000);
    try {
      await base44.entities.BrandRequest.update(rec.id, {
        status: "sent",
        sent_at: now.toISOString(),
        remind_at: remind.toISOString(),
        reminded: false,
        subject,
        body,
      });
      toast.success(`Sent. I'll check back in ${REMIND_DAYS} days if they haven't replied.`);
      onClose();
    } catch {
      toast.error("Couldn't save that — try again.");
    }
  };

  const isExisting = Boolean(rec);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-journal-ink/40" onClick={onClose} />
        <motion.div
          className="relative max-h-[88vh] w-full max-w-xl overflow-y-auto border border-journal-rule bg-journal-card p-6 pb-8 font-grotesk text-journal-ink scrollbar-hide lg:mx-4"
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 360, damping: 34 }}
        >
          <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp">Ask the brand</p>
          <h3 className="mt-1 font-serif-display text-3xl text-journal-ink" style={displayFont}>Ask them what they know</h3>

          {!isAuthenticated ? (
            <div className="mt-5 border border-journal-rule bg-journal-paper p-4">
              <p className="font-grotesk text-sm text-journal-ink-soft">Sign in to draft a letter — it's kept in your journal so you can follow up.</p>
              <div className="mt-3"><JournalButton onClick={navigateToLogin}>Sign in</JournalButton></div>
            </div>
          ) : !rec ? (
            <div className="mt-5">
              <label className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft" htmlFor="ab-brand">Brand</label>
              <input
                id="ab-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Uniqlo"
                className="mt-1 w-full border border-journal-rule bg-journal-paper px-3 py-2.5 font-grotesk text-sm text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
              />
              <div className="mt-4">
                <JournalButton onClick={draft} className={drafting ? "opacity-60" : ""}>
                  {drafting ? "Drafting…" : "Draft the letter"}
                </JournalButton>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <label className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft" htmlFor="ab-subject">Subject</label>
                <input
                  id="ab-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full border border-journal-rule bg-journal-paper px-3 py-2 font-grotesk text-sm text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                />
              </div>
              <div>
                <label className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft" htmlFor="ab-body">Letter</label>
                <textarea
                  id="ab-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={9}
                  className="mt-1 w-full border border-journal-rule bg-journal-paper px-3 py-2 font-grotesk text-sm leading-relaxed text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                />
              </div>
              {questions.length > 0 && (
                <div>
                  <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">What you're asking</p>
                  <ul className="mt-1 space-y-1.5">
                    {questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 font-grotesk text-sm text-journal-ink">
                        <CheckSquare size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-journal-stamp" /> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-4 border-t border-journal-rule pt-4">
                <JournalButton href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                  <Mail size={14} /> Open in email app
                </JournalButton>
                <JournalButton variant="secondary" onClick={() => { navigator.clipboard?.writeText(`${subject}\n\n${body}`); toast.success("Copied"); }}>
                  <Copy size={13} /> Copy letter
                </JournalButton>
                {rec.status !== "sent" && rec.status !== "escalated" && (
                  <JournalButton variant="secondary" onClick={markSent}>
                    <Send size={13} /> I've sent it
                  </JournalButton>
                )}
              </div>
              <p className="font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
                Jejak never emails brands for you — you stay in control.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

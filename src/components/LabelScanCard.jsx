import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import { vibrate } from "@/lib/haptics";
import Stamp from "./journal/Stamp";
import MarginNote from "./journal/MarginNote";
import JournalButton from "./journal/JournalButton";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";

const SAMPLE_LABELS = {
  hoodie: {
    readable: true,
    country_of_manufacture: "Bangladesh",
    fibre_composition: "80% cotton, 20% recycled polyester",
    care_or_brand_text: "Wash cold 30°C · Do not tumble dry",
  },
  trainers: {
    readable: true,
    country_of_manufacture: "Vietnam",
    fibre_composition: "Engineered mesh upper, EVA foam midsole, rubber outsole",
    care_or_brand_text: "Made in Vietnam · UK 9 / EU 43",
  },
  coffee: {
    readable: true,
    country_of_manufacture: "Ethiopia",
    fibre_composition: "100% Arabica whole bean · Yirgacheffe washed",
    care_or_brand_text: "Altitude 1,950m · Roasted in UK",
  },
  phone_case: {
    readable: true,
    country_of_manufacture: "China",
    fibre_composition: "65% recycled TPU, 35% polycarbonate",
    care_or_brand_text: "Made in Shenzhen, P.R.C.",
  },
};

export default function LabelScanCard() {
  const { product, labelEvidence, setLabelEvidence } = useApp();
  const camRef = useRef(null);
  const libRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [skipped, setSkipped] = useState(false);

  const handleLabelFile = async (files) => {
    const file = files && files[0];
    if (!file) return;
    vibrate(8);
    setScanning(true);
    setErrorMsg(null);
    setSkipped(false);
    try {
      // Uploaded privately for one-time vision extraction; never stored publicly.
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      const res = await base44.functions.invoke("identifyProduct", {
        mode: "label",
        file_url: signed_url,
      });
      const data = res?.data || {};
      if (data.readable && (data.country_of_manufacture || data.fibre_composition)) {
        setLabelEvidence({
          readable: true,
          country_of_manufacture: data.country_of_manufacture || "",
          fibre_composition: data.fibre_composition || "",
          care_or_brand_text: data.care_or_brand_text || "",
          basis: "Read from label",
          confidence: "high",
          scannedAt: new Date().toISOString(),
        });
      } else {
        setErrorMsg(
          "Couldn't read a clear country or material on that photo. Try a closer shot, use a sample label, or skip."
        );
      }
    } catch {
      setErrorMsg(
        "Label scan couldn't complete right now. You can retry, test with a sample label, or skip."
      );
    } finally {
      setScanning(false);
    }
  };

  const applySampleLabel = () => {
    vibrate(8);
    setErrorMsg(null);
    setSkipped(false);
    const sample = SAMPLE_LABELS[product.id] || SAMPLE_LABELS.hoodie;
    setLabelEvidence({
      ...sample,
      basis: "Read from label",
      confidence: "high",
      isSampleLabel: true,
      scannedAt: new Date().toISOString(),
    });
  };

  if (skipped && !labelEvidence) {
    return (
      <div className="mt-4 flex items-center justify-between border border-journal-rule bg-journal-card px-3 py-2 text-xs text-journal-ink">
        <span className="font-grotesk text-journal-ink-soft">
          Label scan skipped · all stages shown as estimated
        </span>
        <button
          type="button"
          onClick={() => setSkipped(false)}
          className="font-medium text-journal-ink underline decoration-journal-stamp underline-offset-4 no-tap"
        >
          Scan label
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-journal-rule bg-journal-card p-4 shadow-[0_10px_30px_-16px_rgba(30,27,22,0.3)]">
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleLabelFile(e.target.files)}
      />
      <input
        ref={libRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleLabelFile(e.target.files)}
      />

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-serif-display text-xl text-journal-ink" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}>
            {labelEvidence ? "Read from the label" : "Got the label?"}
          </p>
          <p className="mt-0.5 font-grotesk text-[13px] text-journal-ink-soft">
            {labelEvidence
              ? "This stage is now fact; everything upstream stays estimated."
              : "Snap the care tag and we'll read where it was really made."}
          </p>
        </div>
        {labelEvidence && (
          <button
            type="button"
            onClick={() => setLabelEvidence(null)}
            className="flex shrink-0 items-center gap-0.5 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft no-tap hover:text-journal-ink"
          >
            <RotateCcw size={10} /> Clear
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {scanning && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 bg-journal-ink px-3 py-2 font-plexmono text-[11px] uppercase tracking-[0.1em] text-journal-paper"
          >
            <Loader2 size={14} className="animate-spin text-journal-stamp" />
            <span>Reading the label…</span>
          </motion.div>
        )}

        {!scanning && labelEvidence && (
          <motion.div
            key="evidence"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mt-3 border border-journal-rule bg-journal-paper p-3"
          >
            <div className="absolute -right-3 -top-4">
              <Stamp shape="rect" country="Verified" code="LABEL" date="READ" rotation={6} animate />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1 font-grotesk text-sm font-medium text-journal-ink">
                <CheckCircle2 size={14} className="shrink-0 text-journal-materials" />
                {labelEvidence.country_of_manufacture
                  ? `Made in ${labelEvidence.country_of_manufacture}`
                  : "Origin read from label"}
                {labelEvidence.fibre_composition
                  ? ` · ${labelEvidence.fibre_composition}`
                  : ""}
              </span>
              <MarginNote tone="stamp">read from the label</MarginNote>
            </div>
            {labelEvidence.care_or_brand_text && (
              <p className="mt-1 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-ink-soft">
                “{labelEvidence.care_or_brand_text}”
                {labelEvidence.isSampleLabel ? " · sample label" : ""}
              </p>
            )}
          </motion.div>
        )}

        {!scanning && !labelEvidence && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {errorMsg && (
              <div className="mt-2 flex items-start gap-1.5 border border-journal-stamp/40 bg-journal-stamp/10 p-2 text-[12px] text-journal-ink">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-journal-stamp" />
                <span>{errorMsg}</span>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <JournalButton onClick={() => camRef.current?.click()}>
                <Camera size={13} /> Snap the label
              </JournalButton>
              <JournalButton variant="secondary" onClick={() => libRef.current?.click()}>
                Upload tag photo
              </JournalButton>
              <JournalButton variant="secondary" onClick={applySampleLabel}>
                Try a sample label
              </JournalButton>
              <button
                type="button"
                onClick={() => setSkipped(true)}
                className="ml-auto min-h-[44px] px-1.5 font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft no-tap hover:text-journal-ink"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
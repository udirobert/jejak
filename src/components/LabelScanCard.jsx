import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import ConfidenceBadge from "./ConfidenceBadge";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import {
  Tag,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
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
      <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-white/55 px-3 py-2 text-xs text-jejak-navy">
        <span className="font-semibold text-jejak-navy/75">
          Label scan skipped · all stages shown as Estimated
        </span>
        <button
          type="button"
          onClick={() => setSkipped(false)}
          className="font-extrabold text-jejak-navy underline no-tap"
        >
          Scan label
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2.5 rounded-2xl frosted-strong border border-white/85 p-3 shadow-sm">
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
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-jejak-navy text-amber-300">
            <Tag size={13} />
          </span>
          <div>
            <p className="text-xs font-extrabold text-jejak-navy">
              {labelEvidence ? "Provenance evidence · Read from label" : "Add provenance evidence · Scan care or Made-in label"}
            </p>
            <p className="text-[10px] font-semibold text-jejak-navy/60">
              {labelEvidence
                ? "Anchors final manufacture country & fibre content; upstream stages stay Estimated."
                : "Optional: extract stated origin country & fibre composition via private AI vision."}
            </p>
          </div>
        </div>
        {labelEvidence && (
          <button
            type="button"
            onClick={() => setLabelEvidence(null)}
            className="flex items-center gap-0.5 text-[10px] font-bold text-jejak-navy/55 hover:text-jejak-navy no-tap shrink-0"
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
            className="mt-2.5 flex items-center gap-2 rounded-xl bg-jejak-navy px-3 py-2 text-xs font-bold text-white"
          >
            <Loader2 size={14} className="animate-spin text-amber-300" />
            <span>Reading country of manufacture & fibre content from label…</span>
          </motion.div>
        )}

        {!scanning && labelEvidence && (
          <motion.div
            key="evidence"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 rounded-xl bg-jejak-materials/15 border border-jejak-materials/40 p-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-jejak-navy">
                <CheckCircle2 size={13} className="text-jejak-materials shrink-0" />
                {labelEvidence.country_of_manufacture
                  ? `Made in ${labelEvidence.country_of_manufacture}`
                  : "Origin read from label"}
                {labelEvidence.fibre_composition
                  ? ` · ${labelEvidence.fibre_composition}`
                  : ""}
              </span>
              <div className="flex items-center gap-1">
                <span className="rounded-full bg-jejak-navy px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
                  Read from label
                </span>
                <ConfidenceBadge level="high" />
              </div>
            </div>
            {labelEvidence.care_or_brand_text && (
              <p className="mt-1 text-[10px] font-semibold text-jejak-navy/70">
                Label text: “{labelEvidence.care_or_brand_text}”
                {labelEvidence.isSampleLabel ? " (sample label)" : ""}
              </p>
            )}
          </motion.div>
        )}

        {!scanning && !labelEvidence && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {errorMsg && (
              <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/35 p-2 text-[11px] font-semibold text-jejak-navy">
                <AlertCircle size={14} className="text-jejak-labour shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <motion.button
                type="button"
                whileTap={TAP}
                onClick={() => camRef.current?.click()}
                className="flex items-center gap-1 rounded-xl bg-jejak-navy px-2.5 py-1.5 text-[11px] font-extrabold text-white no-tap"
              >
                <Camera size={12} className="text-amber-300" /> Scan label
              </motion.button>
              <motion.button
                type="button"
                whileTap={TAP}
                onClick={() => libRef.current?.click()}
                className="flex items-center gap-1 rounded-xl bg-white/80 border border-jejak-navy/15 px-2.5 py-1.5 text-[11px] font-extrabold text-jejak-navy no-tap"
              >
                <ImageIcon size={12} /> Upload tag photo
              </motion.button>
              <motion.button
                type="button"
                whileTap={TAP}
                onClick={applySampleLabel}
                className="flex items-center gap-1 rounded-xl bg-amber-300/30 border border-amber-500/40 px-2.5 py-1.5 text-[11px] font-extrabold text-jejak-navy no-tap"
              >
                <Sparkles size={11} /> Try sample label
              </motion.button>
              <button
                type="button"
                onClick={() => setSkipped(true)}
                className="ml-auto px-1.5 py-1 text-[10px] font-bold text-jejak-navy/55 hover:text-jejak-navy no-tap"
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
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { getProduct } from "@/data";
import ScreenShell from "@/components/ScreenShell";
import ProductPicker from "@/components/ProductPicker";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { vibrate } from "@/lib/haptics";

// The vision-at-work reveal: the photo stays anchored while the model "sees"
// it — attributes stream in one by one, collapse into a product card, then
// launch in one continuous motion into the journey.
const SCAN_MSGS = [
  "Reading the photo…",
  "Detecting edges & colour…",
  "Matching materials…",
  "Estimating likely origin…",
];

const ATTR_LABELS = {
  colour: "Colour",
  material: "Material",
  category: "Category",
  likely_origin: "Likely origin",
};

export default function Identifying() {
  const {
    photo,
    photoUrl,
    product,
    setProduct,
    setScreen,
    setLowConfidence,
    lowConfidence,
    guessedLabourPct,
    setGuessedLabourPct,
    reset,
  } = useApp();
  const reduce = useReducedMotion();
  const [scanDone, setScanDone] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [phase, setPhase] = useState("scanning"); // scanning | attributes | matched | launching
  const [recognized, setRecognized] = useState(null); // data | "ok" | "fail" | null
  const [revealedAttrs, setRevealedAttrs] = useState(0);
  const [failed, setFailed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const launchedRef = useRef(false);

  // Minimum scan time + cycling status messages.
  useEffect(() => {
    const t = setTimeout(() => setScanDone(true), reduce ? 1200 : 2400);
    const c = setInterval(() => setMsgIdx((i) => (i + 1) % SCAN_MSGS.length), 900);
    return () => { clearTimeout(t); clearInterval(c); };
  }, [reduce]);

  // Run recognition only for an uploaded photo. Chip picks skip it.
  useEffect(() => {
    let cancelled = false;
    if (!photo) { setRecognized("ok"); return; }
    if (photoUrl === "") { setRecognized("fail"); return; }
    if (!photoUrl) return; // still uploading
    base44.functions
      .invoke("identifyProduct", { file_url: photoUrl })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        if (data.product_id && data.product_id !== "unknown") setRecognized(data);
        else setRecognized("fail");
      })
      .catch(() => !cancelled && setRecognized("fail"));
    return () => { cancelled = true; };
  }, [photo, photoUrl]);

  // Safety: if upload never resolves, fail gracefully.
  useEffect(() => {
    if (!photo || photoUrl || recognized) return;
    const t = setTimeout(() => setRecognized((r) => r || "fail"), 12000);
    return () => clearTimeout(t);
  }, [photo, photoUrl, recognized]);

  // Drive phase from recognition result once the scan min-time is met.
  useEffect(() => {
    if (!scanDone || recognized === null) return;
    if (recognized === "fail") { setFailed(true); setPickerOpen(true); return; }
    if (recognized === "ok") { setPhase("matched"); return; }
    setPhase("attributes");
  }, [scanDone, recognized]);

  // Stream detected attributes one by one, then collapse into the matched card.
  useEffect(() => {
    if (phase !== "attributes" || !recognized || recognized === "ok" || recognized === "fail") return;
    const entries = recognized.attributes
      ? Object.entries(recognized.attributes).filter(([, v]) => v && String(v).trim())
      : [];
    if (entries.length === 0) { setPhase("matched"); return; }
    const timers = [];
    entries.forEach((_, i) => {
      timers.push(setTimeout(() => { vibrate(8); setRevealedAttrs(i + 1); }, reduce ? 100 : 420 * i + 220));
    });
    timers.push(setTimeout(() => setPhase("matched"), reduce ? 350 : 420 * entries.length + 220 + 650));
    return () => timers.forEach(clearTimeout);
  }, [phase, recognized, reduce]);

  // Matched: lock in the product, hold the card, then launch.
  useEffect(() => {
    if (phase !== "matched") return;
    if (recognized && recognized !== "ok" && recognized !== "fail") {
      const p = getProduct(recognized.product_id);
      if (p) { setProduct(p); setLowConfidence(recognized.confidence === "low"); }
    }
    const t = setTimeout(() => { vibrate(12); setPhase("launching"); }, reduce ? 350 : 950);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Launch: card zooms into the globe — one continuous motion into the journey.
  useEffect(() => {
    if (phase !== "launching" || launchedRef.current) return;
    launchedRef.current = true;
    const t = setTimeout(() => setScreen("journey"), reduce ? 200 : 680);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPickerPick = (id) => {
    setProduct(getProduct(id));
    setLowConfidence(true);
    setPickerOpen(false);
    vibrate(10);
    setScreen("journey");
  };

  const attrs = recognized && recognized.attributes
    ? Object.entries(recognized.attributes).filter(([, v]) => v && String(v).trim())
    : [];
  const confidenceLevel = recognized?.confidence || (lowConfidence ? "low" : "medium");

  return (
    <ScreenShell header={false} variant="sunrise">
      <div className="flex flex-1 flex-col px-6 pb-10 pt-14">
        {/* Anchored photo / viewfinder */}
        <div className="mx-auto w-full max-w-[300px]">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl frosted-strong">
            {photo ? (
              <img src={photo} alt="Your scan" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">{product.emoji}</div>
            )}
            <div className="absolute inset-0 bg-jejak-navy/10" />

            {phase === "scanning" && (
              <motion.div
                className="absolute inset-x-0 h-1"
                style={{ background: "linear-gradient(90deg, transparent, #FFC24B, transparent)", boxShadow: "0 0 18px #FFC24B" }}
                initial={{ top: "10%" }}
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={reduce ? { duration: 0.4 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {/* viewfinder corner brackets */}
            <div className="pointer-events-none absolute inset-3 rounded-2xl">
              <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-xl border-l-2 border-t-2 border-white/80" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-xl border-r-2 border-t-2 border-white/80" />
              <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-xl border-b-2 border-l-2 border-white/80" />
              <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-xl border-b-2 border-r-2 border-white/80" />
            </div>

            {/* matched checkmark flash */}
            <AnimatePresence>
              {(phase === "matched" || phase === "launching") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-jejak-navy/25"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 16 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-extrabold text-jejak-materials"
                  >
                    ✓
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status / streaming attributes / product card */}
        <div className="mt-6 flex flex-1 flex-col items-center">
          <AnimatePresence mode="wait">
            {phase === "scanning" && (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <p className="text-lg font-bold text-white">{failed ? "Couldn't identify this one" : SCAN_MSGS[msgIdx]}</p>
                <p className="mt-2 rounded-full bg-white/25 px-3 py-1 text-[11px] font-bold text-white/90">AI vision at work</p>
              </motion.div>
            )}

            {phase === "attributes" && (
              <motion.div key="attrs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-[300px]">
                <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-white/70">What I see</p>
                <div className="space-y-1.5">
                  {attrs.slice(0, revealedAttrs).map(([key, val]) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -16, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      className="flex items-center justify-between rounded-xl frosted px-3.5 py-2"
                    >
                      <span className="text-xs font-semibold text-jejak-navy/55">{ATTR_LABELS[key] || key}</span>
                      <span className="text-sm font-extrabold capitalize text-jejak-navy">{val}</span>
                    </motion.div>
                  ))}
                  {revealedAttrs < attrs.length && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70" />
                      <span className="text-xs font-semibold text-white/70">analysing…</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {(phase === "matched" || phase === "launching") && (
              <motion.div
                key="card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: phase === "launching" ? 0 : 1, scale: phase === "launching" ? 1.3 : 1 }}
                transition={phase === "launching" ? { duration: 0.6, ease: "easeIn" } : { type: "spring", stiffness: 260, damping: 20 }}
                className="flex flex-col items-center"
              >
                <span className="text-6xl">{product.emoji}</span>
                <p className="mt-3 text-xl font-extrabold text-white">{product.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <ConfidenceBadge level={confidenceLevel} />
                  <span className="text-[11px] font-bold text-white/80">Estimated match</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-white/80">Tracing the journey…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive "Guess the Maker Share" micro-hook while vision runs */}
          <div className="mt-auto w-full max-w-[300px] pt-4">
            <div className="rounded-2xl frosted border border-white/80 p-3">
              <div className="flex items-center justify-between text-xs font-extrabold text-jejak-navy">
                <span>Quick guess: maker share?</span>
                <span className="rounded-full bg-jejak-labour/20 px-2 py-0.5 text-jejak-labour tabular-nums">
                  {guessedLabourPct ?? 15}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={40}
                step={1}
                value={guessedLabourPct ?? 15}
                onChange={(e) => {
                  vibrate(4);
                  setGuessedLabourPct(Number(e.target.value));
                }}
                className="mt-1.5 w-full accent-jejak-navy cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-semibold text-jejak-navy/55">
                <span>1%</span>
                <span>Slide to lock your guess before reveal</span>
                <span>40%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductPicker
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); reset(); }}
        onPick={onPickerPick}
        message="We couldn't identify this one. Pick the closest match and we'll show a category-level estimate."
      />
    </ScreenShell>
  );
}
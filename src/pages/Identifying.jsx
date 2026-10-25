import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { getProduct } from "@/data";
import ScreenShell from "@/components/ScreenShell";
import ProductPicker from "@/components/ProductPicker";
import Stamp from "@/components/journal/Stamp";
import Specimen from "@/components/journal/Specimen";
import MarginNote from "@/components/journal/MarginNote";
import { vibrate } from "@/lib/haptics";

// The vision-at-work reveal: the photo/specimen stays put while
// attributes type in one by one in Plex Mono, then a postmark stamps IDENTIFIED.
const SCAN_MSGS = [
  "Uploading your photo privately…",
  "Asking a vision model what this is…",
  "Matching it to a product type…",
  "Looking up trade data…",
];

const ATTR_LABELS = {
  colour: "Colour",
  material: "Material",
  category: "Category",
};

const CONFIDENCE_WORD = { high: "sure", medium: "fairly sure", low: "rough guess" };

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
    pendingDescribe,
    setPendingDescribe,
    customPrice,
    market,
    reset,
  } = useApp();
  const reduce = useReducedMotion();
  const [scanDone, setScanDone] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [phase, setPhase] = useState("scanning"); // scanning | attributes | matched | launching
  const [recognized, setRecognized] = useState(null); // data | "ok" | "fail" | null
  const [revealedAttrs, setRevealedAttrs] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const launchedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setScanDone(true), reduce ? 1200 : 2400);
    const c = setInterval(() => setMsgIdx((i) => (i + 1) % SCAN_MSGS.length), 900);
    return () => { clearTimeout(t); clearInterval(c); };
  }, [reduce]);

  useEffect(() => {
    let cancelled = false;
    // Describe-it path: trace directly via the AI engine.
    if (pendingDescribe && !photo) {
      setRecognized(null);
      base44.functions
        .invoke("traceAnything", {
          description: pendingDescribe.description,
          market,
          price: pendingDescribe.price ?? customPrice ?? null,
          brand: pendingDescribe.brand || undefined,
        })
        .then((res) => {
          if (cancelled) return;
          const data = res?.data || {};
          if (data.ok && data.product) {
            setProduct(data.product);
            setRecognized({ description: pendingDescribe.description, confidence: data.product.confidence });
            setPhase("attributes");
          } else {
            setRecognized("fail");
          }
        })
        .catch(() => !cancelled && setRecognized("fail"));
      return () => { cancelled = true; };
    }
    if (!photo) { setRecognized("ok"); return; }
    if (photoUrl === "") { setRecognized("fail"); return; }
    if (!photoUrl) return;
    base44.functions
      .invoke("identifyProduct", { file_url: photoUrl })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        const confident = data.product_id && data.product_id !== "unknown" &&
          (data.confidence === "high" || data.confidence === "medium");
        if (confident) setRecognized(data);
        else if (data.description) {
          // AI trace fallback: trace the described item directly.
          base44.functions
            .invoke("traceAnything", {
              description: data.description,
              brand: data.brand || undefined,
              market,
              price: customPrice ?? null,
            })
            .then((r) => {
              if (cancelled) return;
              const d = r?.data || {};
              if (d.ok && d.product) {
                setProduct(d.product);
                setRecognized({ attributes: { description: data.description }, confidence: d.product.confidence });
                setPhase("attributes");
              } else setRecognized("fail");
            })
            .catch(() => !cancelled && setRecognized("fail"));
        }
        else setRecognized("fail");
      })
      .catch(() => !cancelled && setRecognized("fail"));
    return () => { cancelled = true; };
  }, [photo, photoUrl]);

  useEffect(() => {
    if (!photo || photoUrl || recognized) return;
    const t = setTimeout(() => setRecognized((r) => r || "fail"), 12000);
    return () => clearTimeout(t);
  }, [photo, photoUrl, recognized]);

  useEffect(() => {
    if (!scanDone || recognized === null) return;
    if (recognized === "fail") { setPickerOpen(true); return; }
    if (recognized === "ok") { setPhase("matched"); return; }
    setPhase("attributes");
  }, [scanDone, recognized]);

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

  useEffect(() => {
    if (phase !== "matched") return;
    if (recognized && recognized !== "ok" && recognized !== "fail") {
      const p = getProduct(recognized.product_id);
      if (p) { setProduct(p); setLowConfidence(recognized.confidence === "low"); }
    }
    const t = setTimeout(() => { vibrate(12); setPhase("launching"); }, reduce ? 350 : 950);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "launching" || launchedRef.current) return;
    launchedRef.current = true;
    const t = setTimeout(() => { setPendingDescribe(null); setScreen("journey"); }, reduce ? 200 : 680);
    return () => clearTimeout(t);
  }, [phase]);

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
    <ScreenShell section="Trace · identifying">
      <div className="flex flex-1 flex-col items-center px-6 pb-10 pt-10 lg:pt-16">
        <button
          type="button"
          onClick={() => { setPendingDescribe(null); reset(); }}
          className="mb-4 self-start font-grotesk text-sm font-medium text-journal-ink-soft no-tap hover:text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
        >
          ← Cancel
        </button>
        {/* Photo / specimen in a polaroid */}
        <div className="relative w-full max-w-[320px] rotate-[-1.5deg] border border-journal-rule bg-journal-card p-3 shadow-[0_18px_40px_-18px_rgba(30,27,22,0.35)]">
          <div className="relative aspect-square w-full overflow-hidden border border-journal-rule bg-journal-paper">
            {photo ? (
              <img src={photo} alt="Your scan" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full p-8">
                <Specimen product={product} className="h-full w-full" title="Your item" />
              </div>
            )}

            {phase === "scanning" && (
              <motion.div
                className="absolute inset-x-0 h-[2px] bg-journal-stamp"
                style={{ boxShadow: "0 0 14px rgba(200,68,43,0.65)" }}
                initial={{ top: "8%" }}
                animate={{ top: ["8%", "92%", "8%"] }}
                transition={reduce ? { duration: 0.4 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {/* IDENTIFIED postmark */}
            <AnimatePresence>
              {(phase === "matched" || phase === "launching") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Stamp shape="rect" country="Identified" code={product.id.toUpperCase().slice(0, 10)} date="FIELD JOURNAL" rotation={-8} animate={!reduce} className="bg-journal-card/80" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-2 text-center font-hand text-xl text-journal-ink">
            {phase === "scanning" ? (pendingDescribe ? "sketching the route…" : "reading…") : product?.name || "Your item"}
          </p>
        </div>

        {/* Status / streaming attributes */}
        <div className="mt-6 flex w-full max-w-[340px] flex-1 flex-col items-center">
          <AnimatePresence mode="wait">
            {phase === "scanning" && (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <p className="font-grotesk text-lg font-medium text-journal-ink">{SCAN_MSGS[msgIdx]}</p>
                <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
                  Estimating, not certain
                </p>
              </motion.div>
            )}

            {phase === "attributes" && (
              <motion.div key="attrs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="w-full">
                <p className="mb-3 text-center font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">
                  {pendingDescribe ? "Sketching the route" : "What we see"}
                </p>
                <div className="space-y-1.5">
                  {attrs.slice(0, revealedAttrs).map(([key, val]) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-baseline justify-between border-b border-dotted border-journal-rule py-1.5 font-plexmono text-[12px]"
                    >
                      <span className="uppercase tracking-[0.1em] text-journal-ink-soft">
                        {(ATTR_LABELS[key] || key).toUpperCase()} —
                      </span>
                      <span className="font-medium text-journal-ink">{String(val)}</span>
                    </motion.div>
                  ))}
                  {revealedAttrs < attrs.length && (
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-journal-stamp" />
                      <span className="font-plexmono text-[11px] text-journal-ink-soft">analysing…</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {(phase === "matched" || phase === "launching") && (
              <motion.div
                key="card"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === "launching" ? 0 : 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <p
                  className="font-serif-display text-3xl text-journal-ink"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
                >
                  {product?.name || "Your item"}
                </p>
                <p className="mt-1 font-plexmono text-[11px] uppercase tracking-[0.14em] text-journal-ink-soft">
                  estimated match · {CONFIDENCE_WORD[confidenceLevel] || "fairly sure"}
                </p>
                <p className="mt-3 font-grotesk text-sm text-journal-ink-soft">Tracing the journey…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pre-reveal guess while vision runs */}
          <div className="mt-auto w-full pt-6">
            <div className="border border-journal-rule bg-journal-card p-4">
              <div className="flex items-center justify-between font-plexmono text-[11px] uppercase tracking-[0.12em]">
                <span className="text-journal-ink-soft">Guess first — maker share</span>
                <span className="font-medium text-journal-stamp">{guessedLabourPct ?? 15}%</span>
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
                aria-label="Guess the maker share percent"
                className="mt-2 w-full cursor-pointer accent-journal-stamp"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="font-plexmono text-[10px] text-journal-ink-soft">1%</span>
                <MarginNote tone="ink">lock it before the reveal</MarginNote>
                <span className="font-plexmono text-[10px] text-journal-ink-soft">40%</span>
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

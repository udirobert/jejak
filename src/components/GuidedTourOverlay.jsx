import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import { vibrate } from "@/lib/haptics";
import { Sparkles, ArrowRight, X, CheckCircle2 } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Step 1 of 4 · Trace Where It Came From",
    body: "Snap any item with your camera or tap one of the 4 sample products below. Let's trace the Everyday Hoodie.",
    cta: "Trace the Hoodie",
  },
  {
    title: "Step 2 of 4 · Provenance, Label Scan & Stellar Anchor",
    body: "Inspect each stage's provenance basis ('Read from label' vs 'Estimated'), scan a care label, and anchor the SHA-256 provenance record on Stellar Testnet.",
    cta: "Next: Follow the Money",
  },
  {
    title: "Step 3 of 4 · Follow the Money (Layer 2)",
    body: "See the estimated 5-way cost split, or optionally send a demo testnet donation to a demo cause wallet.",
    cta: "Next: Embedded Concept",
  },
  {
    title: "Step 4 of 4 · Embedded Bank Concept",
    body: "Preview how provenance and cost splits could appear inside a banking feed (concept preview).",
    cta: "Finish Guided Tour",
  },
];

export default function GuidedTourOverlay() {
  const {
    tourStep,
    setTourStep,
    endGuidedTour,
    setProduct,
    setScreen,
    setCustomPrice,
    setMakerTip,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (tourStep == null) return null;
  const current = TOUR_STEPS[tourStep] || TOUR_STEPS[0];

  const advance = () => {
    vibrate(10);
    if (tourStep === 0) {
      setProduct(getProduct("hoodie"));
      setCustomPrice(null);
      setMakerTip(0);
      if (location.pathname !== "/") navigate("/");
      setScreen("journey");
      setTourStep(1);
    } else if (tourStep === 1) {
      setScreen("split");
      setTourStep(2);
    } else if (tourStep === 2) {
      setScreen("home");
      navigate("/embedded");
      setTourStep(3);
    } else {
      endGuidedTour();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={`tour-${tourStep}`}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="fixed top-3 inset-x-0 z-[75] mx-auto w-[92%] max-w-[400px] pointer-events-auto"
      >
        <div className="rounded-3xl bg-jejak-navy text-white p-4 shadow-2xl border-2 border-amber-300/80">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-jejak-navy">
                <Sparkles size={13} />
              </span>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                {current.title}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                vibrate(6);
                endGuidedTour();
              }}
              aria-label="Exit guided tour"
              className="rounded-full p-1 text-white/60 hover:text-white no-tap"
            >
              <X size={15} />
            </button>
          </div>

          <p className="mt-2 text-xs font-semibold leading-relaxed text-white/90">
            {current.body}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === tourStep ? 18 : 6,
                    background: i <= tourStep ? "#FFC24B" : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={advance}
              className="flex items-center gap-1.5 rounded-xl bg-amber-300 px-3.5 py-2 text-xs font-extrabold text-jejak-navy shadow-md hover:bg-amber-200 no-tap"
            >
              {tourStep === TOUR_STEPS.length - 1 ? (
                <>
                  <CheckCircle2 size={14} /> {current.cta}
                </>
              ) : (
                <>
                  {current.cta} <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
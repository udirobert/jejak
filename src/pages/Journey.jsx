import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getRoute, formatMoney } from "@/lib/money";
import { routeDistance } from "@/lib/metrics";
import ScreenShell from "@/components/ScreenShell";
import Globe from "@/components/Globe";
import StageIllustration from "@/components/StageIllustration";
import TodaySnapPulse from "@/components/TodaySnapPulse";
import CoachmarkPill from "@/components/CoachmarkPill";
import LabelScanCard from "@/components/LabelScanCard";
import StellarTraceReceiptCard from "@/components/StellarTraceReceiptCard";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import {
  ArrowRight,
  MapPin,
  Compass,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function Journey() {
  const {
    product,
    market,
    currency,
    setScreen,
    shareMode,
    setShareMode,
    labelEvidence,
  } = useApp();
  const reduce = useReducedMotion();
  const rawRoute = getRoute(product, market);
  const totalKm = routeDistance(product, market);
  const price = product.markets[market].price;

  // Enrich each stage with an honest provenance basis badge:
  // Only the final-manufacture stage gets "Read from label" (high confidence) when a care/Made-in
  // label has been scanned; all upstream and retail stages remain "Estimated" (medium/low confidence).
  const route = rawRoute.map((stop, idx) => {
    const isFinalManufactureIdx = idx === rawRoute.length - 2;
    const labelMatchesStage =
      Boolean(labelEvidence?.readable) && isFinalManufactureIdx;

    return {
      ...stop,
      country:
        labelMatchesStage && labelEvidence.country_of_manufacture
          ? labelEvidence.country_of_manufacture
          : stop.country,
      provenanceBasis: labelMatchesStage ? "Read from label" : "Estimated",
      provenanceConfidence: labelMatchesStage
        ? "high"
        : product.confidence || "medium",
    };
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(true);
  const [pulseOpen, setPulseOpen] = useState(false);

  // Auto-advance the stepper through each stop once so the 3D globe spins stop-to-stop.
  useEffect(() => {
    setActiveIdx(0);
    setAutoPlaying(true);
  }, [product.id, market]);

  // When a label is scanned, jump focus to the final manufacture stage to highlight the anchored fact.
  useEffect(() => {
    if (labelEvidence?.readable && rawRoute.length >= 2) {
      setAutoPlaying(false);
      setActiveIdx(rawRoute.length - 2);
    }
  }, [labelEvidence, rawRoute.length]);

  useEffect(() => {
    if (!autoPlaying || reduce) return;
    if (activeIdx >= route.length - 1) {
      setAutoPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      vibrate(5);
      setActiveIdx((i) => Math.min(route.length - 1, i + 1));
    }, 1500);
    return () => clearTimeout(t);
  }, [activeIdx, autoPlaying, route.length, reduce]);

  const currentStop = route[activeIdx] || route[0];

  const selectStop = (i) => {
    vibrate(6);
    setAutoPlaying(false);
    setActiveIdx(i);
  };

  return (
    <ScreenShell variant="sunrise">
      <div className="flex flex-1 flex-col px-5 pb-8">
        {/* Compact Provenance Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              <Compass size={11} /> Provenance · {route.length}-stage route
            </span>
            <span className="rounded-full bg-jejak-navy/30 px-2.5 py-0.5 text-[11px] font-extrabold text-white tabular-nums">
              {totalKm.toLocaleString()} km
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            {product.emoji} {product.name} · Where it came from
          </h1>
        </motion.div>

        <CoachmarkPill
          id="journey_globe"
          stepBadge="Layer 1 · Provenance"
          text="Inspect each stage's basis ('Read from label' vs 'Estimated'), scan a care label, and anchor the SHA-256 record on Stellar Testnet."
          variant="dark"
        />

        {/* Interactive 3D Globe */}
        <div className="relative mt-1.5 flex flex-col items-center justify-center">
          <div className="rounded-full bg-white/20 p-1.5 backdrop-blur-sm shadow-xl">
            <Globe
              route={route}
              activeStop={route.length}
              size={250}
              focusedIdx={activeIdx}
              onSelectStop={selectStop}
            />
          </div>
        </div>

        {/* Single-Card Progressive Disclosure Stage Stepper with Provenance Basis Badges */}
        <div className="mt-2.5">
          {/* Interactive step pills */}
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1">
              {route.map((s, i) => {
                const isCurr = i === activeIdx;
                const isLabelVerified = s.provenanceBasis === "Read from label";
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectStop(i)}
                    className={`h-6 rounded-full px-2.5 text-[10px] font-extrabold transition-all no-tap flex items-center gap-1 ${
                      isCurr
                        ? "bg-jejak-navy text-white shadow"
                        : "bg-white/45 text-jejak-navy/85 hover:bg-white/75"
                    }`}
                  >
                    <span>
                      {i + 1}. {s.country}
                    </span>
                    {isLabelVerified && (
                      <CheckCircle2
                        size={10}
                        className={isCurr ? "text-amber-300" : "text-jejak-materials"}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => selectStop((activeIdx - 1 + route.length) % route.length)}
                aria-label="Previous stop"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-jejak-navy no-tap"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => selectStop((activeIdx + 1) % route.length)}
                aria-label="Next stop"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-jejak-navy no-tap"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Animated active stage card with bespoke SVG illustration & Provenance Basis badge */}
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-3 rounded-2xl frosted-strong border border-white/85 p-3 shadow-md"
          >
              <StageIllustration stage={currentStop.stage} index={activeIdx} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="truncate text-sm font-extrabold text-jejak-navy">
                    {activeIdx + 1}. {currentStop.stage}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                        currentStop.provenanceBasis === "Read from label"
                          ? "bg-jejak-navy text-amber-300"
                          : "bg-jejak-navy/10 text-jejak-navy/75"
                      }`}
                    >
                      {currentStop.provenanceBasis}
                    </span>
                    <ConfidenceBadge level={currentStop.provenanceConfidence} />
                  </div>
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-jejak-navy/75">
                  <MapPin size={11} className="text-jejak-coral shrink-0" />{" "}
                  <span>{currentStop.country}</span> ·{" "}
                  <span className="font-semibold text-jejak-navy/60 truncate">
                    {currentStop.note}
                  </span>
                </p>
                {currentStop.provenanceBasis === "Read from label" &&
                  labelEvidence?.fibre_composition && (
                    <p className="mt-1 text-[10px] font-extrabold text-jejak-materials">
                      Label composition: {labelEvidence.fibre_composition}
                    </p>
                  )}
              </div>
          </motion.div>
        </div>

        {/* Step 3: Care / Made-in Label Scan (Provenance Evidence) */}
        <LabelScanCard />

        {/* Step 4: End-to-End Stellar Trace Receipt (Tracing -> Anchoring -> Anchored + Verify) */}
        <StellarTraceReceiptCard autoAnchor={true} />

        {/* Step 6: "Others traced this" + Privacy / Community choice (default Private) */}
        <div className="mt-2.5">
          {!pulseOpen ? (
            <button
              type="button"
              onClick={() => {
                vibrate(5);
                setPulseOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl bg-white/55 px-3 py-2 text-[11px] font-bold text-jejak-navy no-tap"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-jejak-navy/70" />
                Others traced this · Sharing:{" "}
                <strong className="capitalize">{shareMode}</strong> (default off)
              </span>
              <span className="underline opacity-80">Inspect / Change</span>
            </button>
          ) : (
            <TodaySnapPulse
              product={product}
              shareMode={shareMode}
              setShareMode={setShareMode}
            />
          )}
        </div>

        {/* Layer 2 transition: Follow the money */}
        <motion.button
          type="button"
          whileTap={TAP}
          onClick={() => {
            vibrate(8);
            setScreen("split");
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-jejak-navy py-3.5 text-sm font-extrabold text-white shadow-lg no-tap"
        >
          Follow the money ({formatMoney(price, currency)} cost split) <ArrowRight size={16} />
        </motion.button>
      </div>
    </ScreenShell>
  );
}
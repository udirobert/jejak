import React, { useState, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { formatMoney } from "@/lib/money";
import { annotateRoute, evidenceIndex, getTradeEvidence } from "@/lib/provenance";
import { routeDistance, haversine } from "@/lib/metrics";
import ScreenShell from "@/components/ScreenShell";
import RouteMap from "@/components/journal/RouteMap";
import MarginNote from "@/components/journal/MarginNote";
import JournalButton from "@/components/journal/JournalButton";
import TradeEvidence from "@/components/journal/TradeEvidence";
import TourCallout from "@/components/journal/TourCallout";
import LabelScanCard, { sampleLabelFor } from "@/components/LabelScanCard";
import ProofDrawer from "@/components/journal/ProofDrawer";
import { useTour, setTourStep, endTour } from "@/lib/tour";
import { vibrate } from "@/lib/haptics";
import { ChevronLeft, ChevronRight } from "lucide-react";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };
const CONFIDENCE_WORD = { high: "sure", medium: "fairly sure", low: "rough guess" };
const MARKET_NAME = { GB: "the UK", SG: "Singapore" };

const BASIS_NOTE = {
  "Read from label": { tone: "stamp", text: "read from the label" },
  "Sample label": { tone: "ink", text: "sample label (demo)" },
  "Trade data": { tone: "ink", text: "trade data" },
  Estimated: { tone: "ink", text: "estimated" },
};

export default function Journey() {
  const {
    product,
    market,
    currency,
    setScreen,
    labelEvidence,
    setLabelEvidence,
  } = useApp();
  const reduce = useReducedMotion();
  const tourStep = useTour();
  const rawRoute = product ? annotateRoute(product, market, labelEvidence) : [];
  const evidence = product ? getTradeEvidence(product, market) : null;
  const evIdx = product ? evidenceIndex(product, market) : -1;
  const totalKm = product ? routeDistance(product, market) : 0;
  const price = product?.markets?.[market]?.price ?? 0;
  const [proofOpen, setProofOpen] = useState(false);
  const route = rawRoute;

  const [activeIdx, setActiveIdx] = useState(0);
  const stripRef = useRef(null);
  const moneyBtnRef = useRef(null);
  const programmaticScroll = useRef(false);

  useEffect(() => {
    setActiveIdx(0);
  }, [product?.id, market]);

  // When a label lands, focus the stage it verified.
  useEffect(() => {
    if (labelEvidence?.readable && evIdx >= 0) {
      setActiveIdx(evIdx);
    }
  }, [labelEvidence, evIdx]);

  // Keep the mobile card strip in sync when the map drives the selection.
  useEffect(() => {
    const strip = stripRef.current;
    const card = strip?.children?.[activeIdx];
    if (!card) return;
    programmaticScroll.current = true;
    card.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
    const t = setTimeout(() => {
      programmaticScroll.current = false;
    }, reduce ? 60 : 500);
    return () => clearTimeout(t);
  }, [activeIdx, reduce]);

  // User swipes the strip -> the map follows (ignored while we scroll programmatically).
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return;
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Array.prototype.indexOf.call(strip.children, e.target);
            if (i >= 0) setActiveIdx((cur) => (cur === i ? cur : i));
          }
        }
      },
      { root: strip, threshold: 0.6 }
    );
    Array.from(strip.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [route.length]);

  const selectStop = (i) => {
    vibrate(6);
    setActiveIdx(i);
  };

  const scrollEvidenceIntoView = () => {
    stripRef.current?.children?.[evIdx]?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
    document.getElementById(`stop-entry-${evIdx}`)?.scrollIntoView({
      block: "center",
      behavior: reduce ? "auto" : "smooth",
    });
  };

  if (!product) {
    setScreen("home");
    return null;
  }

  const entryBody = (stop, i) => (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif-display text-2xl text-journal-ink md:text-3xl" style={displayFont}>
          {stop.stage}
        </h3>
        <span className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
          {i === 0 ? "origin" : `+${Math.round(haversine(rawRoute[i - 1], rawRoute[i])).toLocaleString()} km`}
        </span>
      </div>
      <p className="mt-2 font-grotesk text-[14px] leading-relaxed text-journal-ink-soft">
        {stop.note} · {stop.country}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <MarginNote tone={BASIS_NOTE[stop.provenanceBasis]?.tone || "ink"}>
          {BASIS_NOTE[stop.provenanceBasis]?.text || "estimated"}
        </MarginNote>
        <span className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
          {CONFIDENCE_WORD[stop.provenanceConfidence] || "fairly sure"}
        </span>
        {stop.tradeShare != null && (
          <span className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
            {stop.tradeShare}% of imports
          </span>
        )}
      </div>
      {stop.provenanceBasis === "Read from label" && labelEvidence?.fibre_composition && (
        <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-ink-soft">
          label: {labelEvidence.fibre_composition}
        </p>
      )}
      {stop.isEvidenceStop && (
        <TradeEvidence evidence={evidence} highlightCountry={stop.country} market={market} />
      )}
    </>
  );

  const marketName = MARKET_NAME[market] || market;

  return (
    <ScreenShell section="Trace · the journey">
      {/* Title row */}
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-6 lg:px-10 lg:pt-10">
        <div>
          <button
            type="button"
            onClick={() => setScreen("home")}
            className="mb-2 flex min-h-[44px] items-center gap-1 font-grotesk text-sm font-medium text-journal-ink-soft no-tap hover:text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
          >
            <ChevronLeft size={16} /> New entry
          </button>
          <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
            Where it came from
          </p>
          <h1 className="mt-2 font-serif-display text-4xl text-journal-ink md:text-5xl" style={displayFont}>
            {product.name}
          </h1>
          <p className="mt-1 font-plexmono text-[11px] uppercase tracking-[0.14em] text-journal-ink-soft">
            {route.length} stops · {totalKm.toLocaleString()} km · {product.markets[market].retailer}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setProofOpen(true)}
          className="inline-flex min-h-[44px] rotate-[-3deg] flex-col items-center justify-center border-[1.5px] border-journal-stamp px-3 py-1.5 font-plexmono text-journal-stamp shadow-[inset_0_0_0_1.5px_var(--j-card),inset_0_0_0_3px_var(--j-stamp)] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
          aria-label="Open proof record"
        >
          <span className="text-[9px] uppercase tracking-[0.08em]">Open</span>
          <span className="text-[12px] font-medium uppercase tracking-[0.08em]">Proof</span>
        </button>
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-10 lg:px-10">
        {/* Map — top on mobile, sticky left column on desktop */}
        <div className="sticky top-0 z-10 bg-journal-paper px-5 py-3 lg:top-6 lg:h-[82vh] lg:self-start lg:px-0 lg:py-0">
          <div className="flex h-full flex-col border border-journal-rule bg-journal-card p-3 shadow-[0_10px_30px_-14px_rgba(30,27,22,0.25)]">
            <div className="relative h-[38vh] min-h-[200px] flex-1 lg:h-auto">
              <RouteMap
                stops={route}
                progress={1}
                activeIndex={activeIdx}
                onSelectStop={selectStop}
                padDegrees={8}
                fill
                reducedMotion={reduce}
                aria-label={`Map of the ${product.name} route; select a stop to inspect it`}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
              <span>
                {String(activeIdx + 1).padStart(2, "0")} / {String(route.length).padStart(2, "0")} · {route[activeIdx]?.country}
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectStop((activeIdx - 1 + route.length) % route.length)}
                  aria-label="Previous stop"
                  className="flex h-8 w-8 items-center justify-center border border-journal-rule text-journal-ink no-tap hover:bg-journal-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => selectStop((activeIdx + 1) % route.length)}
                  aria-label="Next stop"
                  className="flex h-8 w-8 items-center justify-center border border-journal-rule text-journal-ink no-tap hover:bg-journal-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                >
                  <ChevronRight size={14} />
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Entries — vertical list on lg+, horizontal scroll-snap strip below lg */}
        <div className="px-5 lg:px-0">
          <div
            ref={stripRef}
            className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide lg:mx-0 lg:block lg:snap-none lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {route.map((stop, i) => (
              <button
                key={i}
                id={`stop-entry-${i}`}
                type="button"
                onClick={() => selectStop(i)}
                className={`block w-[85%] shrink-0 snap-center border-l-2 py-5 pl-4 text-left no-tap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp lg:w-full lg:shrink lg:snap-none ${
                  i === activeIdx
                    ? "border-journal-ink bg-journal-card/60"
                    : "border-journal-rule hover:border-journal-ink-soft"
                }`}
              >
                <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
                  Stop {String(i + 1).padStart(2, "0")} · {stop.country}
                </p>
                <div className="mt-1">{entryBody(stop, i)}</div>
              </button>
            ))}
          </div>

          <TourCallout
            step={tourStep}
            marketName={marketName}
            onReadLabel={() => {
              setLabelEvidence(sampleLabelFor(product.id));
              setActiveIdx(evIdx >= 0 ? evIdx : 0);
              setTourStep(2);
              scrollEvidenceIntoView();
            }}
            onNext={() => {
              setTourStep(3);
              moneyBtnRef.current?.scrollIntoView({
                block: "center",
                behavior: reduce ? "auto" : "smooth",
              });
            }}
            onOpenProof={() => {
              setProofOpen(true);
              endTour();
            }}
            onSkip={endTour}
          />

          <LabelScanCard />

          <div className="mt-6 flex items-center gap-4" ref={moneyBtnRef}>
            <JournalButton onClick={() => { vibrate(8); setScreen("split"); }}>
              Where did the {formatMoney(price, currency, { minDigits: 0, maxDigits: 0 })} go? →
            </JournalButton>
          </div>
          <p className="mt-3 pb-8 font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
            Route estimated · trade data shows who supplies {marketName} · only a label is a fact about your item
          </p>
        </div>
      </div>

      <ProofDrawer open={proofOpen} onOpenChange={setProofOpen} />
    </ScreenShell>
  );
}

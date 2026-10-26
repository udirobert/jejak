import React, { useEffect, useRef, useState } from "react";
import { motion, animate, useReducedMotion } from "framer-motion";
import { formatMoney } from "@/lib/money";
import { haversine } from "@/lib/metrics";
import RouteMap from "./RouteMap";
import MarginNote from "./MarginNote";
import JournalButton from "./JournalButton";
import TradeEvidence from "./TradeEvidence";
import ConfidenceShift from "./ConfidenceShift";
import TourCallout from "./TourCallout";
import Stamp from "./Stamp";
import Specimen from "./Specimen";
import PaperGrain from "./PaperGrain";
import { countryByName, annotateRoute } from "@/lib/provenance";
import LabelScanCard, { sampleLabelFor } from "@/components/LabelScanCard";
import { setTourStep, endTour } from "@/lib/tour";
import { vibrate } from "@/lib/haptics";
import { ChevronUp, X } from "lucide-react";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };
const CONFIDENCE_WORD = { high: "sure", medium: "fairly sure", low: "rough guess" };
const MARKET_NAME = { GB: "the UK", SG: "Singapore" };
const BASIS_NOTE = {
  "Read from label": { tone: "stamp", text: "read from the label" },
  "Sample label": { tone: "ink", text: "sample label (demo)" },
  "Trade data": { tone: "ink", text: "trade data" },
  Estimated: { tone: "ink", text: "estimated" },
};

const storyKey = (id) => `jejak:story:${id}`;

// Count-up price: the number ticks into place when the money card is reached.
// Runs once per mount, transform-only, no layout thrash.
function CountUp({ value, currency, reduce }) {
  const [n, setN] = useState(reduce ? value : 0);
  const ref = useRef(null);
  useEffect(() => {
    if (reduce) { setN(value); return; }
    let raf = 0;
    const ctl = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(v),
    });
    ref.current = ctl;
    return () => { ctl.stop(); cancelAnimationFrame(raf); };
  }, [value, reduce]);
  return <>{formatMoney(Math.round(n), currency, { minDigits: 0, maxDigits: 0 })}</>;
}

// Staggered entrance for a card's children — each line arrives on its own beat
// instead of the whole block fading up together.
function Stagger({ children, reduce, className = "" }) {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((c, i) => (
        <motion.div
          key={i}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.07, ease: [0.16, 1, 0.3, 1] }}
        >
          {c}
        </motion.div>
      ))}
    </div>
  );
}

// Dashed leg-arc: the distance travelled to reach this stop, drawn as a
// pencil line with the km stamped at its midpoint. Pure SVG, no re-render cost.
function LegArc({ km, index, reduce }) {
  const w = 240;
  const h = 34;
  const bow = 12;
  return (
    <div className="mt-5 flex items-center gap-3" aria-hidden="true">
      <span className="font-plexmono text-[9px] uppercase tracking-[0.12em] text-journal-ink-soft/70">
        {index === 0 ? "origin" : "leg"}
      </span>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[34px] flex-1" preserveAspectRatio="none">
        <motion.path
          d={`M 2 ${h - 4} Q ${w / 2} ${h - 4 - bow * 2} ${w - 2} ${h - 4}`}
          fill="none"
          stroke="var(--j-ink)"
          strokeWidth="1.5"
          strokeDasharray="5 6"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0, opacity: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 0.55 }}
          viewport={{ once: false, amount: 0.8 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <span className="font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink tabular-nums">
        {index === 0 ? "—" : `${km.toLocaleString()} km`}
      </span>
    </div>
  );
}

// Full-screen vertical story of a product's journey — the mobile presentation
// layer for Journey. Card 0 is the map drawing itself edge-to-edge; cards
// 1..n are one stop each with a persistent mini-map inset; the last card is
// the money teaser that hands off to the split screen.
export default function JourneyStory({
  product,
  market,
  currency,
  price,
  route,
  totalKm,
  labelEvidence,
  setLabelEvidence,
  evidence,
  evIdx,
  tourStep,
  onOpenProof,
  setScreen,
}) {
  const reduce = useReducedMotion();
  const scroller = useRef(null);
  const cardRefs = useRef([]);
  const [activeCard, setActiveCard] = useState(0);
  const [heroProgress, setHeroProgress] = useState(reduce ? 1 : 0);
  const [scrollY, setScrollY] = useState(0);
  const [vh, setVh] = useState(844);
  const nStops = route.length;
  const lastCard = nStops + 1; // 0 = hero, 1..nStops = stops, lastCard = money
  const marketName = MARKET_NAME[market] || market;

  // Hero draw-on animation (same choreography as the desktop intro).
  useEffect(() => {
    if (reduce) return;
    const ctl = animate(0, 1, {
      duration: Math.max(2.0, nStops * 0.6),
      ease: "easeInOut",
      onUpdate: setHeroProgress,
    });
    return () => ctl.stop();
  }, [reduce, nStops, product?.id]);

  // Returning visitor: skip straight to the money card.
  useEffect(() => {
    if (product?.id && sessionStorage.getItem(storyKey(product.id))) {
      requestAnimationFrame(() => {
        scroller.current?.scrollTo({ top: scroller.current.clientHeight * lastCard, behavior: "auto" });
        setActiveCard(lastCard);
      });
    }
  }, [product?.id, lastCard]);

  // Track the active card; haptic tick on change.
  useEffect(() => {
    const root = scroller.current;
    if (!root || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = cardRefs.current.indexOf(e.target);
            if (i >= 0) {
              setActiveCard((cur) => {
                if (cur !== i) vibrate(4);
                return i;
              });
              if (i === lastCard && product?.id) sessionStorage.setItem(storyKey(product.id), "1");
            }
          }
        }
      },
      { root, threshold: 0.55 }
    );
    cardRefs.current.forEach((c) => c && io.observe(c));
    return () => io.disconnect();
  }, [nStops, lastCard, product?.id]);

  const goTo = (i) => {
    const root = scroller.current;
    if (!root) return;
    root.scrollTo({ top: root.clientHeight * i, behavior: reduce ? "auto" : "smooth" });
  };

  // Scroll offset drives the specimen parallax and the route-line marker.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    setVh(root.clientHeight || 844);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(root.scrollTop);
        ticking = false;
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => setVh(root.clientHeight || 844));
    ro.observe(root);
    return () => { root.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, []);

  // The stop the mini-map highlights: hero shows the full route; stop cards
  // focus their own stop; money card parks on the destination.
  const mapIdx = activeCard === 0 ? null : Math.min(activeCard, nStops) - 1;
  const miniVisible = activeCard >= 1 && activeCard <= nStops;

  // What the estimate looked like before the user's label arrived. A sample
  // label is a demo, not a new fact, so it doesn't count as evidence here.
  const shift = (() => {
    if (!labelEvidence?.readable || labelEvidence?.isSampleLabel || evIdx < 0 || !product) return null;
    const before = annotateRoute(product, market, null)[evIdx];
    const after = route[evIdx];
    if (!before || !after) return null;
    return { before, after };
  })();

  // Route-line progress: 0..1 across the whole story, plus the parallax offset
  // for the specimen watermark (each card drifts at a different rate).
  const routeProgress = lastCard > 0 ? Math.min(1, Math.max(0, scrollY / (vh * lastCard))) : 0;
  const parallax = (cardIdx) => (scrollY - cardIdx * vh) * -0.06;

  return (
    <div className="fixed inset-0 z-40 bg-journal-paper">
      <PaperGrain />
      {/* scroll-snap story */}
      <div ref={scroller} className="h-dvh w-full snap-y snap-mandatory overflow-y-auto overscroll-contain scrollbar-hide">
        {/* ---- CARD 0: the map, full bleed ---- */}
        <section
          ref={(el) => (cardRefs.current[0] = el)}
          className="relative flex h-dvh w-full snap-start flex-col"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
            <div>
              <button
                type="button"
                onClick={() => setScreen("home")}
                className="pointer-events-auto mb-1 flex min-h-[36px] items-center gap-1 font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft no-tap"
                aria-label="Close story, new entry"
              >
                <X size={13} /> New entry
              </button>
              <p className="font-plexmono text-[10px] uppercase tracking-[0.18em] text-journal-stamp">
                Where it came from
              </p>
              <h1 className="mt-1 max-w-[70vw] font-serif-display text-4xl leading-[1.05] text-journal-ink" style={displayFont}>
                {product.name}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => { vibrate(5); onOpenProof(); }}
              className="pointer-events-auto inline-flex min-h-[44px] rotate-[-3deg] flex-col items-center justify-center border-[1.5px] border-journal-stamp bg-journal-card px-3 py-1.5 font-plexmono text-journal-stamp shadow-[inset_0_0_0_1.5px_var(--j-card),inset_0_0_0_3px_var(--j-stamp)] no-tap"
              aria-label="Open proof record"
            >
              <span className="text-[9px] uppercase tracking-[0.08em]">Open</span>
              <span className="text-[12px] font-medium uppercase tracking-[0.08em]">Proof</span>
            </button>
          </div>

          <div className="min-h-0 flex-1 px-2 pt-24">
            <RouteMap
              stops={route}
              progress={heroProgress}
              traveller
              stampStagger={0.1}
              padDegrees={8}
              fill
              reducedMotion={reduce}
              aria-label={`Map of the ${product.name} route`}
            />
          </div>

          <div className="z-10 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)] pt-4">
            <p className="text-center font-plexmono text-[11px] uppercase tracking-[0.14em] text-journal-ink-soft">
              {nStops} stops · {totalKm.toLocaleString()} km · {product?.markets?.[market]?.retailer}
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => { vibrate(6); goTo(lastCard); }}
                className="min-h-[44px] font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft underline decoration-journal-stamp/40 underline-offset-4 no-tap"
              >
                Skip to the money
              </button>
              <button
                type="button"
                onClick={() => { vibrate(6); goTo(1); }}
                className="flex min-h-[44px] min-w-[44px] animate-bounce items-center justify-center rounded-full border border-journal-rule bg-journal-card text-journal-ink shadow-sm no-tap"
                aria-label="Next: the first stop"
              >
                <ChevronUp size={18} className="rotate-180" />
              </button>
            </div>
          </div>
        </section>

        {/* ---- CARDS 1..n: one stop each ---- */}
        {route.map((s, i) => (
          <section
            key={i}
            ref={(el) => (cardRefs.current[i + 1] = el)}
            className="relative flex h-dvh w-full snap-start flex-col justify-center px-6"
          >
            {/* faint specimen watermark — gives sparse cards visual weight */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden pr-2 opacity-[0.07]"
              style={{ transform: `translateY(${reduce ? 0 : parallax(i + 1)}px)` }}
              aria-hidden="true"
            >
              <Specimen id={product.id} className="h-[52vh] w-[52vh] translate-x-1/4" drawIn={false} />
            </div>

            {/* postmark stamp for this stop */}
            <div className="pointer-events-none absolute left-5 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-10">
              <Stamp
                country={s.country}
                code={countryByName(s.country)?.code || s.code || String(i + 1).padStart(2, "0")}
                date={`STOP ${String(i + 1).padStart(2, "0")}/${String(nStops).padStart(2, "0")}`}
                rotation={i % 2 === 0 ? -7 : 5}
                animate={!reduce}
                className="h-14 w-14 opacity-85"
              />
            </div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.6 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-md"
            >
              <Stagger reduce={reduce}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
                  Stop {String(i + 1).padStart(2, "0")} · {s.country}
                </p>
                <p className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
                  {i === 0 ? "origin" : `+${Math.round(haversine(route[i - 1], route[i])).toLocaleString()} km`}
                </p>
              </div>
              <h2 className="mt-2 font-serif-display text-[2.6rem] leading-[1.02] text-journal-ink" style={displayFont}>
                {s.stage}
              </h2>
              <p className="mt-3 font-grotesk text-[16px] leading-relaxed text-journal-ink-soft">{s.note}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <MarginNote tone={BASIS_NOTE[s.provenanceBasis]?.tone || "ink"}>
                  {BASIS_NOTE[s.provenanceBasis]?.text || "estimated"}
                </MarginNote>
                <span className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
                  {CONFIDENCE_WORD[s.provenanceConfidence] || "fairly sure"}
                </span>
                {s.tradeShare != null && (
                  <span className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
                    {s.tradeShare}% of imports
                  </span>
                )}
              </div>

              {s.provenanceBasis === "Read from label" && labelEvidence?.fibre_composition && (
                <p className="mt-3 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-ink-soft">
                  label: {labelEvidence.fibre_composition}
                </p>
              )}

              {s.isEvidenceStop && (
                <div className="mt-4">
                  <TradeEvidence evidence={evidence} highlightCountry={s.country} market={market} />
                </div>
              )}

              {s.isEvidenceStop && shift && (
                <ConfidenceShift before={shift.before} after={shift.after} reduce={reduce} />
              )}

              {s.isEvidenceStop && !labelEvidence?.readable && (
                <div className="mt-3">
                  <MarginNote tone="ink">
                    {`I'm ${
                      CONFIDENCE_WORD[s.provenanceConfidence] || "fairly sure"
                    } about ${s.country} — that's the category's usual supplier, not your item.`}
                  </MarginNote>
                </div>
              )}

              <LegArc
                km={i === 0 ? 0 : Math.round(haversine(route[i - 1], route[i]))}
                index={i}
                reduce={reduce}
              />

              {i === evIdx && (
                <div className="mt-4">
                  <LabelScanCard />
                </div>
              )}
              </Stagger>
            </motion.div>

            {/* next-stop nudge */}
            {i < nStops - 1 && (
              <button
                type="button"
                onClick={() => goTo(i + 2)}
                className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] mx-auto flex min-h-[44px] w-fit items-center gap-1 font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft no-tap"
                aria-label={`Next stop: ${route[i + 1]?.stage}`}
              >
                {route[i + 1]?.stage} <ChevronUp size={14} className="rotate-180" />
              </button>
            )}
          </section>
        ))}

        {/* ---- LAST CARD: the money teaser ---- */}
        <section
          ref={(el) => (cardRefs.current[lastCard] = el)}
          className="relative flex h-dvh w-full snap-start flex-col justify-center px-6"
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-md"
          >
            <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
              The honest part
            </p>
            <h2 className="mt-2 font-serif-display text-[2.4rem] leading-[1.05] text-journal-ink" style={displayFont}>
              You paid <CountUp value={price} currency={currency} reduce={reduce} />.
            </h2>
            <p className="mt-2 font-grotesk text-[17px] leading-relaxed text-journal-ink-soft">
              How much of it do you think reached the people who made it? Guess first — the split reveals after.
            </p>

            {/* Consequence, stated plainly: the guess is committed before the
                answer is shown. */}
            <div className="mt-4 border-l-2 border-journal-stamp pl-3">
              <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
                And then it's on the record
              </p>
              <p className="mt-1 font-grotesk text-[14px] leading-relaxed text-journal-ink-soft">
                Your guess is hashed and written to a public ledger <em>before</em> the answer shows, so
                nobody — including me — can change it afterwards. The split gets anchored the same way.
                Open either one and check it without me.
              </p>
            </div>

            <TourCallout
              step={tourStep}
              marketName={marketName}
              onReadLabel={() => {
                setLabelEvidence(sampleLabelFor(product.id));
                setTourStep(2);
                goTo(evIdx >= 0 ? evIdx + 1 : 1);
              }}
              onNext={() => setTourStep(3)}
              onOpenProof={() => { onOpenProof(); endTour(); }}
              onSkip={endTour}
            />

            <div className="mt-6">
              <JournalButton onClick={() => { vibrate(8); setScreen("split"); }}>
                Where did the {formatMoney(price, currency, { minDigits: 0, maxDigits: 0 })} go? →
              </JournalButton>
            </div>
            <p className="mt-4 font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
              Route estimated · trade data shows who supplies {marketName} · only a label is a fact about your item
            </p>
          </motion.div>
        </section>
      </div>

      {/* ---- persistent mini-map inset (the Wrapped context element) ---- */}
      <motion.div
        animate={{ opacity: miniVisible ? 1 : 0, y: miniVisible ? 0 : -12 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="pointer-events-none absolute right-4 top-[calc(env(safe-area-inset-top,0px)+0.9rem)] z-50 w-[34vw] max-w-[180px] border border-journal-rule bg-journal-card/95 p-1.5 shadow-[0_10px_30px_-14px_rgba(30,27,22,0.35)] backdrop-blur-sm"
        aria-hidden={!miniVisible}
      >
        <div className="relative h-[22vw] max-h-[120px]">
          <RouteMap
            stops={route}
            progress={1}
            activeIndex={mapIdx ?? nStops - 1}
            padDegrees={10}
            fill
            stampAt={[]}
            reducedMotion
            aria-label=""
          />
        </div>
        <p className="mt-1 text-center font-plexmono text-[9px] uppercase tracking-[0.1em] text-journal-ink-soft">
          {miniVisible ? `${String(activeCard).padStart(2, "0")} / ${String(nStops).padStart(2, "0")}` : ""}
        </p>
      </motion.div>

      {/* ---- progress rail: the route as a vertical line, marker rides it ---- */}
      <div className="pointer-events-none absolute right-2 top-1/2 z-50 flex h-[46vh] -translate-y-1/2 flex-col items-center">
        <div className="relative w-px flex-1 bg-journal-ink/15">
          <div
            className="absolute left-0 top-0 w-px bg-journal-stamp/70"
            style={{ height: `${routeProgress * 100}%` }}
          />
          {Array.from({ length: lastCard + 1 }).map((_, i) => (
            <span
              key={i}
              className={`absolute left-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${
                i <= activeCard ? "bg-journal-stamp" : "bg-journal-ink/25"
              }`}
              style={{ top: `${(i / lastCard) * 100}%` }}
            />
          ))}
          <motion.span
            className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-journal-stamp bg-journal-card shadow-[0_0_0_3px_rgba(200,68,43,0.12)]"
            style={{ top: `${routeProgress * 100}%` }}
            animate={reduce ? {} : { scale: [1, 1.18, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}

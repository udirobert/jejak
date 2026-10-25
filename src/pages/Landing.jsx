import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useInView, animate } from "framer-motion";
import { PaperGrain, Stamp, MarginNote, JournalButton, RouteMap, Receipt } from "@/components/journal";
import Specimen from "@/components/journal/Specimen";
import { hoodie } from "@/data/hoodie";
import { PRODUCTS } from "@/data";
import { getRoute, computeSplit, formatMoney } from "@/lib/money";
import { haversine } from "@/lib/metrics";

const MARKET = "GB";
const route = getRoute(hoodie, MARKET);
const split = computeSplit(hoodie, MARKET);
const market = hoodie.markets[MARKET];

const RECEIPT_LABELS = {
  materials: "Materials",
  labour: "The people who made it",
  freight: "Freight & duties",
  brand: "Brand",
  retail: "Shop",
};
const CAT_INK = {
  materials: "var(--j-materials)",
  labour: "var(--j-labour)",
  freight: "var(--j-freight)",
  brand: "var(--j-brand)",
  retail: "var(--j-retail)",
};

function TypeOnView({ text, className = "", style, speed = 32, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (!inView || reduce) { if (inView) setN(text.length); return; }
    let i = 0;
    const t0 = setTimeout(() => {
      const id = setInterval(() => {
        i += 2;
        setN(Math.min(i, text.length));
        if (i >= text.length) clearInterval(id);
      }, speed * 2);
    }, delay);
    return () => { clearTimeout(t0); };
  }, [inView, reduce]);
  return (
    <span ref={ref} className={className} style={style}>
      {text.slice(0, n)}
      {inView && n < text.length && <span className="inline-block w-[0.5em] animate-pulse text-journal-stamp">▍</span>}
    </span>
  );
}

function LegworkReceipt() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const lines = [
    ["Merino jumper", "45.00"],
    ["Running socks", "12.00"],
    ["Coffee beans 250g", "9.00"],
    ["Phone charger", "19.00"],
  ];
  return (
    <div ref={ref} className="flex-1 border border-journal-rule bg-journal-card p-4 font-plexmono text-[12px] text-journal-ink" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 0px, transparent 100%)" }}>
      <p className="font-plexmono text-[9px] uppercase tracking-[0.16em] text-journal-ink-soft">Shop receipt · traced</p>
      <div className="mt-2 space-y-2.5">
        {lines.map(([name, amt], i) => (
          <div key={name} className="flex items-center gap-2">
            <span className="flex-1 truncate">{name}<span className="mx-1 tracking-[0.2em] text-journal-rule">.............</span></span>
            <span>{amt}</span>
            <motion.span
              initial={{ opacity: 0, scale: 1.5, rotate: -14 }}
              animate={inView ? { opacity: 1, scale: 1, rotate: -6 } : {}}
              transition={reduce ? { duration: 0 } : { delay: 0.4 + i * 0.5, duration: 0.28, ease: "easeOut" }}
              className="inline-block border border-journal-stamp px-1 py-px font-plexmono text-[8px] uppercase tracking-[0.08em] text-journal-stamp"
            >
              Traced
            </motion.span>
          </div>
        ))}
        <div className="border-t border-dashed border-journal-rule pt-2 flex justify-between">
          <span>Total</span><span>85.00</span>
        </div>
      </div>
    </div>
  );
}

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

function PerforatedDivider({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 w-full ${className}`}
      style={{
        backgroundImage: "radial-gradient(circle, var(--j-rule) 1.3px, transparent 1.4px)",
        backgroundSize: "14px 3px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center",
      }}
    />
  );
}

function WashiTape({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute h-6 w-24 ${className}`}
      style={{
        background: "color-mix(in srgb, var(--j-stamp) 32%, transparent)",
        opacity: 0.75,
        transform: "rotate(-4deg)",
        clipPath: "polygon(2% 0, 98% 4%, 100% 96%, 0 100%)",
      }}
    />
  );
}

// One scrolling entry in the "Follow one hoodie" story.
function StopEntry({ stop, index, total, onActive }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-48% 0px -48% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  const isLabel = stop.code === "BD";
  return (
    <div ref={ref} className="flex min-h-[55vh] flex-col justify-center border-b border-journal-rule/70 py-10 last:border-b-0 md:min-h-[70vh]">
      <div className="font-plexmono text-[11px] uppercase tracking-[0.14em] text-journal-ink-soft">
        Stop {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {stop.country}
      </div>
      <h3 className="mt-2 font-serif-display text-4xl text-journal-ink md:text-[48px] md:leading-[1.05]" style={displayFont}>
        {stop.stage}
      </h3>
      <p className="mt-3 max-w-sm font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">{stop.note}.</p>
      <p className="mt-3 font-plexmono text-[11px] uppercase tracking-[0.12em] text-journal-ink-soft">
        {index === 0
          ? `Origin · ${stop.value}% of price ≈ ${formatMoney((market.price * stop.value) / 100, market.currency)}`
          : `+${Math.round(haversine(route[index - 1], stop)).toLocaleString()} km from ${route[index - 1].country} · ${stop.value}% ≈ ${formatMoney((market.price * stop.value) / 100, market.currency)}`}
      </p>
      <div className="mt-4">
        {isLabel ? (
          <MarginNote tone="stamp">read from the label</MarginNote>
        ) : (
          <MarginNote>estimated</MarginNote>
        )}
      </div>
    </div>
  );
}

export default function Landing() {
  const reduce = useReducedMotion();
  const [heroProgress, setHeroProgress] = useState(reduce ? 1 : 0);
  const [storyProgress, setStoryProgress] = useState(0);
  const labour = split.find((s) => s.key === "labour");
  const labourNote = `£${Math.round(labour.amount)} to the people who sewed it`;

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, 1, {
      duration: 4,
      ease: "easeInOut",
      delay: 0.8,
      onUpdate: (v) => setHeroProgress(v),
    });
    return () => controls.stop();
  }, [reduce]);

  const scrollToFollow = (e) => {
    e.preventDefault();
    document.getElementById("follow")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  const reveal = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.55, ease: "easeOut" },
        };

  const receiptLines = split.map((s) => ({
    key: s.key,
    label: RECEIPT_LABELS[s.key],
    amount: s.amount,
    color: CAT_INK[s.key],
  }));

  return (
    <div className="min-h-screen overflow-x-clip bg-journal-paper font-grotesk text-journal-ink">
      <PaperGrain />

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-serif-display text-2xl italic text-journal-ink" style={displayFont}>Jejak</span>
          <span className="hidden font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft sm:inline">
            Field journal · No. 001
          </span>
        </div>
        <nav className="flex items-center gap-5">
          <a href="#legwork" onClick={(e) => { e.preventDefault(); document.getElementById("legwork")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }} className="hidden font-grotesk text-sm text-journal-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp sm:inline">
            How it works
          </a>
          <a href="/atlas" onClick={(e) => { e.preventDefault(); document.getElementById("receipt")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }} className="hidden font-grotesk text-sm text-journal-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp md:inline">
            The Atlas
          </a>
          <JournalButton to="/trace">Trace something</JournalButton>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.1fr_1fr] md:gap-6 md:px-10 md:pt-14">
        <div className="flex flex-col">
          <motion.p {...reveal(0.05)} className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
            A field journal for the things you own
          </motion.p>
          <h1
            className="mt-5 font-serif-display font-medium leading-[0.92] text-journal-ink"
            style={{ ...displayFont, fontSize: "clamp(56px, 8vw, 128px)" }}
          >
            {["Every", "thing", "has", "a"].map((w, i) => (
              <motion.span key={i} {...reveal(0.15 + i * 0.08)} className="mr-[0.22em] inline-block">{w}</motion.span>
            ))}
            <motion.em {...reveal(0.5)} className="inline-block italic text-journal-stamp">journey.</motion.em>
          </h1>
          <motion.p {...reveal(0.65)} className="mt-6 max-w-md font-grotesk text-lg leading-relaxed text-journal-ink-soft">
            Snap anything you own. Jejak traces where it came from, who made it, and where your money went — and tells you how sure it is.
          </motion.p>
          <motion.div {...reveal(0.8)} className="mt-8 flex flex-wrap items-center gap-6">
            <JournalButton to="/trace">Trace something</JournalButton>
            <JournalButton href="#follow" variant="secondary" onClick={scrollToFollow}>
              Follow one hoodie
            </JournalButton>
          </motion.div>
          <motion.div {...reveal(1.0)} className="mt-auto pt-12">
            <p className="max-w-xs font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
              <span className="font-serif-display italic text-journal-ink">jejak</span>{" "}
              <span className="font-plexmono text-[11px]">/jə·dʒak/</span> (n.) Malay &amp; Indonesian — a trace; a footprint left behind.
            </p>
          </motion.div>
        </div>

        {/* Journal spread — two pages: polaroid left, route map right */}
        <motion.div {...(reduce ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.55, duration: 0.7, ease: "easeOut" } })} className="relative">
          <div className="relative rotate-[-1deg] border border-journal-rule bg-journal-card p-4 shadow-[0_18px_40px_-18px_rgba(30,27,22,0.35)] md:rotate-[-2deg] md:p-5">
            <WashiTape className="-top-3 left-8 z-10" />
            <div className="grid lg:grid-cols-[0.85fr_1.35fr]">
              {/* left page — polaroid */}
              <figure className="border border-journal-rule bg-journal-paper p-3 lg:mr-4 lg:self-start">
                <div className="aspect-[200/190]">
                  <Specimen id="hoodie" className="h-full w-full" title="Line drawing of a hoodie" />
                </div>
                <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-hand text-xl text-journal-ink">Everyday Hoodie</span>
                  <span className="font-plexmono text-[11px] text-journal-ink-soft">{formatMoney(market.price, market.currency, { minDigits: 0, maxDigits: 0 })}</span>
                </figcaption>
              </figure>
              {/* right page — route map filling the page */}
              <div className="mt-4 flex flex-col border-t border-dashed border-journal-rule pt-4 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                <div className="relative min-h-[260px] flex-1 md:min-h-[340px] lg:min-h-[380px]">
                  <RouteMap
                    stops={route}
                    progress={heroProgress}
                    stampAt={[0, 2, 5]}
                    stampClass="h-12 w-12 md:h-14 md:w-14"
                    padDegrees={8}
                    fill
                    reducedMotion={reduce}
                    className="absolute inset-0"
                    aria-label="Map of the hoodie's route from India to the United Kingdom"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-journal-rule/60 pt-2">
                  <MarginNote tone="stamp" arrow="right">cotton, probably India</MarginNote>
                  <MarginNote tone="stamp">read from the label!</MarginNote>
                  <MarginNote className="ml-auto">6 countries, 21,000 km</MarginNote>
                </div>
              </div>
            </div>
            <PerforatedDivider className="mt-4" />
            <div className="mt-3 flex items-center justify-between font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
              <span>Specimen 001 · Everyday Hoodie</span>
              <span>IN → CN → BD → SG → NL → GB</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Follow one hoodie ───────────────────────────────── */}
      <section id="follow" className="border-t border-journal-rule bg-journal-paper-deep/40">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
          <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">Field notes · entry 01–06</p>
          <h2 className="mt-3 font-serif-display text-4xl text-journal-ink md:text-6xl" style={displayFont}>
            Follow one <em className="italic">hoodie</em>
          </h2>

          <div className="mt-10 md:grid md:grid-cols-[1.4fr_1fr] md:gap-12">
            {/* Sticky map — top on mobile, left column on desktop */}
            <div className="sticky top-0 z-10 -mx-5 bg-journal-paper px-5 py-4 md:top-[8vh] md:mx-0 md:h-[80vh] md:self-start md:bg-transparent md:px-0 md:py-0">
              <div className="flex h-full flex-col border border-journal-rule bg-journal-card p-3 shadow-[0_10px_30px_-14px_rgba(30,27,22,0.25)]">
                <div className="relative max-h-[42vh] min-h-[200px] flex-1 md:max-h-none">
                  <RouteMap
                    stops={route}
                    progress={Math.max(storyProgress, 0.001)}
                    padDegrees={8}
                    fill
                    reducedMotion={reduce}
                    aria-label="Route map that fills in as you scroll the entries"
                    className="absolute inset-0"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
                  <span>route sketch</span>
                  <span>{Math.round(Math.min(storyProgress, 1) * (route.length - 1)) + 1} / {route.length} stops</span>
                </div>
              </div>
            </div>

            <div>
              {route.map((stop, i) => (
                <StopEntry
                  key={i}
                  stop={stop}
                  index={i}
                  total={route.length}
                  onActive={(idx) => setStoryProgress(idx / (route.length - 1))}
                />
              ))}
              <div className="py-10">
                <JournalButton to="/trace?sample=hoodie" variant="secondary">
                  Trace this hoodie yourself
                </JournalButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Receipt ─────────────────────────────────────────── */}
      <section id="receipt" className="border-t border-journal-rule">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1fr_1.1fr] md:px-10 md:py-24">
          <div className="flex flex-col justify-center">
            <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">The honest maths</p>
            <h2 className="mt-3 font-serif-display text-4xl leading-[1.02] text-journal-ink md:text-6xl" style={displayFont}>
              Where your {formatMoney(market.price, market.currency, { minDigits: 0, maxDigits: 0 })} went
            </h2>
            <blockquote className="mt-8 border-l-2 border-journal-stamp pl-5 font-serif-display text-2xl italic leading-snug text-journal-ink md:text-3xl" style={displayFont}>
              “Not a verdict. A starting point.”
            </blockquote>
            <p className="mt-5 max-w-sm font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
              Every figure is a range with a confidence level — some read from the label, some estimated from trade data and published disclosure. Jejak always says which is which.
            </p>
            <div className="mt-6">
              <Stamp country="United Kingdom" code="GB" date="TILL NO. 4" rotation={4} animate={!reduce} shape="rect" />
            </div>
          </div>
          <div className="relative flex items-center">
            <Receipt
              title="Jejak field receipt"
              lines={receiptLines}
              total={market.price}
              currency={market.currency}
              highlightKey="labour"
              highlightNote={labourNote}
              className="w-full max-w-md shadow-[0_16px_36px_-16px_rgba(30,27,22,0.3)]"
            />
          </div>
        </div>
      </section>

      {/* ── Jejak does the legwork ─────────────────────────── */}
      <section id="legwork" className="border-t border-journal-rule bg-journal-paper-deep/40">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
          <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">Automatic · runs on Base44</p>
          <h2 className="mt-3 font-serif-display text-4xl text-journal-ink md:text-6xl" style={displayFont}>
            Jejak does the <em className="italic">legwork</em>.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* receipt panel */}
            <div className="flex flex-col border border-journal-rule bg-journal-card p-5">
              <div className="flex-1">
                <LegworkReceipt />
              </div>
              <p className="mt-4 font-serif-display text-xl text-journal-ink" style={displayFont}>Snap a receipt. Every item, traced.</p>
              <JournalButton to="/trace" variant="secondary" className="mt-2">Trace a receipt</JournalButton>
            </div>
            {/* story panel */}
            <div className="flex flex-col border border-journal-rule bg-journal-card p-5">
              <div className="flex-1 border border-journal-rule bg-journal-paper p-4">
                <p className="font-serif-display text-lg italic text-journal-ink" style={displayFont}><TypeOnView text="Six countries in one hoodie" speed={45} /></p>
                <p className="mt-2 font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
                  <TypeOnView delay={900} speed={12} text="Your hoodie probably began as cotton in India, then crossed to China to be spun and dyed. The label says it was sewn in Bangladesh — that part we know. From there it likely sailed via Singapore and the Netherlands before reaching a UK high street, about 21,000 km later. Of your £120, roughly £9 reached the people who made it." />
                </p>
              </div>
              <p className="mt-4 font-serif-display text-xl text-journal-ink" style={displayFont}>A story, written for every entry.</p>
              <JournalButton to="/trace" variant="secondary" className="mt-2">Start an entry</JournalButton>
            </div>
            {/* letter panel */}
            <div className="flex flex-col border border-journal-rule bg-journal-card p-5">
              <LegworkLetter />
              <p className="mt-4 font-serif-display text-xl text-journal-ink" style={displayFont}>Ask the brand, without the awkwardness.</p>
              <p className="mt-1 font-grotesk text-[13px] text-journal-ink-soft">We draft a polite letter, you send it, we remind you if they go quiet.</p>
              <JournalButton to="/journal" variant="secondary" className="mt-2">See your letters</JournalButton>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Atlas ───────────────────────────────────────── */}
      <section className="border-t border-journal-rule">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
          <div className="flex flex-col justify-center">
            <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">The Atlas</p>
            <h2 className="mt-3 font-serif-display text-4xl text-journal-ink md:text-6xl" style={displayFont}>
              Where things <em className="italic">come from</em>
            </h2>
            <p className="mt-4 max-w-md font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
              Every public entry lands on a shared map of where things come from — hundreds of small journeys, one honest picture.
            </p>
            <div className="mt-6"><JournalButton to="/atlas">Open the Atlas</JournalButton></div>
          </div>
          <div className="border border-journal-rule bg-journal-card p-3 shadow-[0_10px_30px_-14px_rgba(30,27,22,0.25)]">
            <div className="relative h-[320px] md:h-[380px]">
              <RouteMap
                stops={route}
                progress={1}
                fill
                reducedMotion
                stampAt={[]}
                extraRoutes={PRODUCTS.filter((p) => p.id !== "hoodie").map((p) => [...p.route, p.finalStop.GB])}
                aria-label="Shared map of product journeys"
              />
            </div>
            <p className="mt-2 font-plexmono text-[9px] uppercase tracking-[0.12em] text-journal-ink-soft">Illustrative routes</p>
          </div>
        </div>
      </section>

      {/* ── Proof ───────────────────────────────────────────── */}
      <section className="border-t border-journal-rule bg-journal-paper-deep/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-10 px-5 py-16 md:px-10 md:py-20">
          <Stamp country="Verified" code="LEDGER" date="JEJAK" rotation={-6} className="h-24 w-24" />
          <div className="max-w-md">
            <h2 className="font-serif-display text-3xl text-journal-ink md:text-4xl" style={displayFont}>Proof, if you want it.</h2>
            <p className="mt-3 font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
              Any entry can be fingerprinted on a public ledger, so no one — including us — can quietly change it later.
            </p>
            <p className="mt-3 font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">Built on Stellar</p>
            <MarginNote className="mt-4 -rotate-1">
              from 2027, EU law makes brands publish this data — your journal is the other half.
            </MarginNote>
          </div>
        </div>
      </section>

      {/* ── For banks & shops ───────────────────────────────── */}
      <section className="border-t border-journal-rule">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-10">
          <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">For banks &amp; shops</p>
          <h2 className="mt-3 font-serif-display text-3xl text-journal-ink md:text-4xl" style={displayFont}>
            Imagine this beside every card payment.
          </h2>
          <JournalButton to="/embedded" variant="secondary" className="mt-4">See the bank demo</JournalButton>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-journal-rule">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-8 md:px-10">
          <span className="font-serif-display text-xl italic text-journal-ink" style={displayFont}>Jejak</span>
          <span className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
            Made with Base44 · 2026
          </span>
        </div>
      </footer>
    </div>
  );
}

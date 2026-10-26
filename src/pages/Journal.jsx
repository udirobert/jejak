import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useApp } from "@/lib/AppContext";
import { productFromScan, getProduct, DEMO_CHIPS } from "@/data";
import { formatMoney, computeSplit } from "@/lib/money";
import { routeDistance } from "@/lib/metrics";
import ScreenShell from "@/components/ScreenShell";
import Specimen from "@/components/journal/Specimen";
import MarginNote from "@/components/journal/MarginNote";
import JournalButton from "@/components/journal/JournalButton";

import RouteMap from "@/components/journal/RouteMap";
import Receipt from "@/components/journal/Receipt";
import StoryCard from "@/components/journal/StoryCard";
import AskBrandSheet from "@/components/journal/AskBrandSheet";
import DelegationCard from "@/components/journal/DelegationCard";
import Observations from "@/components/journal/Observations";
import PageLoader from "@/components/journal/PageLoader";
import WashiTape from "@/components/journal/WashiTape";
import { useCountUp } from "@/lib/useCountUp";
import { deriveObservations, openThreadSummary } from "@/lib/observations";
import { delegationState } from "@/lib/delegation";
import { toast } from "sonner";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

function LiveReceiptCard({ receiptId }) {
  const [rec, setRec] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  useEffect(() => {
    if (!receiptId) return;
    let mounted = true;
    base44.entities.Receipt.get(receiptId).then((r) => mounted && setRec(r)).catch(() => {});
    const unsub = base44.entities.Receipt.subscribe((event) => {
      if (event.data?.id === receiptId) setRec(event.data);
    });
    return () => { mounted = false; unsub && unsub(); };
  }, [receiptId]);
  // The paper original — shown beside its traced reading so the receipt
  // visibly becomes journal ink.
  useEffect(() => {
    if (!rec?.file_uri) return;
    let mounted = true;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: rec.file_uri })
      .then((r) => mounted && setPhotoUrl(r?.signed_url || null))
      .catch(() => {});
    return () => { mounted = false; };
  }, [rec?.file_uri]);
  if (!rec) return null;
  const currency = rec.currency || "GBP";
  const lines = (rec.items || []).map((it, i) => ({
    key: `${i}-${it.description}`,
    label: it.description,
    struck: it.status === "skipped" || it.status === "failed",
    amount: it.unit_price || 0,
    sub: it.status === "traced" ? "traced" : it.status === "skipped" ? "not traceable" : it.status === "failed" ? "couldn't trace" : "reading…",
  }));
  return (
    <div className="mb-10">
      <p className="font-plexmono text-[11px] uppercase tracking-[0.16em] text-journal-stamp">
        {rec.merchant || "Receipt"} {rec.purchase_date ? `· ${rec.purchase_date}` : ""} · {rec.status}
      </p>
      <div className="mt-3 flex flex-col items-start gap-5 sm:flex-row">
        {photoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10, rotate: -5 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-36 shrink-0 border border-journal-rule bg-journal-card p-1.5 shadow-[0_10px_24px_-14px_rgba(30,27,22,0.4)]"
          >
            <WashiTape />
            <img src={photoUrl} alt="Your original receipt" className="aspect-[3/4] w-full object-cover" />
            <p className="mt-1 pb-0.5 text-center font-hand text-sm leading-none text-journal-ink-soft">
              the original
            </p>
          </motion.div>
        )}
        <div className="w-full max-w-md flex-1">
          <Receipt
            title="Shop receipt · tracing"
            lines={lines}
            total={(rec.items || []).reduce((a, i) => a + (i.unit_price || 0) * (i.quantity || 1), 0)}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}

function EntrySheet({ scan, onClose, onOpenJourney }) {
  const product = productFromScan(scan);
  const [askOpen, setAskOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!scan) return null;
  const split = product ? computeSplit(product, scan.market || "GB") : [];
  const labour = split.find((s) => s.key === "labour");
  const routeCodes = (product?.route || []).map((s) => s.code || s.country?.slice(0, 2).toUpperCase()).join(" → ");

  const toggleVisibility = async () => {
    const v = scan.visibility === "public" ? "private" : "public";
    try {
      await base44.entities.Scan.update(scan.id, { visibility: v });
    } catch {
      toast.error("Couldn't update that.");
    }
  };

  const del = async () => {
    try {
      await base44.entities.Scan.delete(scan.id);
      onClose();
    } catch {
      toast.error("Couldn't delete it.");
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-journal-ink/40" onClick={onClose} />
      <motion.div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-journal-rule bg-journal-card p-6 pb-8 scrollbar-hide lg:mx-4"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
              {new Date(scan.created_date || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {scan.source || "trace"} · {scan.visibility === "public" ? "on the Atlas" : "private"}
            </p>
            <h3 className="mt-1 font-serif-display text-3xl text-journal-ink" style={displayFont}>{scan.product_name}</h3>
          </div>
          <Specimen product={product} className="h-14 w-14 shrink-0" />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <StoryCard
            scanId={scan.id}
            productName={scan.product_name}
            routeCodes={routeCodes}
            labourLine={labour ? `≈ ${formatMoney(labour.amount, scan.currency || "GBP")} to the people who made it` : ""}
            currency={scan.currency || "GBP"}
          />
          <div>
            {product?.route?.length > 0 && (
              <div className="border border-journal-rule bg-journal-paper p-2">
                <RouteMap stops={product.route} progress={1} width={400} height={240} padDegrees={8} stampAt={[]} aria-label={`Map of ${scan.product_name}'s route`} />
              </div>
            )}
            <div className="mt-3 space-y-1 font-plexmono text-[11px] uppercase tracking-[0.1em] text-journal-ink-soft">
              <p>{scan.origin} → {scan.market === "SG" ? "SG" : "UK"} · {(scan.distance_km || 0).toLocaleString()} km</p>
              <p>{formatMoney(scan.price || 0, scan.currency || "GBP")} · ~{scan.labour_pct}% to makers</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 border-t border-journal-rule pt-4">
          {product && <JournalButton onClick={() => onOpenJourney(scan)}>Open full journey</JournalButton>}
          <JournalButton variant="secondary" onClick={() => setAskOpen(true)} data-ask-brand>
            Ask the brand
          </JournalButton>
          <JournalButton variant="secondary" onClick={toggleVisibility}>
            {scan.visibility === "public" ? "Make private" : "Put on the Atlas"}
          </JournalButton>
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className="ml-auto min-h-[44px] font-grotesk text-sm text-journal-ink-soft underline underline-offset-4 no-tap hover:text-journal-stamp">Tear out</button>
          ) : (
            <span className="ml-auto flex items-center gap-2">
              <span className="font-grotesk text-sm text-journal-stamp">Tear this page out?</span>
              <button type="button" onClick={del} className="min-h-[44px] font-grotesk text-sm font-medium text-journal-ink underline no-tap">Yes</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-[44px] font-grotesk text-sm text-journal-ink-soft no-tap">Keep</button>
            </span>
          )}
        </div>
        <AskBrandSheet open={askOpen} onClose={() => setAskOpen(false)} scan={scan} product={product} />
      </motion.div>
    </motion.div>
  );
}

// Shown while the journal has no entries: specimen starters with their real
// routes and maker-share estimates, plus live entries from the public Atlas.
function EmptyJournal({ atlasScans, currency, market }) {
  const reduce = useReducedMotion();
  const starters = DEMO_CHIPS.map((c) => getProduct(c.id)).filter(Boolean);
  const field = atlasScans.slice(0, 3);

  const reveal = (delay) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.45, ease: "easeOut" } };

  return (
    <div className="mt-10 pb-16">
      <motion.p {...reveal(0)} className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
        Nothing pressed yet
      </motion.p>
      <motion.h2 {...reveal(0.06)} className="mt-2 max-w-2xl font-serif-display text-3xl text-journal-ink md:text-4xl" style={displayFont}>
        Give me one label. I'll trace the route, price the labour share, tell you how sure I am, and anchor the whole thing to a public ledger you can check without me.
      </motion.h2>
      <motion.p {...reveal(0.12)} className="mt-3 max-w-md font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
        Start with anything below if you'd rather see the shape of it first. Each one is a real supply chain we keep on the shelf.
      </motion.p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {starters.map((p, i) => {
          const codes = (p.route || []).map((s) => s.code || s.country?.slice(0, 2).toUpperCase()).join(" → ");
          const km = routeDistance(p, market);
          const labour = computeSplit(p, market).find((s) => s.key === "labour");
          return (
            <motion.div key={p.id} {...reveal(0.16 + i * 0.07)}>
              <Link
                to={`/trace?sample=${p.id}`}
                className="group block border border-journal-rule bg-journal-card p-4 text-left shadow-[3px_3px_0_0_transparent] transition-all no-tap hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--j-stamp)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
              >
                <div className="aspect-[200/160]">
                  <Specimen id={p.id} className="h-full w-full" title={`${p.name} illustration`} />
                </div>
                <p className="mt-3 font-serif-display text-lg leading-tight text-journal-ink" style={displayFont}>{p.name}</p>
                <p className="mt-1 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">{codes}</p>
                <p className="mt-2 border-t border-dotted border-journal-rule pt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
                  {km.toLocaleString()} km · ≈{labour ? formatMoney(labour.amount, currency, { minDigits: 0, maxDigits: 0 }) : "—"} to makers
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {field.length > 0 && (
        <motion.section {...reveal(0.5)} className="mt-10 border-t border-journal-rule pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-ink-soft">
              From the field · {atlasScans.length} {atlasScans.length === 1 ? "entry" : "entries"} on the Atlas
            </p>
            <JournalButton to="/atlas" variant="secondary">Open the Atlas</JournalButton>
          </div>
          <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {field.map((s) => {
              const p = productFromScan(s);
              const codes = (p?.route || []).map((x) => x.code || x.country?.slice(0, 2).toUpperCase()).join(" → ");
              return (
                <div key={s.id} className="flex w-56 shrink-0 snap-start items-start gap-3 border border-journal-rule bg-journal-card p-3">
                  <Specimen product={p} className="h-12 w-12 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-grotesk text-sm font-medium text-journal-ink">{s.product_name}</p>
                    <p className="truncate font-plexmono text-[9px] uppercase tracking-[0.1em] text-journal-ink-soft">{codes || s.origin}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      <motion.div {...reveal(0.6)} className="mt-8">
        <MarginNote write>or snap the thing in your hand — photos and receipts work too</MarginNote>
      </motion.div>
    </div>
  );
}

export default function Journal() {
  const { user, isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
  const { setProduct, setScreen } = useApp();
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scans, setScans] = useState([]);
  const [letters, setLetters] = useState([]);
  const [atlasScans, setAtlasScans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openLetter, setOpenLetter] = useState(null);
  const [nudgeFor, setNudgeFor] = useState(null);
  const receiptParam = searchParams.get("receipt");

  // Public Atlas entries feed the "from the field" strip (readable signed out).
  useEffect(() => {
    let mounted = true;
    base44.entities.Scan.filter({}, "-created_date", 50).then((r) => {
      if (mounted) setAtlasScans((r.items || r || []).filter((s) => s.visibility === "public"));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let mounted = true;
    // Scan read RLS also returns everyone's public Atlas entries; the journal shows only the user's own.
    const isMine = (s) => s && (s.created_by_id === user.id || s.owner_id === user.id);
    base44.entities.Scan.filter({ $or: [{ created_by_id: user.id }, { owner_id: user.id }] }, "-created_date", 50).then((r) => {
      if (mounted) setScans((r.items || r || []).filter(isMine));
    }).catch(() => {});
    base44.entities.BrandRequest.filter({}, "-created_date", 50).then((r) => {
      if (mounted) setLetters(r.items || r || []);
    }).catch(() => {});
    const unsub = base44.entities.Scan.subscribe((e) => {
      if (e.type !== "delete" && !isMine(e.data)) return;
      if (e.type === "create") setScans((p) => (p.some((x) => x.id === e.data.id) ? p : [e.data, ...p]));
      if (e.type === "update") setScans((p) => p.map((x) => (x.id === e.data.id ? e.data : x)));
      if (e.type === "delete") setScans((p) => p.filter((x) => x.id !== e.data.id));
      setSelected((sel) => (sel && e.data?.id === sel.id ? (e.type === "delete" ? null : e.data) : sel));
    });
    return () => { mounted = false; unsub && unsub(); };
  }, [isAuthenticated, user?.id]);

  const stats = useMemo(() => {
    const countries = new Set();
    let km = 0, labour = 0;
    for (const s of scans) {
      if (s.origin) countries.add(s.origin);
      km += s.distance_km || 0;
      labour += s.labour_amount || 0;
    }
    return { entries: scans.length, countries: countries.size, km, labour };
  }, [scans]);

  const aEntries = useCountUp(stats.entries, 700, reduce);
  const aCountries = useCountUp(stats.countries, 700, reduce);
  const aKm = useCountUp(stats.km, 900, reduce);
  const aLabour = useCountUp(stats.labour, 900, reduce, 2);

  // What the app noticed on its own — only shown once there's something to
  // notice. Derived from the journal's own records, never invented.
  const observations = useMemo(
    () => deriveObservations({ scans, letters }),
    [scans, letters]
  );

  // The delegated items, ordered by how much they need the user.
  const delegated = useMemo(() => {
    const rank = { overdue: 0, flagged: 1, escalated: 2, drafted: 3, awaiting: 4, replied: 5, closed: 6 };
    return [...letters]
      .map((rec) => ({ rec, state: delegationState(rec) }))
      .filter((x) => x.state && x.state.key !== "closed")
      .sort((a, b) => (rank[a.state.key] ?? 9) - (rank[b.state.key] ?? 9));
  }, [letters]);

  const openThread = openThreadSummary(letters);

  const openJourney = (scan) => {
    const p = productFromScan(scan);
    if (!p) return;
    setProduct(p);
    setScreen("journey");
    navigate("/trace");
  };

  // Handlers for what the observations ask for.
  const onObservationAction = (o) => {
    switch (o.action?.kind) {
      case "nudge": {
        const rec = letters.find((l) => l.id === o.action.value);
        if (rec) {
          // Open the delegated item itself and let it draw the follow-up,
          // rather than just the letter.
          setNudgeFor(rec.id);
          requestAnimationFrame(() => {
            document.getElementById("on-my-desk")?.scrollIntoView({
              block: "center",
              behavior: reduce ? "auto" : "smooth",
            });
          });
        }
        break;
      }
      case "send": {
        const rec = letters.find((l) => l.id === o.action.value);
        if (rec) setOpenLetter(rec);
        break;
      }
      case "ask": {
        // Open the newest trace of that brand so the letter can be drafted
        // against it — asking needs an item to ask about.
        const brand = (o.action.value || "").toLowerCase();
        const scan = scans.find((s) => (s.brand || "").toLowerCase() === brand) || scans[0];
        if (scan) {
          setSelected(scan);
          setTimeout(() => document.querySelector('[data-ask-brand]')?.click(), 400);
        } else {
          navigate("/trace");
        }
        break;
      }
      case "trace":
        navigate("/trace");
        break;
      case "filter":
      default:
        navigate("/journal");
        break;
    }
  };

  if (isLoadingAuth) {
    return (
      <ScreenShell section="Journal">
        <PageLoader label="Opening your journal" note="checking the shelf…" />
      </ScreenShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenShell section="Journal">
        <div className="flex flex-1 flex-col items-start justify-center px-5 py-24 lg:px-10">
          <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">Your journal</p>
          <h1 className="mt-3 font-serif-display text-5xl text-journal-ink" style={displayFont}>Your journal</h1>
          <p className="mt-4 max-w-sm font-grotesk text-[15px] text-journal-ink-soft">
            Sign in and everything you trace gets pressed into these pages — stories, receipts, and the letters you send brands.
          </p>
          <div className="mt-6"><JournalButton onClick={navigateToLogin}>Sign in</JournalButton></div>
        </div>
        <EmptyJournal atlasScans={atlasScans} currency="GBP" market="GB" />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell section={`Journal · ${stats.entries} entries`}>
      <div className="px-5 pt-6 lg:px-10 lg:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif-display text-5xl text-journal-ink" style={displayFont}>Your journal</h1>
            <p className="mt-2 font-plexmono text-[11px] uppercase tracking-[0.14em] text-journal-ink-soft">
              {aEntries} entries · {aCountries} countries · {aKm.toLocaleString()} km · ≈{formatMoney(aLabour, "GBP")} estimated to makers
            </p>
            {openThread && (
              <p className="mt-1 font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
                {openThread}
              </p>
            )}
          </div>
          <JournalButton to="/trace">Trace something</JournalButton>
        </div>

        {observations.length > 0 && (
          <Observations observations={observations} onAction={onObservationAction} reduce={reduce} />
        )}

        <div className="mt-8">
          {(receiptParam || scans.length === 0) && receiptParam && <LiveReceiptCard receiptId={receiptParam} />}
        </div>

        {scans.length === 0 && !receiptParam && <EmptyJournal atlasScans={atlasScans} currency="GBP" market="GB" />}

        <div className="mt-8 grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {scans.map((s, i) => {
            const p = productFromScan(s);
            const codes = (p?.route || []).map((x) => x.code || x.country?.slice(0, 2).toUpperCase()).join(" → ");
            return (
              <motion.button
                key={s.id}
                type="button"
                onClick={() => setSelected(s)}
                initial={reduce ? false : { opacity: 0, y: 14, rotate: -0.8 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.05, duration: 0.4, ease: "easeOut" }}
                className="border border-journal-rule bg-journal-card p-4 text-left shadow-[3px_3px_0_0_transparent] transition-all no-tap hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--j-stamp)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
              >
                <div className="flex items-start justify-between">
                  <Specimen product={p} className="h-14 w-14" />
                  <span className="font-plexmono text-[9px] uppercase tracking-[0.12em] text-journal-ink-soft">
                    {s.visibility === "public" ? "on the Atlas" : "private"}
                  </span>
                </div>
                <p className="mt-3 font-serif-display text-lg leading-tight text-journal-ink" style={displayFont}>{s.product_name}</p>
                <p className="mt-1 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">{codes || s.origin}</p>
                <p className="mt-2 border-t border-dotted border-journal-rule pt-2 font-hand text-lg leading-tight text-journal-ink-soft">
                  {s.story_status === "done" && s.story_title ? s.story_title : "story on its way"}
                </p>
              </motion.button>
            );
          })}
        </div>

        {delegated.length > 0 && (
          <section id="on-my-desk" className="scroll-mt-10 border-t border-journal-rule pb-16 pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif-display text-3xl text-journal-ink" style={displayFont}>On my desk</h2>
              <p className="font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
                things you handed off
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {delegated.map(({ rec }) => (
                <DelegationCard
                  key={rec.id}
                  record={rec}
                  autoNudge={nudgeFor === rec.id}
                  onUpdate={async (id, patch) => {
                    await base44.entities.BrandRequest.update(id, patch);
                    setLetters((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
                  }}
                  onOpen={setOpenLetter}
                  reduce={reduce}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {selected && <EntrySheet scan={selected} onClose={() => setSelected(null)} onOpenJourney={openJourney} />}
      </AnimatePresence>

      <AskBrandSheet open={!!openLetter} onClose={() => setOpenLetter(null)} record={openLetter} />
    </ScreenShell>
  );
}

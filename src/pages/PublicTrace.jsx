import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { productFromScan } from "@/data";
import { formatMoney, computeSplit } from "@/lib/money";
import { annotateRoute } from "@/lib/provenance";
import ScreenShell from "@/components/ScreenShell";
import Specimen from "@/components/journal/Specimen";
import RouteMap from "@/components/journal/RouteMap";
import MarginNote from "@/components/journal/MarginNote";
import Stamp from "@/components/journal/Stamp";
import JournalButton from "@/components/journal/JournalButton";
import GuessField from "@/components/journal/GuessField";
import StoryCard from "@/components/journal/StoryCard";
import { corroboration, corroborationLine } from "@/components/explore/exploreUtils";
import { setPageMeta, resetPageMeta, traceUrl } from "@/lib/share";
import { toast } from "sonner";
import { Copy, ExternalLink, Share2 } from "lucide-react";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

// A shared trace.
//
// This is the other half of the social layer: the Atlas is where traces
// gather, and this is the page a link actually points at. No sign-in, no
// app chrome beyond the tab bar — a page torn out of a field journal.
//
// Everything shown here is already public by the owner's choice: the entry
// was published to the Atlas. What it adds is the two things a shared link
// should answer — what do other people think, and what did they agree on.

export default function PublicTrace() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [scan, setScan] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing | private
  const [siblings, setSiblings] = useState([]);
  const [pool, setPool] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setState("loading");
    setScan(null);
    setSiblings([]);
    setPool(null);
    if (!scanId) {
      setState("missing");
      return;
    }
    base44.entities.Scan.get(scanId)
      .then(async (s) => {
        if (!alive) return;
        if (!s) { setState("missing"); return; }
        setScan(s);
        setState("ready");
        // The rest of the field for this product — for corroboration.
        base44.entities.Scan
          .filter({ product_id: s.product_id }, "-created_date", 50)
          .then((page) => {
            if (!alive) return;
            const items = page?.items || page || [];
            setSiblings(items.filter((x) => x && x.visibility !== "private"));
          })
          .catch(() => {});
        // How many people have put a belief on the record for this one.
        // The pool is keyed by category, so this is the whole category's
        // field, not just this one entry.
        const poolKey = s.hs || (productFromScan(s)?.hs) || s.product_id;
        base44.functions
          .invoke("guessPool", { action: "pool_state", product_id: poolKey })
          .then((r) => {
            const d = r?.data || r;
            if (alive && d?.ok) setPool(d);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (alive) setState("private");
      });
    return () => { alive = false; };
  }, [scanId]);

  // Page metadata for the shared link.
  useEffect(() => {
    if (state !== "ready" || !scan) return;
    const corr = corroboration(siblings);
    const where = scan.origin ? ` · made in ${scan.origin}` : "";
    setPageMeta({
      title: `${scan.product_name} — Jejak${where}`,
      description: `Traced ${scan.product_name}${where}. ${(scan.labour_pct ?? 0)}% estimated to have reached the people who made it. Every figure is a range.`,
      url: traceUrl(scan.id),
    });
    return () => resetPageMeta();
  }, [state, scan, siblings]);

  const product = useMemo(() => productFromScan(scan), [scan]);
  const market = scan?.market === "SG" ? "SG" : "GB";
  const currency = scan?.currency || (market === "SG" ? "SGD" : "GBP");
  const route = useMemo(
    () => (product ? annotateRoute(product, market, null) : []),
    [product, market]
  );
  const split = useMemo(
    () => (product ? computeSplit(product, market, "split", scan?.price || undefined) : []),
    [product, market, scan?.price]
  );
  const labour = split.find((s) => s.key === "labour");

  const corr = corroboration(siblings);
  const corrLine = corroborationLine(corr);

  const shareTrace = async () => {
    if (!scan) return;
    const url = traceUrl(scan.id);
    const text = `I traced a ${scan.product_name} — only ${scan.labour_pct}% reached the makers. Can you find a fairer one? ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${scan.product_name} — Jejak`, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // cancelled
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(traceUrl(scan?.id));
      setCopied(true);
      toast.success("Link copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  if (state === "loading") {
    return (
      <ScreenShell section="Trace · shared">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
          <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-ink-soft">
            Fetching the entry…
          </p>
        </div>
      </ScreenShell>
    );
  }

  if (state !== "ready" || !scan) {
    return (
      <ScreenShell section="Trace · shared">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <Stamp country="Not found" code="— — —" date="JEJAK" rotation={-6} className="h-16 w-16" />
          <h1 className="mt-4 font-serif-display text-3xl text-journal-ink" style={displayFont}>
            {state === "private" ? "This entry is private" : "No entry at that address"}
          </h1>
          <p className="mt-2 max-w-sm font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
            {state === "private"
              ? "Its owner kept it in their own journal. Only published entries can be opened by a link."
              : "The link may have been copied wrong, or the entry has been torn out."}
          </p>
          <div className="mt-5">
            <JournalButton to="/trace">Trace something</JournalButton>
          </div>
        </div>
      </ScreenShell>
    );
  }

  const url = traceUrl(scan.id);

  return (
    <ScreenShell section="Trace · shared">
      <div className="px-5 pb-16 pt-6 lg:px-10 lg:pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
              A shared trace
            </p>
            <h1 className="mt-2 font-serif-display text-4xl leading-[1.05] text-journal-ink md:text-5xl" style={displayFont}>
              {scan.product_name}
            </h1>
            <p className="mt-2 font-plexmono text-[11px] uppercase tracking-[0.14em] text-journal-ink-soft">
              {scan.origin} → {market === "SG" ? "Singapore" : "the UK"} ·{" "}
              {(scan.distance_km || 0).toLocaleString()} km ·{" "}
              {formatMoney(scan.price || 0, currency, { minDigits: 0, maxDigits: 0 })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex min-h-[44px] items-center gap-1.5 font-grotesk text-sm text-journal-ink underline decoration-journal-stamp underline-offset-4 no-tap hover:text-journal-stamp"
            >
              <Copy size={14} /> {copied ? "Copied" : "Copy link"}
            </button>
            <JournalButton onClick={shareTrace} className="gap-1.5">
              <Share2 size={14} /> Share
            </JournalButton>
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          {/* the trace */}
          <div>
            <div className="flex items-start gap-4 border-b border-dotted border-journal-rule pb-5">
              <Specimen product={product} className="h-20 w-20 shrink-0" />
              <div className="min-w-0">
                <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
                  Estimated to reach the people who made it
                </p>
                <p className="mt-1 font-serif-display text-3xl text-journal-ink" style={displayFont}>
                  {scan.labour_pct ?? 0}%
                </p>
                {labour && (
                  <p className="mt-1 font-grotesk text-[13px] text-journal-ink-soft">
                    {formatMoney(labour.amountLow, currency)}–{formatMoney(labour.amountHigh, currency)} ·{" "}
                    {labour.confidence === "high" ? "sure" : labour.confidence === "medium" ? "fairly sure" : "a rough guess"}
                  </p>
                )}
              </div>
            </div>

            {route.length > 0 && (
              <div className="mt-6 border border-journal-rule bg-journal-card p-2">
                <RouteMap
                  stops={route}
                  progress={1}
                  width={520}
                  height={280}
                  padDegrees={8}
                  stampAt={[]}
                  aria-label={`Route of ${scan.product_name}`}
                />
              </div>
            )}

            <div className="mt-6">
              <StoryCard
                scanId={scan.id}
                productName={scan.product_name}
                routeCodes={(route || []).map((s) => s.code || s.country?.slice(0, 2)).join(" → ")}
                labourLine={labour ? `≈ ${formatMoney(labour.amount, currency)} to the people who made it` : ""}
                currency={currency}
              />
            </div>
          </div>

          {/* the field */}
          <div>
            {/* Corroboration — what people agree on, not what they rate. */}
            {corrLine && (
              <div className="border-l-2 border-journal-stamp pl-4">
                <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
                  What people agree on
                </p>
                <p className="mt-1.5 font-serif-display text-2xl leading-tight text-journal-ink" style={displayFont}>
                  {corrLine}
                </p>
                <div className="mt-2">
                  <MarginNote tone="ink">
                    the same conclusion, reached separately
                  </MarginNote>
                </div>
              </div>
            )}

            {/* The wager's field for this product. The distribution is only
                public once the product has been revealed — before that,
                showing it would let a guesser copy the crowd. */}
            {pool && pool.pool_size > 0 && (
              <div className={corrLine ? "mt-8" : ""}>
                <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-stamp">
                  What people believed
                </p>
                {pool.revealed && pool.field_pcts?.length ? (
                  <>
                    <div className="mt-3">
                      <GuessField
                        fieldPcts={pool.field_pcts}
                        actualPct={scan.labour_pct ?? null}
                        estimate={labour ? { low: labour.pct.low, high: labour.pct.high } : null}
                        reduce={reduce}
                      />
                    </div>
                    <p className="mt-2 font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
                      {pool.pool_size} {pool.pool_size === 1 ? "person has" : "people have"} put a
                      belief on the record for this one.
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 font-grotesk text-[14px] leading-relaxed text-journal-ink">
                    {pool.pool_size} {pool.pool_size === 1 ? "person has" : "people have"} guessed
                    the maker share for this one.
                  </p>
                )}
              </div>
            )}

            {/* the proof */}
            {scan.stellar_tx_hash && (
              <div className={corrLine || pool?.pool_size ? "mt-8" : ""}>
                <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
                  On the record
                </p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${scan.stellar_tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-grotesk text-sm text-journal-ink underline decoration-journal-stamp underline-offset-4 no-tap hover:text-journal-stamp"
                >
                  open the anchoring transaction
                  <ExternalLink size={13} />
                </a>
              </div>
            )}

            <div className={corrLine || pool?.pool_size || scan.stellar_tx_hash ? "mt-8" : ""}>
              <p className="font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
                Trace one of your own and see whether you land in the same place.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <JournalButton onClick={() => navigate(`/trace?sample=${scan.product_id}`)}>
                  Trace one like this
                </JournalButton>
                <button
                  type="button"
                  onClick={() => navigate("/atlas")}
                  className="min-h-[44px] font-grotesk text-sm text-journal-ink-soft underline decoration-journal-stamp/40 underline-offset-4 no-tap hover:text-journal-ink"
                >
                  See the Atlas
                </button>
              </div>
            </div>

            <p className="mt-8 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
              {url}
            </p>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { computeSplit, getRoute } from "@/lib/money";
import { getTradeEvidence, originCountry } from "@/lib/provenance";
import { routeDistance } from "@/lib/metrics";

// The visible labour of a trace.
//
// Each step is work the app actually did, with the data it produced attached
// — not a status message. The steps land one at a time so the user watches
// the reasoning happen instead of being handed an answer that was already
// sitting in a table.
//
// Everything here reads from the same helpers the rest of the app uses, so
// the trace can't drift from the numbers shown later.

const CONFIDENCE_WORD = { high: "sure", medium: "fairly sure", low: "rough guess" };
const MARKET_NAME = { GB: "the UK", SG: "Singapore" };

export default function TraceSteps({
  product,
  market,
  attributes,
  labelEvidence = null,
  skip = 0,
  title = "What I did",
  reduce: reduceProp,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceProp ?? reduceMotion;
  const [revealed, setRevealed] = useState(0);
  const doneRef = useRef(false);

  const { steps, verdict } = useMemo(() => {
    const out = [];
    const marketName = MARKET_NAME[market] || "your market";

    // 1. What the app actually saw.
    const attrEntries = attributes
      ? Object.entries(attributes).filter(([, v]) => v && String(v).trim())
      : [];
    const labelCountry = (labelEvidence?.country_of_manufacture || "").trim();
    const labelIsDemo = Boolean(labelEvidence?.isSampleLabel);
    out.push({
      id: "vision",
      label: labelCountry ? "I read your label" : "I read your photo",
      detail: labelCountry
        ? `Made in ${labelCountry}${labelIsDemo ? " · sample label (demo)" : ""}${
            labelEvidence?.fibre_composition ? ` · ${labelEvidence.fibre_composition}` : ""
          }`
        : attrEntries.length
          ? attrEntries.map(([k, v]) => `${k} ${v}`).join(" · ")
          : product
            ? "no text I could read — I worked from the shape of the thing"
            : null,
      done: Boolean(labelCountry || product || attrEntries.length),
    });

    if (product) {
      // 2. The product type it settled on, and the code that carries it.
      const evidence = getTradeEvidence(product, market);
      const hsLabel = evidence?.label;
      out.push({
        id: "match",
        label: "I matched it to a product type",
        detail: [
          product.name,
          product.category,
          product.hs ? `HS ${product.hs}` : null,
          hsLabel ? `— ${hsLabel.toLowerCase()}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        done: true,
      });

      // 3. The trade record it pulled for this market.
      out.push({
        id: "trade",
        label: `I pulled import data for ${marketName}`,
        detail: evidence
          ? `${evidence.partners.length} supplying countries · ${evidence.period} · ${evidence.source}${
              evidence.partners[0]
                ? ` · ${evidence.partners[0].country} alone is ${evidence.partners[0].share}%`
                : ""
            }`
          : "no trade record for this category — I estimated from the route alone",
        done: true,
      });

      // 4. The route it built.
      const route = getRoute(product, market) || [];
      const km = routeDistance(product, market);
      out.push({
        id: "route",
        label: "I built the route",
        detail: `${route.length} stops · ${km.toLocaleString()} km to ${marketName}`,
        done: true,
      });

      // 5. The split, with the honesty attached to it.
      const split = computeSplit(product, market);
      const labour = split.find((s) => s.key === "labour");
      out.push({
        id: "split",
        label: "I estimated the split",
        detail: labour
          ? `makers get ${Math.round(labour.pct.low)}–${Math.round(labour.pct.high)}% of what you paid · I'm ${
              CONFIDENCE_WORD[labour.confidence] || "fairly sure"
            }`
          : null,
        done: true,
      });

      // The verdict — the app in the first person, with its reasons.
      // The reason has to actually follow: the share quoted is the
      // origin's own share of the market, not the biggest supplier's.
      const origin = originCountry(product, market, labelEvidence);
      const partnerForOrigin = evidence?.partners?.find(
        (p) => p.country?.toLowerCase() === origin?.toLowerCase()
      );
      const originShare = partnerForOrigin?.share ?? null;
      const itemWord = (hsLabel || "imports").toLowerCase();
      const confidenceWord =
        CONFIDENCE_WORD[labelEvidence?.confidence || product.confidence] || "fairly sure";

      const verdict = labelCountry
        ? `I'm ${confidenceWord}. The label says ${labelCountry}${
            originShare != null
              ? `, and trade data agrees — ${origin} supplies ${originShare}% of ${marketName}'s ${itemWord}`
              : ""
          }.`
        : originShare != null
          ? `I'm ${confidenceWord}. ${origin} supplies ${originShare}% of ${marketName}'s ${itemWord}, so I routed the final stage there — that's the category though, not your item.`
          : `I'm ${confidenceWord}. I routed the final stage to ${origin} from what this category usually looks like. Only a label settles it.`;

      return { steps: out.filter((s) => s.detail !== null || !s.done).slice(skip), verdict };
    }

    return { steps: out.filter((s) => s.detail !== null || !s.done).slice(skip), verdict: null };
  }, [product, market, attributes, labelEvidence, skip]);

  // Reveal one step at a time. The last one lands just before the handoff.
  useEffect(() => {
    if (reduce) {
      setRevealed(steps.length);
      return;
    }
    setRevealed(0);
    const timers = steps.map((_, i) => setTimeout(() => setRevealed(i + 1), 340 * i + 180));
    return () => timers.forEach(clearTimeout);
  }, [steps.length, reduce, product?.id]);

  // Held in a ref so the callback identity doesn't re-trigger the effect.
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  useEffect(() => {
    if (revealed < steps.length || steps.length === 0) return;
    // Give the closing verdict a beat to be read before the handoff.
    const t = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      completeRef.current?.();
    }, reduce ? 0 : 1100);
    return () => clearTimeout(t);
  }, [revealed, steps.length, reduce]);

  if (steps.length === 0) return null;

  const visible = Math.max(revealed, 1);
  const done = revealed >= steps.length;

  return (
    <div className="w-full">
      <p className="mb-3 text-center font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">
        {title}
      </p>
      <ol className="space-y-0">
        {steps.slice(0, visible).map((s, i) => {
          const pending = !s.done || (revealed <= i && !reduce);
          const isLast = i === steps.length - 1;
          return (
            <motion.li
              key={s.id}
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="flex items-start gap-2.5 border-b border-dotted border-journal-rule py-2 last:border-b-0"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                {pending && !isLast ? (
                  <Loader2 size={13} className="animate-spin text-journal-stamp" />
                ) : (
                  <Check size={13} className="text-journal-stamp" strokeWidth={2.5} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-plexmono text-[11px] uppercase tracking-[0.1em] text-journal-ink">
                  {s.label}
                </span>
                {s.detail && (
                  <span className="mt-0.5 block font-grotesk text-[12px] leading-snug text-journal-ink-soft">
                    {s.detail}
                  </span>
                )}
              </span>
            </motion.li>
          );
        })}
      </ol>

      {!done && (
        <div className="flex items-center gap-2 pt-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-journal-stamp" />
          <span className="font-plexmono text-[11px] text-journal-ink-soft">working…</span>
        </div>
      )}

      {done && verdict && (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-3 border-l-2 border-journal-stamp pl-3 font-hand text-xl leading-tight text-journal-ink"
        >
          {verdict}
        </motion.p>
      )}
    </div>
  );
}

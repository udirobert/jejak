import React from "react";
import { motion } from "framer-motion";
import { DEMO_CHIPS, getProduct } from "@/data";
import { computeSplit, formatMoney, getRoute } from "@/lib/money";
import { TAP } from "@/lib/motion";
import { Sparkles, ArrowUpRight, MapPin } from "lucide-react";

// 2x2 Bento grid of curated demo products showing live price, origin route,
// mini 5-category cost bar, and both full-journey tap + instant receipt jump.
export default function DemoProductGrid({
  market,
  currency,
  onPickFlow,
  onJumpReceipt,
  onOpenFallback,
}) {
  return (
    <div className="mt-4 rounded-3xl frosted-strong border border-white/80 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-jejak-navy/65">
          <Sparkles size={13} className="text-jejak-goldDeep" /> Instant demo traces
        </p>
        <span className="text-[10px] font-bold text-jejak-navy/45">
          Tap for route · ↗ for receipt
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {DEMO_CHIPS.map((c) => {
          const prod = getProduct(c.id);
          const price = prod.markets[market].price;
          const split = computeSplit(prod, market, "split");
          const labour = split.find((s) => s.key === "labour");
          const route = getRoute(prod, market);
          const originCountry = route[0]?.country || "Origin";
          const destCode = market === "SG" ? "SG" : "UK";

          return (
            <motion.div
              key={c.id}
              whileTap={TAP}
              onClick={() => onPickFlow(c.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPickFlow(c.id);
                }
              }}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/90 bg-white/85 p-3 text-left shadow-sm transition-all hover:bg-white hover:shadow-md cursor-pointer no-tap"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lilac-peach text-xl">
                    {c.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-jejak-navy">
                      {c.label}
                    </p>
                    <p className="text-xs font-extrabold text-jejak-navy/80 tabular-nums">
                      {formatMoney(price, currency)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpReceipt(c.id);
                  }}
                  title="Jump straight to Money Split receipt"
                  aria-label={`Open ${c.label} receipt directly`}
                  className="flex h-6 items-center gap-0.5 rounded-full bg-jejak-navy/8 px-2 text-[10px] font-extrabold text-jejak-navy/70 hover:bg-jejak-navy hover:text-white transition-colors no-tap"
                >
                  Receipt <ArrowUpRight size={11} />
                </button>
              </div>

              {/* Origin + maker share */}
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold">
                <span className="flex items-center gap-1 text-jejak-navy/60 truncate">
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">
                    {originCountry} → {destCode}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-jejak-labour/15 px-1.5 py-0.5 text-[10px] font-extrabold text-jejak-labour tabular-nums">
                  {labour.pct.mid}% maker
                </span>
              </div>

              {/* Mini 5-color split bar */}
              <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-jejak-navy/10">
                {split.map((seg) => (
                  <div
                    key={seg.key}
                    style={{ width: `${seg.pct.mid}%`, background: seg.color }}
                    className="h-full"
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <button
          type="button"
          onClick={onOpenFallback}
          className="font-bold text-jejak-navy/55 underline-offset-2 hover:underline no-tap"
        >
          Camera not working? Pick manually
        </button>
        <span className="font-semibold text-jejak-navy/45">
          {routeSummaryLabel(market)}
        </span>
      </div>
    </div>
  );
}

function routeSummaryLabel(market) {
  return market === "SG" ? "SG market prices" : "UK market prices";
}
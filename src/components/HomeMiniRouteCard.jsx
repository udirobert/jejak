import React from "react";
import { useReducedMotion } from "framer-motion";
import { formatMoney, getRoute, computeSplit } from "@/lib/money";
import { MapSvgFlag } from "@/components/explore/OriginFlagChip";
import ProductIllustrationIcon from "@/components/explore/ProductIllustrationIcon";
import { ShieldCheck, ArrowUpRight, Compass } from "lucide-react";

// Dark-ocean mini route preview card on Home (reusing Explore's #153963 palette).
// Before the first trace: shows a tasteful preview of what a traced result looks like.
// After the first trace: shows the user's latest traced product and its corridor.
export default function HomeMiniRouteCard({
  product,
  market,
  currency,
  hasTraced,
  onInspectJourney,
}) {
  const reduce = useReducedMotion();
  const route = getRoute(product, market);
  const originCountry = route[0]?.country || "Bangladesh";
  const midCountry = route[1]?.country || "India";
  const destCountry =
    route[route.length - 1]?.country ||
    (market === "SG" ? "Singapore" : "United Kingdom");
  const price = product.markets[market].price;
  const split = computeSplit(product, market, "split", price);
  const labour = split.find((s) => s.key === "labour");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onInspectJourney}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onInspectJourney();
        }
      }}
      aria-label={`Inspect ${product.name} supply chain route`}
      className="mt-3 rounded-3xl bg-[#153963] border border-white/25 p-3.5 text-white shadow-lg cursor-pointer hover:brightness-105 transition-all no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
          <Compass size={11} />
          {hasTraced ? "Latest traced route" : "Sample trace preview"}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/75">
          <ShieldCheck size={11} className="text-jejak-materials" /> Verified on
          Stellar
        </span>
      </div>

      {/* Mini dark-ocean route map SVG */}
      <div className="relative mt-2 h-16 w-full overflow-hidden rounded-2xl bg-[#0F2B4C] border border-white/15 px-3 flex items-center">
        <svg
          viewBox="0 0 320 56"
          className="w-full h-14 overflow-visible"
          aria-hidden="true"
        >
          <path
            d="M 28 38 Q 115 10 165 30 T 292 22"
            fill="none"
            stroke="#2D5BFF"
            strokeWidth="3"
            opacity="0.35"
            strokeLinecap="round"
          />
          <path
            d="M 28 38 Q 115 10 165 30 T 292 22"
            fill="none"
            stroke="#FFC24B"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
          >
            {!reduce && (
              <animate
                attributeName="stroke-dashoffset"
                from="20"
                to="0"
                dur="1.8s"
                repeatCount="indefinite"
              />
            )}
          </path>

          {/* Stop 1: Origin */}
          <g transform="translate(28, 38)">
            <circle r="5" fill="#FF7A1A" stroke="#fff" strokeWidth="1.5" />
            <MapSvgFlag
              country={originCountry}
              x={0}
              y={-15}
              width={14}
              height={10}
            />
          </g>

          {/* Stop 2: Hub */}
          <g transform="translate(165, 30)">
            <circle r="4.5" fill="#2D5BFF" stroke="#fff" strokeWidth="1.5" />
            <MapSvgFlag
              country={midCountry}
              x={0}
              y={-14}
              width={13}
              height={9}
            />
          </g>

          {/* Stop 3: Destination */}
          <g transform="translate(292, 22)">
            <circle r="5" fill="#2FBF71" stroke="#fff" strokeWidth="1.5" />
            <MapSvgFlag
              country={destCountry}
              x={0}
              y={-15}
              width={14}
              height={10}
            />
          </g>
        </svg>
      </div>

      {/* Bottom product & honesty row */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <ProductIllustrationIcon productId={product.id} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">
              {product.name} · {formatMoney(price, currency)} ·{" "}
              <span className="text-amber-300">
                {labour?.pct?.mid || 7.5}% to makers
              </span>
            </p>
            <p className="text-[10px] font-semibold text-white/70 truncate">
              {originCountry} → {market === "SG" ? "SG" : "UK"} · Illustrative
              routes, not live tracking
            </p>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-white">
          Open <ArrowUpRight size={11} />
        </span>
      </div>
    </div>
  );
}
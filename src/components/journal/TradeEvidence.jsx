import React from "react";

const MARKET_NAME = { GB: "the UK", SG: "Singapore" };

// "Who supplies {market} with {category}" — thin ink bars of the top import
// partners for the evidence stop's HS code, from the UN Comtrade snapshot.
export default function TradeEvidence({ evidence, highlightCountry, market }) {
  if (!evidence) return null;

  const marketName = MARKET_NAME[market] || market;
  const top = evidence.partners.slice(0, 5);
  const hl = (highlightCountry || "").trim().toLowerCase();
  let rows = top;
  let highlight = null;

  if (hl) {
    highlight = evidence.partners.find(
      (p) => p.code === highlightCode(hl, evidence.partners) || p.country.toLowerCase() === hl
    );
    if (highlight && !rows.some((p) => p.code === highlight.code)) {
      const rank = evidence.partners.indexOf(highlight);
      if (rank >= 5 && rank <= 7) rows = [...top, highlight];
    }
  }

  const maxShare = Math.max(...rows.map((p) => p.share), 1);

  return (
    <div className="mt-3 border border-journal-rule bg-journal-paper/70 p-3">
      <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink">
        Who supplies {marketName} with {evidence.label.toLowerCase()}
      </p>
      <div className="mt-2 space-y-1">
        {rows.map((p) => {
          const isHl = highlight && p.code === highlight.code;
          return (
            <div key={p.code} className="flex items-center gap-2">
              <span
                className={`w-28 shrink-0 truncate font-plexmono text-[10px] uppercase tracking-[0.08em] ${
                  isHl ? "text-journal-stamp" : "text-journal-ink-soft"
                }`}
              >
                {p.country}
              </span>
              <div className="h-[3px] flex-1 bg-journal-rule/50">
                <div
                  className={`h-full ${isHl ? "bg-journal-stamp" : "bg-journal-ink"}`}
                  style={{ width: `${Math.max(2, (p.share / maxShare) * 100)}%` }}
                />
              </div>
              <span
                className={`w-10 shrink-0 text-right font-plexmono text-[10px] ${
                  isHl ? "text-journal-stamp" : "text-journal-ink-soft"
                }`}
              >
                {p.share}%
              </span>
            </div>
          );
        })}
      </div>
      {hl && !highlight && (
        <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.08em] text-journal-stamp">
          {highlightCountry} isn't among the top suppliers — treat this stop as a rough guess
        </p>
      )}
      <p className="mt-2 font-plexmono text-[9px] uppercase tracking-[0.1em] text-journal-ink-soft">
        UN Comtrade · {evidence.period} imports by value · HS {evidence.hs}
        {evidence.proxy ? " · broad category" : ""}
        {evidence.matchedBy === "ai" ? " · category matched by AI" : ""}
      </p>
    </div>
  );
}

function highlightCode(hl, partners) {
  const byName = partners.find((p) => p.country.toLowerCase() === hl);
  return byName ? byName.code : hl.toUpperCase();
}

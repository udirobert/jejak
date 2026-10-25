// Provenance evidence — the single source of truth for which route stop the
// label facts and the UN Comtrade trade snapshot speak to. Used by Journey,
// the proof record, saveTrace, Home and Explore.
import countries from "../data/trade/countries.json" with { type: "json" };
import importsSnapshot from "../data/trade/imports.json" with { type: "json" };
import { getRoute } from "./money.js";

// Display-name / alias -> ISO alpha-2. Only names the data can't express go here.
const NAME_ALIASES = {
  "viet nam": "VN",
  vietnam: "VN",
  turkey: "TR",
  "türkiye": "TR",
  usa: "US",
  us: "US",
  "united states of america": "US",
  "united states": "US",
  uk: "GB",
  "united kingdom": "GB",
  "great britain": "GB",
  britain: "GB",
  korea: "KR",
  "rep. of korea": "KR",
  "south korea": "KR",
  "china, hong kong sar": "HK",
  "hong kong": "HK",
};

const BY_CODE = {};
const BY_NAME = {};
for (const [code, c] of Object.entries(countries)) {
  if (code.startsWith("_") || !c || !c.name) continue;
  BY_CODE[code] = { code, name: c.name, point: c.point };
  BY_NAME[c.name.toLowerCase()] = BY_CODE[code];
}

// nameOrCode: ISO2 code or display name (case-insensitive), aliases accepted.
export function countryByName(nameOrCode) {
  const key = String(nameOrCode || "").trim().toLowerCase();
  if (!key) return null;
  if (/^[a-z]{2}$/.test(key)) {
    const hit = BY_CODE[key.toUpperCase()];
    if (hit) return hit;
  }
  if (BY_NAME[key]) return BY_NAME[key];
  const alias = NAME_ALIASES[key];
  return alias ? BY_CODE[alias] || null : null;
}

export function countryPoint(nameOrCode) {
  return countryByName(nameOrCode)?.point || null;
}

const FARM_HS_CODES = new Set(["090111", "0902"]);

// Trade evidence for a product in a market, or null when the product has no
// HS code or the snapshot doesn't cover that market/code.
export function getTradeEvidence(product, market) {
  const hs = product?.hs;
  const cat = hs ? importsSnapshot.categories[hs] : null;
  const snap = hs ? importsSnapshot.markets?.[market]?.[hs] : null;
  if (!cat || !snap) return null;
  return {
    hs,
    label: cat.label,
    proxy: Boolean(cat.proxy),
    period: snap.period,
    totalUsd: snap.totalUsd,
    partners: (snap.partners || []).map((p) => ({
      code: p.code,
      country: BY_CODE[p.code]?.name || p.country,
      share: p.share,
      point: BY_CODE[p.code]?.point || null,
    })),
    stageKind: FARM_HS_CODES.has(hs) ? "raw_material" : "final_manufacture",
    matchedBy: product.aiGenerated ? "ai" : "curated",
    source: "UN Comtrade",
    sourceUrl: "https://comtradeplus.un.org/",
  };
}

// Index (within getRoute output) of the one stop the label + trade data speak to.
export function evidenceIndex(product, market) {
  const route = getRoute(product, market) || [];
  if (!route.length) return -1;
  const evidence = getTradeEvidence(product, market);
  const stageKind = evidence?.stageKind || "final_manufacture";
  const hasKinds = route.some((s) => s.kind);

  if (hasKinds) {
    if (stageKind === "raw_material") {
      const i = route.findIndex((s) => s.kind === "raw_material");
      if (i >= 0) return i;
    } else {
      const i = route.findIndex((s) => s.kind === "final_manufacture");
      if (i >= 0) return i;
    }
  }
  // Legacy AI products without kind: last stop before the final retail stop
  // that isn't logistics, else route.length - 2.
  for (let i = route.length - 2; i >= 0; i--) {
    if (route[i].kind !== "logistics") return i;
  }
  return Math.max(0, route.length - 2);
}

const sameCountry = (a, b) =>
  Boolean(a && b) &&
  (a.toLowerCase() === b.toLowerCase() ||
    countryByName(a)?.code === countryByName(b)?.code);

// Route stops each annotated with { provenanceBasis, provenanceConfidence,
// tradeShare, isEvidenceStop }.
export function annotateRoute(product, market, labelEvidence) {
  const route = getRoute(product, market) || [];
  const evIdx = evidenceIndex(product, market);
  const evidence = getTradeEvidence(product, market);
  const partnerByCode = new Map((evidence?.partners || []).map((p) => [p.code, p]));

  const realLabel = Boolean(labelEvidence?.readable) && !labelEvidence?.isSampleLabel;
  const sampleLabel = Boolean(labelEvidence?.readable) && Boolean(labelEvidence?.isSampleLabel);

  return route.map((stop, i) => {
    if (i !== evIdx) {
      return {
        ...stop,
        provenanceBasis: "Estimated",
        provenanceConfidence: product.confidence || "medium",
        tradeShare: null,
        isEvidenceStop: false,
      };
    }

    const base = {
      ...stop,
      isEvidenceStop: true,
    };

    if (realLabel || sampleLabel) {
      const country = labelEvidence.country_of_manufacture || stop.country;
      const hit = countryByName(country);
      const partner = hit ? partnerByCode.get(hit.code) : partnerByCode.get(stop.code);
      return {
        ...base,
        country,
        code: hit?.code || stop.code,
        provenanceBasis: realLabel ? "Read from label" : "Sample label",
        provenanceConfidence: realLabel ? "high" : product.confidence || "medium",
        tradeShare: partner?.share ?? null,
      };
    }

    // Match the stop's country to the trade partners: by code first, then name.
    let partner = stop.code ? partnerByCode.get(stop.code) : null;
    if (!partner) {
      const hit = countryByName(stop.country);
      if (hit) partner = partnerByCode.get(hit.code) || null;
    }
    if (partner) {
      return {
        ...base,
        country: partner.country || stop.country,
        provenanceBasis: "Trade data",
        provenanceConfidence: "medium",
        tradeShare: partner.share,
      };
    }
    return {
      ...base,
      provenanceBasis: "Estimated",
      provenanceConfidence: "low",
      tradeShare: null,
    };
  });
}

// The country where it was made — the evidence stop's country after annotation.
export function originCountry(product, market, labelEvidence) {
  const annotated = annotateRoute(product, market, labelEvidence);
  if (!annotated.length) return "";
  const idx = annotated.findIndex((s) => s.isEvidenceStop);
  return annotated[idx >= 0 ? idx : annotated.length - 2]?.country || "";
}

// Shared "trace anything" engine — turns a product description into a Jejak
// product object via InvokeLLM, then normalizes it into the app's product shape.
import { buildTracePrompt, TRACE_SCHEMA, BASIS_LABELS } from "./prompts.ts";

export interface TraceInput {
  description: string;
  market: "GB" | "SG";
  price?: number | null;
  brand?: string;
  labelCountry?: string;
  labelMaterials?: string;
}

const CATEGORY_KEYS = ["materials", "labour", "freight", "brand", "retail"] as const;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const roundHalf = (v: number) => Math.round(v * 2) / 2;

const EARTH_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(s));
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "item";
}

async function tinyHash(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 6);
}

const FINAL_STOPS = {
  GB: { stage: "Sold", country: "United Kingdom", code: "GB", lat: 51.5, lng: -0.12, note: "Where you bought it" },
  SG: { stage: "Sold", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Where you bought it" },
};

function normalizeRoute(rawRoute: any[], input: TraceInput) {
  const labelCountry = (input.labelCountry || "").trim().toLowerCase();
  return (Array.isArray(rawRoute) ? rawRoute : [])
    .filter(
      (s) =>
        s && typeof s.country === "string" && s.country.trim() &&
        typeof s.lat === "number" && s.lat >= -90 && s.lat <= 90 &&
        typeof s.lng === "number" && s.lng >= -180 && s.lng <= 180
    )
    .slice(0, 5)
    .map((s) => {
      const matchesLabel = labelCountry && s.country.trim().toLowerCase() === labelCountry;
      return {
        stage: String(s.stage || "Stage").slice(0, 40),
        country: s.country.trim(),
        code: /^[A-Za-z]{2}$/.test(s.code || "") ? s.code.toUpperCase() : "",
        lat: s.lat,
        lng: s.lng,
        note: String(s.note || "").slice(0, 80),
        basis: matchesLabel ? "Read from label" : "Estimated",
        confidence: matchesLabel ? "high" : s.confidence === "low" ? "low" : "medium",
      };
    });
}

function normalizeSplit(rawSplit: any) {
  const out: Record<string, any> = {};
  let midSum = 0;
  for (const k of CATEGORY_KEYS) {
    const e = rawSplit?.[k] || {};
    const p = e.pct || {};
    const low = clamp(Number(p.low) || 0, 0, 100);
    const mid = clamp(Number(p.mid) || 0, 0, 100);
    const high = clamp(Number(p.high) || 0, 0, 100);
    out[k] = {
      low,
      mid,
      high,
      confidence: e.confidence === "medium" ? "medium" : "low",
      basis: (BASIS_LABELS as readonly string[]).includes(e.basis) ? e.basis : "AI inference",
    };
    midSum += mid;
  }
  // Scale mids to sum exactly 100, rounded to 0.5; remainder goes to retail.
  if (midSum > 0 && midSum !== 100) {
    for (const k of CATEGORY_KEYS) out[k].mid = roundHalf((out[k].mid / midSum) * 100);
  }
  const rounded = CATEGORY_KEYS.reduce((a, k) => a + out[k].mid, 0);
  out.retail.mid = clamp(out.retail.mid + (100 - rounded), 0, 100);
  for (const k of CATEGORY_KEYS) {
    out[k].low = Math.min(out[k].low, out[k].mid);
    out[k].high = Math.max(out[k].high, out[k].mid);
  }
  return Object.fromEntries(CATEGORY_KEYS.map((k) => [k, { pct: { low: out[k].low, mid: out[k].mid, high: out[k].high }, confidence: out[k].confidence, basis: out[k].basis }]));
}

function transparentAlt(split: Record<string, { pct: { low: number; mid: number; high: number } }>) {
  const adjust = { labour: 6, materials: 2, brand: -4, retail: -4, freight: 0 };
  const mids: Record<string, number> = {};
  for (const k of CATEGORY_KEYS) mids[k] = Math.max(1, split[k].pct.mid + adjust[k]);
  const sum = CATEGORY_KEYS.reduce((a, k) => a + mids[k], 0);
  for (const k of CATEGORY_KEYS) mids[k] = roundHalf((mids[k] / sum) * 100);
  const rounded = CATEGORY_KEYS.reduce((a, k) => a + mids[k], 0);
  mids.retail = Math.max(1, mids.retail + (100 - rounded));
  const out: Record<string, any> = {};
  for (const k of CATEGORY_KEYS) {
    out[k] = {
      pct: { low: Math.max(0, mids[k] - 3), mid: mids[k], high: Math.min(100, mids[k] + 3) },
      confidence: "low",
      basis: "AI inference",
    };
  }
  return out;
}

// Pure normalization — exported for tests.
export async function normalizeTrace(raw: any, input: TraceInput) {
  if (!raw || raw.traceable === false) return { ok: false as const, reason: "not_traceable" as const };
  const route = normalizeRoute(raw.route, input);
  if (route.length === 0) return { ok: false as const, reason: "bad_output" as const };

  const split = normalizeSplit(raw.split);
  const price = (input.price ?? 0) > 0 ? Number(input.price) : raw.estimated_price > 0 ? raw.estimated_price : 20;
  const currency = input.market === "SG" ? "SGD" : "GBP";
  const otherMarket = input.market === "SG" ? "GB" : "SG";
  const otherPrice = input.market === "SG" ? Math.round((price / 1.7) * 100) / 100 : Math.round(price * 1.7 * 100) / 100;
  const otherCurrency = otherMarket === "SG" ? "SGD" : "GBP";

  const product = {
    id: `ai-${slug(raw.name || input.description)}-${await tinyHash(input.description)}`,
    name: String(raw.name || input.description).slice(0, 40),
    emoji: "",
    category: String(raw.category || "goods").toLowerCase(),
    brand: input.brand || raw.brand || "",
    confidence: raw.overall_confidence === "medium" ? "medium" : "low",
    aiGenerated: true,
    markets: {
      [input.market]: { currency, price, retailer: "Shop" },
      [otherMarket]: { currency: otherCurrency, price: otherPrice, retailer: "Shop", converted: true },
    },
    split,
    route,
    finalStop: FINAL_STOPS,
    labourContext: String(raw.labour_context || ""),
    transparentAlternative: {
      note: "Illustrative scenario for a fairer brand — not a specific real company.",
      split: transparentAlt(split),
    },
  };
  return { ok: true as const, product };
}

export async function traceItem(base44: any, input: TraceInput) {
  const currency = input.market === "SG" ? "SGD" : "GBP";
  const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: buildTracePrompt({
      description: input.description,
      market: input.market,
      currency,
      price: input.price ?? null,
      labelCountry: input.labelCountry,
      labelMaterials: input.labelMaterials,
      brand: input.brand,
    }),
    response_json_schema: TRACE_SCHEMA,
  });
  return normalizeTrace(raw, input);
}

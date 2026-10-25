import { getRoute, formatMoney } from "./money";

// Impact metrics for the receipt carousel. Each is computed from the product's
// own route/split data or from a cited public rate. Every metric carries a
// confidence level and a basis label — no fabricated sources.

const EARTH_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;

export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(s));
}

// 1. Distance travelled — great-circle sum of the route stops. Safest metric.
export function routeDistance(product, market) {
  const route = getRoute(product, market);
  let total = 0;
  for (let i = 1; i < route.length; i++) total += haversine(route[i - 1], route[i]);
  return Math.round(total);
}

// 2. Tax included in the shelf price. UK VAT 20% (gov.uk), SG GST 9% (IRAS).
const TAX = {
  GB: { rate: 0.2, name: "VAT", source: "gov.uk" },
  SG: { rate: 0.09, name: "GST", source: "IRAS" },
};
export function taxAmount(product, market, overridePrice = null) {
  const price = overridePrice != null && overridePrice > 0 ? overridePrice : product.markets[market].price;
  const t = TAX[market];
  return { amount: (price * t.rate) / (1 + t.rate), rate: t.rate, name: t.name, source: t.source };
}

// 3. Card / payment fees. UK interchange capped under PSD2 (~1.5% all-in);
// Singapore is uncapped (~2%). Shown as an estimate.
const PAYMENT_FEE = { GB: 0.015, SG: 0.02 };
export function paymentFee(product, market, overridePrice = null) {
  const price = overridePrice != null && overridePrice > 0 ? overridePrice : product.markets[market].price;
  return { amount: price * PAYMENT_FEE[market], rate: PAYMENT_FEE[market], source: "PSD2 interchange cap" };
}

// 4. Hours to earn the shelf price at a garment worker's wage.
// Bangladesh garment minimum wage raised to 12,500 BDT/month (Dec 2023),
// roughly US$0.55/hr at a 208-hour month. Expressed in the shelf currency
// via a fixed USD cross-rate so no live conversion runs at view time.
const WAGE_USD = { mid: 0.55, low: 0.65, high: 0.45 }; // high wage → fewer hours
const USD_TO = { GBP: 1 / 1.27, SGD: 1 / 0.74 };
export function hoursToEarn(product, market, currency, overridePrice = null) {
  const price = overridePrice != null && overridePrice > 0 ? overridePrice : product.markets[market].price;
  const x = USD_TO[currency] || USD_TO.GBP;
  const hours = Math.round(price / (WAGE_USD.mid * x));
  const low = Math.round(price / (WAGE_USD.low * x));
  const high = Math.round(price / (WAGE_USD.high * x));
  return { hours, low, high, source: "Bangladesh min wage, Dec 2023" };
}

export function buildMetrics(product, market, currency, overridePrice = null) {
  const dist = routeDistance(product, market);
  const tax = taxAmount(product, market, overridePrice);
  const fee = paymentFee(product, market, overridePrice);
  const hrs = hoursToEarn(product, market, currency, overridePrice);
  const weeks = Math.max(1, Math.round(hrs.hours / 40));
  return [
    {
      key: "distance",
      label: "Distance travelled",
      value: `${dist.toLocaleString()} km`,
      everyday: dist > 20000 ? "more than halfway round the planet" : "a long way to reach you",
      confidence: "high",
      basis: "Route data",
      color: "#2D5BFF",
      source: "Computed from route stops",
    },
    {
      key: "hours",
      label: "Hours to earn it",
      value: `~${hrs.hours}`,
      everyday: `about ${weeks} forty-hour week${weeks > 1 ? "s" : ""} for a garment worker`,
      range: `${hrs.low}–${hrs.high} hrs`,
      confidence: "low",
      basis: "national minimum wage (2023)",
      color: "#FF7A1A",
      source: "Bangladesh garment min wage, Dec 2023",
    },
    {
      key: "tax",
      label: "Where the tax went",
      value: formatMoney(tax.amount, currency),
      everyday: `${tax.name} at ${(tax.rate * 100).toFixed(0)}%, already in the price`,
      confidence: "high",
      basis: tax.source,
      color: "#8B5CF6",
      source: tax.source,
    },
    {
      key: "payment",
      label: "What the payment cost",
      value: formatMoney(fee.amount, currency),
      everyday: `card fees before the retailer sees a penny`,
      confidence: "medium",
      basis: "PSD2 interchange cap",
      color: "#FF3D81",
      source: "UK interchange cap (PSD2)",
    },
  ];
}
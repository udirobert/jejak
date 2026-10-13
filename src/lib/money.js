import { CATEGORIES } from "./tokens";

// Returns the full route (base stops + market-specific final stop) for a product.
export function getRoute(product, market) {
  const base = product.route || [];
  const final = product.finalStop?.[market];
  return final ? [...base, final] : base;
}

// Per-category computed amounts for a product + market, using mid percentages.
export function computeSplit(product, market, scenario = "split") {
  const m = product.markets[market];
  const price = m.price;
  const split = scenario === "transparent" ? product.transparentAlternative.split : product.split;
  return CATEGORIES.map((cat) => {
    const entry = split[cat.key];
    const mid = entry.pct.mid;
    return {
      key: cat.key,
      label: cat.label,
      color: cat.color,
      pct: entry.pct,
      confidence: entry.confidence,
      basis: entry.basis,
      amount: (price * mid) / 100,
      amountLow: (price * entry.pct.low) / 100,
      amountHigh: (price * entry.pct.high) / 100,
    };
  });
}

export function marketForCurrency(currency) {
  return currency === "SGD" ? "SG" : "GB";
}

export function currencyForMarket(market) {
  return market === "SG" ? "SGD" : "GBP";
}

const currencyLocale = { GBP: "en-GB", SGD: "en-SG" };
const currencySymbol = { GBP: "£", SGD: "S$" };

export function formatMoney(amount, currency, opts = {}) {
  const locale = currencyLocale[currency] || "en-GB";
  const nf = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: opts.minDigits ?? (currency === "SGD" ? 2 : 2),
    maximumFractionDigits: opts.maxDigits ?? 2,
  });
  return nf.format(amount);
}

// Compact money for small amounts (e.g. 7.5p per £1). Keeps one decimal
// where needed so 7.5% renders as "7.5p", not a rounded "8p".
export function formatSmallMoney(amount, currency) {
  const units = Math.round(amount * 1000) / 10; // pence/cents, 1 decimal
  const label = Number.isInteger(units) ? `${units}` : units.toFixed(1);
  return currency === "GBP" ? `${label}p` : `${label}¢`;
}

export function currencySymbolOf(currency) {
  return currencySymbol[currency] || "£";
}

// Sum of mid percentages — must always be 100.
export function sumMid(split) {
  return CATEGORIES.reduce((acc, c) => acc + split[c.key].pct.mid, 0);
}

// Per-unit (per £1 / per S$1) garment-worker share, as a small money string.
export function labourPerUnit(split, currency) {
  const labour = split.labour.pct;
  return {
    low: labour.low / 100,
    mid: labour.mid / 100,
    high: labour.high / 100,
    lowLabel: formatSmallMoney(labour.low / 100, currency),
    midLabel: formatSmallMoney(labour.mid / 100, currency),
    highLabel: formatSmallMoney(labour.high / 100, currency),
  };
}
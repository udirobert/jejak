// Everyday Hoodie — the deeply-built demo product.
// All money is stored as percentages (low/mid/high). Mid values sum to exactly 100.
// No fabricated sources: basis labels come only from the allowed set.
export const hoodie = {
  id: "hoodie",
  hs: "6110",
  name: "Everyday Hoodie",
  emoji: "🧥",
  confidence: "medium",
  markets: {
    GB: { currency: "GBP", price: 120, retailer: "High-street retailer" },
    SG: { currency: "SGD", price: 100, retailer: "Local retailer" },
  },
  split: {
    materials: { pct: { low: 12, mid: 15, high: 18 }, confidence: "medium", basis: "AI inference" },
    labour: { pct: { low: 6, mid: 7.5, high: 10 }, confidence: "medium", basis: "AI inference" },
    freight: { pct: { low: 7, mid: 9.5, high: 11 }, confidence: "medium", basis: "AI inference" },
    brand: { pct: { low: 24, mid: 28, high: 32 }, confidence: "low", basis: "AI inference" },
    retail: { pct: { low: 36, mid: 40, high: 44 }, confidence: "medium", basis: "AI inference" },
  },
  route: [
    { stage: "Cotton farming", kind: "raw_material", country: "India", code: "IN", lat: 21.0, lng: 78.0, note: "Cotton grown and harvested", value: 15 },
    { stage: "Spinning & dyeing", kind: "processing", country: "China", code: "CN", lat: 30.0, lng: 120.0, note: "Fibre spun into yarn and dyed", value: 10 },
    { stage: "Cut & sew", kind: "final_manufacture", country: "Bangladesh", code: "BD", lat: 23.7, lng: 90.4, note: "Garments assembled by hand", value: 7.5 },
    { stage: "Freight hub", kind: "logistics", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Transshipment port", value: 9.5 },
    { stage: "Warehouse", kind: "logistics", country: "Netherlands", code: "NL", lat: 52.1, lng: 5.3, note: "European distribution centre", value: 28 },
  ],
  finalStop: {
    GB: { stage: "Sold", country: "United Kingdom", code: "GB", lat: 51.5, lng: -0.12, note: "High-street retailer", value: 40 },
    SG: { stage: "Sold", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Local retailer", value: 40 },
  },
  labourContext:
    "Most cut-and-sew for hoodies at this price happens in Bangladesh, where garment-industry wages are among the lowest in the world for apparel exporters. The labour share here is an estimate of wages paid, not the worker's take-home after deductions.",
  transparentAlternative: {
    note: "Illustrative scenario for a transparent brand — not a specific real company.",
    split: {
      materials: { pct: { low: 18, mid: 22, high: 26 }, confidence: "medium", basis: "AI inference" },
      labour: { pct: { low: 14, mid: 18, high: 22 }, confidence: "medium", basis: "AI inference" },
      freight: { pct: { low: 8, mid: 10, high: 12 }, confidence: "medium", basis: "AI inference" },
      brand: { pct: { low: 18, mid: 20, high: 24 }, confidence: "low", basis: "AI inference" },
      retail: { pct: { low: 26, mid: 30, high: 34 }, confidence: "low", basis: "AI inference" },
    },
  },
  // TODO: when real sources are verified, add a `sources` array here with title + url.
};